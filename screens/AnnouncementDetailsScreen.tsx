import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { Announcement, User } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

type RootStackParamList = {
  AnnouncementDetails: { announcementId: string }
}

type AnnouncementDetailsScreenRouteProp = RouteProp<RootStackParamList, 'AnnouncementDetails'>

interface Props {
  route: AnnouncementDetailsScreenRouteProp
}

const AnnouncementDetailsScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation()
  const { announcementId } = route.params
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [poster, setPoster] = useState<User | null>(null)
  const { user } = useAuth()
  const { theme } = useTheme()

  const handleGoBack = () => {
    navigation.goBack()
  }

  useEffect(() => {
    fetchAnnouncementDetails()
  }, [announcementId])

  const fetchAnnouncementDetails = async () => {
    try {
      const { data: announcementData, error: announcementError } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', announcementId)
        .single()

      if (announcementError) throw announcementError

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, photo, created_at, updated_at')
        .eq('id', announcementData.user_id)
        .single()

      if (profileError) throw profileError

      setAnnouncement(announcementData)
      setPoster(profileData)
    } catch (error) {
      console.error('Error fetching announcement details:', error)
      Alert.alert('Erreur', 'Impossible de charger les détails de l\'annonce')
    }
  }

  const handleRespond = () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour répondre')
      return
    }

    // Logic to create ColiSpace - same as in AnnouncementsScreen
    Alert.alert('Fonctionnalité', 'Création d\'espace Coli en cours de développement')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#6C47FF'
      case 'taken': return '#FFA500'
      case 'delivered': return '#28A745'
      default: return '#6C47FF'
    }
  }

  if (!announcement || !poster) {
    return (
      <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#121212' : '#fff' }]}>
        <Text style={{ color: theme === 'dark' ? '#fff' : '#000' }}>Chargement...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme === 'dark' ? '#121212' : '#fff' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={theme === 'dark' ? '#fff' : '#000'} 
          />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>
            {announcement.announcement_type === 'gp_offer' ? 'Offre de Transport' : 'Demande d\'Envoi'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(announcement.status) }]}>
            <Text style={styles.statusText}>
              {announcement.status === 'active' ? 'Actif' : announcement.status === 'taken' ? 'Pris' : 'Livré'}
            </Text>
          </View>
        </View>
      </View>

      {/* Route */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#6C47FF' }]}>Trajet</Text>
        <Text style={[styles.routeText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          {announcement.departure_city} → {announcement.arrival_city}
        </Text>
        <Text style={[styles.dateText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
          📅 {formatDate(announcement.date)}
        </Text>
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#6C47FF' }]}>Détails</Text>
        <Text style={[styles.detailText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          ⚖️ Poids: {announcement.weight} kg
        </Text>
        {announcement.price_per_kg && (
          <Text style={[styles.detailText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
            💰 Prix: {announcement.price_per_kg} FCFA/kg
          </Text>
        )}
        {announcement.transport_mode && (
          <Text style={[styles.detailText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
            🚗 Transport: {announcement.transport_mode}
          </Text>
        )}
        {announcement.is_fragile && (
          <Text style={[styles.detailText, { color: '#FF6B6B' }]}>
            ⚠️ Fragile
          </Text>
        )}
        {announcement.is_urgent && (
          <Text style={[styles.detailText, { color: '#FF6B6B' }]}>
            🔥 Urgent
          </Text>
        )}
      </View>

      {/* Description */}
      {announcement.description && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#6C47FF' }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
            {announcement.description}
          </Text>
        </View>
      )}

      {/* Receiver Info for send_request */}
      {announcement.announcement_type === 'send_request' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#28A745' }]}>Destinataire</Text>
          <Text style={[styles.posterName, { color: theme === 'dark' ? '#fff' : '#000' }]}>
            👤 {announcement.receiver_name}
          </Text>
          <Text style={[styles.contactText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
            📱 {announcement.receiver_phone}
          </Text>
          <Text style={[styles.contactText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
            📧 {announcement.receiver_email}
          </Text>
          {announcement.package_value && (
            <Text style={[styles.contactText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
              💰 Valeur: {announcement.package_value} FCFA
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.respondButton]} onPress={handleRespond}>
          <Text style={styles.respondButtonText}>Répondre</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  posterName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactText: {
    fontSize: 16,
    marginTop: 4,
  },
  actions: {
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  respondButton: {
    backgroundColor: '#6C47FF',
  },
  respondButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
})

export default AnnouncementDetailsScreen
