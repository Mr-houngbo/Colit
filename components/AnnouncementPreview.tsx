import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Announcement } from '../types'

interface AnnouncementPreviewProps {
  announcement: Partial<Announcement>
  onConfirm: () => void
  onEdit: () => void
  theme: 'light' | 'dark'
  type: 'gp_offer' | 'send_request'
}

const AnnouncementPreview: React.FC<AnnouncementPreviewProps> = ({
  announcement,
  onConfirm,
  onEdit,
  theme,
  type
}) => {
  const insets = useSafeAreaInsets()

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non spécifiée'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return '#6C47FF'
      case 'taken': return '#FFA500'
      case 'delivered': return '#28A745'
      default: return '#6C47FF'
    }
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme === 'dark' ? '#121212' : '#f8f9fa' }]}>
      {/* Header avec safe area pour la caméra */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          Aperçu de votre annonce
        </Text>

        <Text style={[styles.subtitle, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
          Vérifiez les informations avant de publier
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.previewContainer}>
          {/* Header */}
          <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9' }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.typeText, { color: type === 'gp_offer' ? '#6C47FF' : '#28A745' }]}>
                {type === 'gp_offer' ? '🚚 Transporteur' : '📦 Expéditeur'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor('active') }]}>
                <Text style={styles.statusText}>Actif</Text>
              </View>
            </View>

            {/* Route */}
            <Text style={[styles.routeText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
              {announcement.departure_city} → {announcement.arrival_city}
            </Text>

            {/* Receiver for send_request */}
            {type === 'send_request' && announcement.receiver_name && (
              <Text style={[styles.receiverText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
                Destinataire: {announcement.receiver_name}
              </Text>
            )}

            {/* Details */}
            <View style={styles.detailsRow}>
              <Text style={[styles.detailText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
                Date: {formatDate(announcement.date)}
              </Text>
              <Text style={[styles.detailText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
                Poids: {announcement.weight}kg {type === 'gp_offer' ? 'dispo' : 'à envoyer'}
              </Text>
            </View>

            {/* Price */}
            {announcement.price_per_kg && (
              <Text style={[styles.priceText, { color: '#28A745' }]}>
                Prix: {announcement.price_per_kg} FCFA/kg
              </Text>
            )}

            {/* Value for send_request */}
            {type === 'send_request' && announcement.package_value && (
              <Text style={[styles.valueText, { color: '#FF6B6B' }]}>
                Valeur: {announcement.package_value} FCFA
              </Text>
            )}

            {/* Transport */}
            {announcement.transport_mode && (
              <Text style={[styles.transportText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
                {announcement.transport_mode}
              </Text>
            )}

            {/* Indicators */}
            <View style={styles.indicatorsRow}>
              {announcement.is_fragile && (
                <Text style={[styles.indicatorText, { color: '#FF6B6B' }]}>Fragile</Text>
              )}
              {announcement.is_urgent && (
                <Text style={[styles.indicatorText, { color: '#FF6B6B' }]}>Urgent</Text>
              )}
            </View>
          </View>

          {/* Description */}
          {announcement.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: type === 'gp_offer' ? '#6C47FF' : '#28A745' }]}>
                Description
              </Text>
              <Text style={[styles.descriptionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                {announcement.description}
              </Text>
            </View>
          )}

          {/* Receiver details for send_request */}
          {type === 'send_request' && announcement.receiver_name && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#28A745' }]}>
                Destinataire
              </Text>
              <Text style={[styles.detailText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                {announcement.receiver_name}
              </Text>
              <Text style={[styles.detailText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
                {announcement.receiver_phone}
              </Text>
              <Text style={[styles.detailText, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
                {announcement.receiver_email}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions avec safe area pour les boutons système */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={onEdit}>
          <Text style={styles.editButtonText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
          <Text style={styles.confirmButtonText}>
            {type === 'gp_offer' ? 'Publier le trajet' : 'Publier la demande'}
          </Text>
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
    padding: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollContainer: {
    flex: 1,
  },
  previewContainer: {
    padding: 20,
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
  receiverText: {
    fontSize: 14,
    marginBottom: 4,
    fontStyle: 'italic',
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
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transportText: {
    fontSize: 14,
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
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#6C47FF',
    shadowColor: '#6C47FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default AnnouncementPreview
