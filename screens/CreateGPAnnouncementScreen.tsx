import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import { CitySelector } from '../components/CityAutocomplete'
import AnnouncementPreview from '../components/AnnouncementPreview'
import { DatePicker, TimePicker } from '../components/DateTimePicker'

const CreateGPAnnouncementScreen: React.FC = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [departureCity, setDepartureCity] = useState('')
  const [arrivalCity, setArrivalCity] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [weight, setWeight] = useState('')
  const [pricePerKg, setPricePerKg] = useState('')
  const [transportMode, setTransportMode] = useState<'voiture' | 'bus' | 'avion' | 'train'>('voiture')
  const [isFragileAccepted, setIsFragileAccepted] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [description, setDescription] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const { user } = useAuth()
  const { theme } = useTheme()

  const handleGoBack = () => {
    navigation.goBack()
  }

  const handlePreview = () => {
    if (!departureCity || !arrivalCity || !date || !weight) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }
    setShowPreview(true)
  }

  const handleConfirm = async () => {
    try {
      // Convertir l'heure au format HH:MM si nécessaire
      let formattedTime = time
      if (time && time.includes('h')) {
        // Convertir "12h00" en "12:00"
        const timeMatch = time.match(/(\d{1,2})h(\d{2})/)
        if (timeMatch) {
          const hours = timeMatch[1].padStart(2, '0')
          const minutes = timeMatch[2]
          formattedTime = `${hours}:${minutes}`
        }
      }
      const { data, error } = await supabase.from('announcements').insert({
        user_id: user!.id,
        announcement_type: 'gp_offer',
        departure_city: departureCity,
        arrival_city: arrivalCity,
        date,
        time: formattedTime || null,
        weight: parseFloat(weight),
        price_per_kg: pricePerKg ? parseFloat(pricePerKg) : null,
        transport_mode: transportMode,
        is_fragile: !isFragileAccepted, // GP accepte les fragiles ou non
        is_urgent: isUrgent,
        description,
      }).select()

      if (error) {
        console.error('Error creating GP announcement:', error)
        Alert.alert('Erreur', 'Erreur lors de la création: ' + error.message)
      } else {
        Alert.alert('Succès', 'Votre annonce de transporteur a été créée !')
        // Reset form
        setDepartureCity('')
        setArrivalCity('')
        setDate('')
        setTime('')
        setWeight('')
        setPricePerKg('')
        setTransportMode('voiture')
        setIsFragileAccepted(false)
        setIsUrgent(false)
        setDescription('')
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
      announcement_type: 'gp_offer' as const,
      departure_city: departureCity,
      arrival_city: arrivalCity,
      date,
      time,
      weight: parseFloat(weight),
      price_per_kg: pricePerKg ? parseFloat(pricePerKg) : undefined,
      transport_mode: transportMode,
      is_fragile: !isFragileAccepted,
      is_urgent: isUrgent,
      description,
    }

    return (
      <AnnouncementPreview
        announcement={announcementData}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        theme={theme}
        type="gp_offer"
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
            Proposer un trajet
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
            Partagez votre trajet disponible
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Trajet Section */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardIcon, { color: '#6C47FF' }]}></Text>
            <Text style={[styles.cardTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Trajet</Text>
          </View>

          <View style={styles.inputGroup}>
            <CitySelector
              value={departureCity}
              onChangeText={setDepartureCity}
              placeholder="Ville de départ"
            />

            <CitySelector
              value={arrivalCity}
              onChangeText={setArrivalCity}
              placeholder="Ville d'arrivée"
            />
          </View>
        </View>

        {/* Date & Heure Section */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardIcon, { color: '#6C47FF' }]}></Text>
            <Text style={[styles.cardTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Date & Heure</Text>
          </View>

          <View style={styles.inputGroup}>
            <DatePicker
              value={date}
              onChangeText={setDate}
              placeholder="Sélectionner la date"
            />

            <TimePicker
              value={time}
              onChangeText={setTime}
              placeholder="Heure (optionnel)"
            />
          </View>
        </View>

        {/* Transport Section */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardIcon, { color: '#6C47FF' }]}></Text>
            <Text style={[styles.cardTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Transport</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.pickerWrapper, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa' }]}>
              <Picker
                selectedValue={transportMode}
                onValueChange={(itemValue) => setTransportMode(itemValue)}
                style={[styles.picker, { color: theme === 'dark' ? '#fff' : '#000' }]}
              >
                <Picker.Item label="Voiture" value="voiture" />
                <Picker.Item label="Bus" value="bus" />
                <Picker.Item label="Avion" value="avion" />
                <Picker.Item label="Train" value="train" />
              </Picker>
            </View>

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
                <Text style={[styles.inputLabel, { color: theme === 'dark' ? '#ccc' : '#666' }]}>Prix/kg (optionnel)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }]}
                  placeholder="0"
                  value={pricePerKg}
                  onChangeText={setPricePerKg}
                  keyboardType="numeric"
                  placeholderTextColor={theme === 'dark' ? '#666' : '#ccc'}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Options Section */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardIcon, { color: '#6C47FF' }]}></Text>
            <Text style={[styles.cardTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Préférences</Text>
          </View>

          <View style={styles.optionsGroup}>
            <TouchableOpacity
              style={[styles.optionRow, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa' }]}
              onPress={() => setIsFragileAccepted(!isFragileAccepted)}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionEmoji, { color: '#ff6b6b' }]}></Text>
                <Text style={[styles.optionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Accepte fragiles</Text>
              </View>
              <View style={[styles.toggle, isFragileAccepted && styles.toggleActive]}>
                <Text style={styles.toggleText}>{isFragileAccepted ? '✓' : '✗'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionRow, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa' }]}
              onPress={() => setIsUrgent(!isUrgent)}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionEmoji, { color: '#ffa500' }]}></Text>
                <Text style={[styles.optionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Trajet urgent</Text>
              </View>
              <View style={[styles.toggle, isUrgent && styles.toggleActive]}>
                <Text style={styles.toggleText}>{isUrgent ? '✓' : '✗'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description Section */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardIcon, { color: '#6C47FF' }]}></Text>
            <Text style={[styles.cardTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Description (optionnel)</Text>
          </View>

          <TextInput
            style={[styles.textArea, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }]}
            placeholder="Ajoutez des détails sur votre trajet..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={theme === 'dark' ? '#666' : '#ccc'}
          />
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <TouchableOpacity
          style={[styles.submitButton, (!departureCity || !arrivalCity || !date || !weight) && styles.submitButtonDisabled]}
          onPress={handlePreview}
          disabled={!departureCity || !arrivalCity || !date || !weight}
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
  pickerWrapper: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    fontSize: 16,
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
  optionsGroup: {
    padding: 20,
    gap: 12,
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
    backgroundColor: '#6C47FF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  submitButton: {
    backgroundColor: '#6C47FF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6C47FF',
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

export default CreateGPAnnouncementScreen
