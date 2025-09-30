import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import { CitySelector } from '../components/CityAutocomplete'
import AnnouncementPreview from '../components/AnnouncementPreview'
import { DatePicker, TimePicker } from '../components/DateTimePicker'

const CreateSenderAnnouncementScreen: React.FC = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { theme } = useTheme()

  const handleGoBack = () => {
    navigation.goBack()
  }

  const [departureCity, setDepartureCity] = useState('')
  const [arrivalCity, setArrivalCity] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [weight, setWeight] = useState('')
  const [description, setDescription] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverEmail, setReceiverEmail] = useState('')
  const [packageValue, setPackageValue] = useState('')
  const [isFragile, setIsFragile] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handlePreview = () => {
    if (!departureCity || !arrivalCity || !date || !weight || !receiverName || !receiverPhone || !receiverEmail) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }
    setShowPreview(true)
  }

  const handleConfirm = async () => {
    try {
      // Vérifier si le receveur existe déjà
      const { data: existingReceiver, error: checkError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('email', receiverEmail.toLowerCase())
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        throw checkError
      }

      const { data, error } = await supabase.from('announcements').insert({
        user_id: user!.id,
        announcement_type: 'send_request',
        departure_city: departureCity,
        arrival_city: arrivalCity,
        date,
        time: time || null,
        weight: parseFloat(weight),
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_email: receiverEmail.toLowerCase(),
        package_value: packageValue ? parseFloat(packageValue) : null,
        is_fragile: isFragile,
        is_urgent: isUrgent,
        description,
      }).select()

      if (error) {
        console.error('Error creating sender announcement:', error)
        Alert.alert('Erreur', 'Erreur lors de la création: ' + error.message)
      } else {
        // Create ColiSpace automatically with sender and receiver
        const { data: coliSpace, error: coliSpaceError } = await supabase
          .from('coli_spaces')
          .insert({
            announcement_id: data[0].id,
            sender_id: user!.id,
            receiver_name: receiverName,
            receiver_phone: receiverPhone,
            receiver_email: receiverEmail.toLowerCase(),
            receiver_address: '', // Could be added later if needed
            status: 'created'
          })
          .select()
          .single()

        if (coliSpaceError) {
          console.error('Error creating ColiSpace:', coliSpaceError)
          // Continue anyway, don't block the announcement creation
        }

        Alert.alert('Succès', 'Votre demande d\'envoi a été créée !')
        // Reset form
        setDepartureCity('')
        setArrivalCity('')
        setDate('')
        setTime('')
        setWeight('')
        setDescription('')
        setReceiverName('')
        setReceiverPhone('')
        setReceiverEmail('')
        setPackageValue('')
        setIsFragile(false)
        setIsUrgent(false)
        setShowPreview(false)
        // Navigate to home
        navigation.navigate('Main' as never)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      Alert.alert('Erreur', 'Erreur inattendue: ' + err)
    }
  }

  const handleEdit = () => {
    setShowPreview(false)
  }

  if (showPreview) {
    const announcementData = {
      user_id: user!.id,
      announcement_type: 'send_request' as const,
      departure_city: departureCity,
      arrival_city: arrivalCity,
      date,
      time,
      weight: parseFloat(weight),
      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      receiver_email: receiverEmail.toLowerCase(),
      package_value: packageValue ? parseFloat(packageValue) : undefined,
      is_fragile: isFragile,
      is_urgent: isUrgent,
      description,
    }

    return (
      <AnnouncementPreview
        announcement={announcementData}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        theme={theme}
        type="send_request"
      />
    )
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme === 'dark' ? '#121212' : '#f8f9fa' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={theme === 'dark' ? '#fff' : '#000'} 
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>
            Envoyer un colis
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
            Trouvez un transporteur de confiance
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Trajet Section */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardIcon, { color: '#28A745' }]}></Text>
            <Text style={[styles.cardTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Trajet souhaité</Text>
          </View>

          <View style={styles.inputGroup}>
            <CitySelector
              value={departureCity}
              onChangeText={setDepartureCity}
              placeholder="Ville d'envoi"
            />

            <CitySelector
              value={arrivalCity}
              onChangeText={setArrivalCity}
              placeholder="Ville de destination"
            />

            <DatePicker
              value={date}
              onChangeText={setDate}
              placeholder="Date souhaitée"
            />

            <TimePicker
              value={time}
              onChangeText={setTime}
              placeholder="Heure (optionnel)"
            />
          </View>
        </View>

        {/* Colis Section */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardIcon, { color: '#28A745' }]}></Text>
            <Text style={[styles.cardTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Détails du colis</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: theme === 'dark' ? '#ccc' : '#666' }]}>Poids (kg)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }]}
                  placeholder="0"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholderTextColor={theme === 'dark' ? '#666' : '#ccc'}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: theme === 'dark' ? '#ccc' : '#666' }]}>Valeur (FCFA)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }]}
                  placeholder="0"
                  value={packageValue}
                  onChangeText={setPackageValue}
                  keyboardType="numeric"
                  placeholderTextColor={theme === 'dark' ? '#666' : '#ccc'}
                />
              </View>
            </View>

            <TextInput
              style={[styles.textArea, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }]}
              placeholder="Description du colis..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor={theme === 'dark' ? '#666' : '#ccc'}
            />

            <View style={styles.optionsGroup}>
              <TouchableOpacity
                style={[styles.optionRow, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa' }]}
                onPress={() => setIsFragile(!isFragile)}
              >
                <View style={styles.optionLeft}>
                  <Text style={[styles.optionEmoji, { color: '#ff6b6b' }]}></Text>
                  <Text style={[styles.optionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Colis fragile</Text>
                </View>
                <View style={[styles.toggle, isFragile && styles.toggleActive]}>
                  <Text style={styles.toggleText}>{isFragile ? '✓' : '✗'}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionRow, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa' }]}
                onPress={() => setIsUrgent(!isUrgent)}
              >
                <View style={styles.optionLeft}>
                  <Text style={[styles.optionEmoji, { color: '#ffa500' }]}></Text>
                  <Text style={[styles.optionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Livraison urgente</Text>
                </View>
                <View style={[styles.toggle, isUrgent && styles.toggleActive]}>
                  <Text style={styles.toggleText}>{isUrgent ? '✓' : '✗'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Destinataire Section */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardIcon, { color: '#28A745' }]}></Text>
            <Text style={[styles.cardTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Destinataire</Text>
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }]}
              placeholder="Nom complet"
              value={receiverName}
              onChangeText={setReceiverName}
              placeholderTextColor={theme === 'dark' ? '#666' : '#ccc'}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }]}
              placeholder="Numéro de téléphone"
              value={receiverPhone}
              onChangeText={setReceiverPhone}
              keyboardType="phone-pad"
              placeholderTextColor={theme === 'dark' ? '#666' : '#ccc'}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }]}
              placeholder="Adresse email"
              value={receiverEmail}
              onChangeText={setReceiverEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme === 'dark' ? '#666' : '#ccc'}
            />

            <View style={[styles.infoBox, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f9ff' }]}>
              <Text style={[styles.infoText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
                Si le destinataire n'a pas de compte, il recevra une invitation automatique
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <TouchableOpacity
          style={[styles.submitButton, (!departureCity || !arrivalCity || !date || !weight || !receiverName || !receiverPhone || !receiverEmail) && styles.submitButtonDisabled]}
          onPress={handlePreview}
          disabled={!departureCity || !arrivalCity || !date || !weight || !receiverName || !receiverPhone || !receiverEmail}
        >
          <Text style={styles.submitButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputGroup: {
    padding: 20,
    gap: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  optionsGroup: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#28A745',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  submitButton: {
    backgroundColor: '#28A745',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
})

export default CreateSenderAnnouncementScreen
