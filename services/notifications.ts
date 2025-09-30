// Alternative notifications for Expo Go (without push notifications)
import { Alert, Platform } from 'react-native'

// Fallback for Expo Go - uses Alert instead of push notifications
export const requestNotificationPermissions = async () => {
  console.log('🔔 Mode Expo Go : Alert activé au lieu des notifications push')
  return true
}

export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: any
) => {
  console.log('📱 Notification (Expo Go mode):', { title, body, data })

  // Show alert for Expo Go testing
  Alert.alert(title, body, [
    { text: 'OK', style: 'default' }
  ])
}

// Notification types for ColiSpace
export const COLI_SPACE_NOTIFICATIONS = {
  NEW_MESSAGE: 'new_message',
  STEP_VALIDATED: 'step_validated',
  RECEIVER_JOINED: 'receiver_joined',
  PACKAGE_PICKED_UP: 'package_picked_up',
  PACKAGE_DELIVERED: 'package_delivered',
}

// Send notification for ColiSpace events
export const sendColiSpaceNotification = async (
  type: keyof typeof COLI_SPACE_NOTIFICATIONS,
  coliSpaceData: any,
  userRole?: string
) => {
  let title = ''
  let body = ''

  switch (type) {
    case 'NEW_MESSAGE':
      title = '🔔 Nouveau message'
      body = `Vous avez un nouveau message dans l'espace Coli ${coliSpaceData.announcements?.departure_city} → ${coliSpaceData.announcements?.arrival_city}`
      break

    case 'STEP_VALIDATED':
      title = '✅ Étape validée'
      body = `Une étape a été validée dans votre espace Coli ${coliSpaceData.announcements?.departure_city} → ${coliSpaceData.announcements?.arrival_city}`
      break

    case 'RECEIVER_JOINED':
      title = '👋 Destinataire rejoint'
      body = `Le destinataire a rejoint l'espace Coli ${coliSpaceData.announcements?.departure_city} → ${coliSpaceData.announcements?.arrival_city}`
      break

    case 'PACKAGE_PICKED_UP':
      title = '🚚 Colis pris en charge'
      body = `Votre colis a été pris en charge par le transporteur`
      break

    case 'PACKAGE_DELIVERED':
      title = '🎉 Colis livré'
      body = `Votre colis a été livré avec succès !`
      break

    default:
      return
  }

  await sendLocalNotification(title, body, {
    type: 'coli_space',
    coliSpaceId: coliSpaceData.id,
    notificationType: type,
  })
}

export default {
  requestNotificationPermissions,
  sendLocalNotification,
  sendColiSpaceNotification,
  COLI_SPACE_NOTIFICATIONS,
}
