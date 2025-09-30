import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { Announcement } from '../types'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { RootStackParamList } from '../types/navigation'

const AnnouncementsScreen: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase.from('announcements').select('*')
      if (error) {
        console.error('Error fetching announcements:', error)
        alert('Erreur lors du chargement des annonces: ' + error.message)
      } else {
        console.log('Fetched announcements:', data)
        setAnnouncements(data || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Erreur inattendue: ' + err)
    }
  }

  const handleRespond = async (announcement: Announcement) => {
    // Create ColiSpace
    const senderId = announcement.announcement_type === 'send_request' ? announcement.user_id : user!.id
    const gpId = announcement.announcement_type === 'send_request' ? user!.id : announcement.user_id
    const { data, error } = await supabase
      .from('coli_spaces')
      .insert({
        announcement_id: announcement.id,
        sender_id: senderId,
        gp_id: gpId,
        status: 'created'
      })
      .select()
      .single()
    if (error) {
      console.error(error)
      alert('Erreur lors de la création de l\'espace Coli: ' + error.message)
    } else {
      // Navigate to ColiSpace
      navigation.navigate('ColiSpace', { coliSpaceId: data.id })
    }
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
      case 'delivered': return '#28A745'
      default: return '#6C47FF'
    }
  }

  const handleDetails = (announcement: Announcement) => {
    navigation.navigate('AnnouncementDetails', { announcementId: announcement.id })
  }

  const renderItem = ({ item }: { item: Announcement }) => (
    <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9' }]}>
      {/* Header with type and status */}
      <View style={styles.cardHeader}>
        <Text style={[styles.typeText, { color: item.announcement_type === 'gp_offer' ? '#6C47FF' : '#28A745' }]}>
          {item.announcement_type === 'gp_offer' ? '🚚 Transporteur' : '📦 Expéditeur'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Actif' : item.status === 'taken' ? 'Pris' : 'Livré'}
          </Text>
        </View>
      </View>

      {/* Route */}
      <Text style={[styles.routeText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
        {item.departure_city} → {item.arrival_city}
      </Text>

      {/* Receiver info for send_request */}
      {item.announcement_type === 'send_request' && item.receiver_name && (
        <Text style={[styles.receiverText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
          Destinataire: {item.receiver_name}
        </Text>
      )}

      {/* Details */}
      <View style={styles.detailsRow}>
        <Text style={[styles.detailText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
          📅 {formatDate(item.date)}
        </Text>
        <Text style={[styles.detailText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
          ⚖️ {item.weight}kg {item.announcement_type === 'gp_offer' ? 'dispo' : 'à envoyer'}
        </Text>
      </View>

      {/* Price if available */}
      {item.price_per_kg && (
        <Text style={[styles.priceText, { color: '#28A745' }]}>
          💰 {item.price_per_kg} FCFA/kg
        </Text>
      )}

      {/* Package value for send_request */}
      {item.announcement_type === 'send_request' && item.package_value && (
        <Text style={[styles.valueText, { color: '#FF6B6B' }]}>
          💰 Valeur: {item.package_value} FCFA
        </Text>
      )}

      {/* Transport mode */}
      {item.transport_mode && (
        <Text style={[styles.transportText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
          🚗 {item.transport_mode}
        </Text>
      )}

      {/* Fragile/Urgent indicators */}
      <View style={styles.indicatorsRow}>
        {item.is_fragile && (
          <Text style={[styles.indicatorText, { color: '#FF6B6B' }]}>⚠️ Fragile</Text>
        )}
        {item.is_urgent && (
          <Text style={[styles.indicatorText, { color: '#FF6B6B' }]}>🔥 Urgent</Text>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.button, styles.detailsButton]} onPress={() => handleDetails(item)}>
          <Text style={styles.detailsButtonText}>Détails</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.respondButton]} onPress={() => handleRespond(item)}>
          <Text style={styles.respondButtonText}>Répondre</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#121212' : '#fff',
      padding: 10,
    },
    card: {
      padding: 15,
      marginBottom: 10,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    typeText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    routeText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailText: {
      fontSize: 14,
    },
    priceText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    receiverText: {
      fontSize: 14,
      marginBottom: 4,
      fontStyle: 'italic',
    },
    transportText: {
      fontSize: 14,
      marginBottom: 4,
    },
    valueText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    indicatorsRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    indicatorText: {
      fontSize: 12,
      marginRight: 10,
    },
    buttonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    detailsButton: {
      backgroundColor: '#f0f0f0',
    },
    respondButton: {
      backgroundColor: '#6C47FF',
    },
    detailsButtonText: {
      color: '#333',
      fontSize: 14,
      fontWeight: 'bold',
    },
    respondButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
  })

  return (
    <View style={styles.container}>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  )
}

export default AnnouncementsScreen
