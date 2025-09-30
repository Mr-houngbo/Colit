import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Switch } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const CreateAnnouncementScreen: React.FC = () => {
  const [announcementType, setAnnouncementType] = useState<'gp_offer' | 'send_request'>('gp_offer')
  const [departureCity, setDepartureCity] = useState('')
  const [arrivalCity, setArrivalCity] = useState('')
  const [date, setDate] = useState('')
  const [weight, setWeight] = useState('')
  const [pricePerKg, setPricePerKg] = useState('')
  const [transportMode, setTransportMode] = useState<'voiture' | 'bus' | 'avion' | 'train'>('voiture')
  const [isFragile, setIsFragile] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [description, setDescription] = useState('')
  const { user } = useAuth()
  const { theme } = useTheme()

  const handleSubmit = async () => {
    if (!departureCity || !arrivalCity || !date || !weight) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      console.log('Submitting announcement:', {
        user_id: user!.id,
        announcement_type: announcementType,
        departure_city: departureCity,
        arrival_city: arrivalCity,
        date,
        weight: parseFloat(weight),
        description,
      })

      const { data, error } = await supabase.from('announcements').insert({
        user_id: user!.id,
        announcement_type: announcementType,
        departure_city: departureCity,
        arrival_city: arrivalCity,
        date,
        weight: parseFloat(weight),
        price_per_kg: pricePerKg ? parseFloat(pricePerKg) : null,
        transport_mode: transportMode,
        is_fragile: isFragile,
        is_urgent: isUrgent,
        whatsapp_number: whatsappNumber || null,
        description,
      }).select()

      if (error) {
        console.error('Error creating announcement:', error)
        alert('Erreur lors de la création: ' + error.message)
      } else {
        console.log('Announcement created:', data)
        alert('Annonce créée avec succès !')
        // Reset form
        setDepartureCity('')
        setArrivalCity('')
        setDate('')
        setWeight('')
        setPricePerKg('')
        setTransportMode('voiture')
        setIsFragile(false)
        setIsUrgent(false)
        setWhatsappNumber('')
        setDescription('')
        // Navigate back to announcements
        // navigation.goBack() // If using stack navigation
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Erreur inattendue: ' + err)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme === 'dark' ? '#121212' : '#fff',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#6C47FF',
      textAlign: 'center',
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: '#6C47FF',
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      color: theme === 'dark' ? '#fff' : '#000',
      backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9',
    },
    picker: {
      borderWidth: 1,
      borderColor: '#6C47FF',
      borderRadius: 8,
      marginBottom: 10,
    },
    button: {
      backgroundColor: '#6C47FF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      marginTop: 16,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    switchLabel: {
      fontSize: 16,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer une annonce</Text>
      <Picker
        selectedValue={announcementType}
        onValueChange={(itemValue) => setAnnouncementType(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="GP (Offre de transport)" value="gp_offer" />
        <Picker.Item label="Expéditeur (Demande d'envoi)" value="send_request" />
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="Ville départ"
        value={departureCity}
        onChangeText={setDepartureCity}
        placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
      />
      <TextInput
        style={styles.input}
        placeholder="Ville arrivée"
        value={arrivalCity}
        onChangeText={setArrivalCity}
        placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
      />
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
      />
      <TextInput
        style={styles.input}
        placeholder="Poids (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
        multiline
        numberOfLines={3}
      />

      {/* Prix par kg */}
      <TextInput
        style={styles.input}
        placeholder="Prix par kg (optionnel)"
        value={pricePerKg}
        onChangeText={setPricePerKg}
        keyboardType="numeric"
        placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
      />

      {/* Moyen de transport */}
      <Text style={[styles.label, { color: theme === 'dark' ? '#fff' : '#000' }]}>Moyen de transport</Text>
      <Picker
        selectedValue={transportMode}
        onValueChange={(itemValue) => setTransportMode(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Voiture" value="voiture" />
        <Picker.Item label="Bus" value="bus" />
        <Picker.Item label="Avion" value="avion" />
        <Picker.Item label="Train" value="train" />
      </Picker>

      {/* Options */}
      <View style={styles.switchContainer}>
        <Text style={[styles.switchLabel, { color: theme === 'dark' ? '#fff' : '#000' }]}>Fragile</Text>
        <Switch
          value={isFragile}
          onValueChange={setIsFragile}
          trackColor={{ false: '#767577', true: '#6C47FF' }}
          thumbColor={isFragile ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={[styles.switchLabel, { color: theme === 'dark' ? '#fff' : '#000' }]}>Urgent</Text>
        <Switch
          value={isUrgent}
          onValueChange={setIsUrgent}
          trackColor={{ false: '#767577', true: '#FF6B6B' }}
          thumbColor={isUrgent ? '#fff' : '#f4f3f4'}
        />
      </View>

      {/* WhatsApp */}
      <TextInput
        style={styles.input}
        placeholder="Numéro WhatsApp (optionnel)"
        value={whatsappNumber}
        onChangeText={setWhatsappNumber}
        keyboardType="phone-pad"
        placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Publier</Text>
      </TouchableOpacity>
    </View>
  )
}

export default CreateAnnouncementScreen
