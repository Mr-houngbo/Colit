import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { Message, ColiSpace } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import * as ImagePicker from 'expo-image-picker'
import { sendColiSpaceNotification, COLI_SPACE_NOTIFICATIONS } from '../services/notifications'

type RootStackParamList = {
  ColiSpace: { coliSpaceId: string }
}

type ColiSpaceScreenRouteProp = RouteProp<RootStackParamList, 'ColiSpace'>

interface Props {
  route: ColiSpaceScreenRouteProp
}

const ColiSpaceScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation()
  const { coliSpaceId } = route.params
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [coliSpace, setColiSpace] = useState<any>(null)
  const [timelineSteps, setTimelineSteps] = useState([
    { id: 'created', label: 'Annonce créée', completed: true, date: null as string | null, canValidate: [], autoValidate: true },
    { id: 'validated', label: 'Colis validé', completed: false, date: null as string | null, canValidate: ['sender', 'gp'], autoValidate: false },
    { id: 'picked_up', label: 'GP prend en charge', completed: false, date: null as string | null, canValidate: ['gp'], autoValidate: false },
    { id: 'in_transit', label: 'Transport en cours', completed: false, date: null as string | null, canValidate: [], autoValidate: true },
    { id: 'delivered', label: 'Livré au destinataire', completed: false, date: null as string | null, canValidate: ['gp'], autoValidate: false },
    { id: 'completed', label: 'Clôturé', completed: false, date: null as string | null, canValidate: [], autoValidate: true },
  ])
  const { user } = useAuth()
  const { theme } = useTheme()

  const getUserRole = () => {
    if (!coliSpace || !user) return null
    if (coliSpace.sender_id === user.id) return 'sender'
    if (coliSpace.gp_id === user.id) return 'gp'
    // Check if user is the receiver (by email match)
    if (coliSpace.receiver_email === user.email) return 'receiver'
    return null
  }

  const canValidateStep = (step: any) => {
    const userRole = getUserRole()
    if (!userRole || step.autoValidate) return false
    return step.canValidate.includes(userRole)
  }

  const validateStep = async (stepId: string) => {
    try {
      const currentStepIndex = timelineSteps.findIndex(step => step.id === stepId)
      if (currentStepIndex === -1) return

      const updatedSteps = [...timelineSteps]
      const currentStep = updatedSteps[currentStepIndex]

      // Special logic for validation step (requires both sender and GP)
      if (stepId === 'validated') {
        const userRole = getUserRole()
        // For now, we'll mark as completed when either party validates
        // In a real app, you'd track both validations separately
        updatedSteps[currentStepIndex] = {
          ...currentStep,
          completed: true,
          date: new Date().toISOString()
        }

        // Update in database
        const { error } = await supabase
          .from('timeline_steps')
          .update({
            completed: true,
            validated_by: user!.id,
            validated_at: new Date().toISOString()
          })
          .eq('coli_space_id', coliSpaceId)
          .eq('step_id', stepId)

        if (error) throw error

      } else {
        updatedSteps[currentStepIndex] = {
          ...currentStep,
          completed: true,
          date: new Date().toISOString()
        }

        // Update in database
        const { error } = await supabase
          .from('timeline_steps')
          .update({
            completed: true,
            validated_by: user!.id,
            validated_at: new Date().toISOString()
          })
          .eq('coli_space_id', coliSpaceId)
          .eq('step_id', stepId)

        if (error) throw error

        // Auto-validate next step if it's autoValidate
        if (currentStepIndex + 1 < updatedSteps.length && updatedSteps[currentStepIndex + 1].autoValidate) {
          updatedSteps[currentStepIndex + 1] = {
            ...updatedSteps[currentStepIndex + 1],
            completed: true,
            date: new Date().toISOString()
          }

          // Also update auto-validated step in database
          const nextStepId = updatedSteps[currentStepIndex + 1].id
          await supabase
            .from('timeline_steps')
            .update({
              completed: true,
              validated_at: new Date().toISOString()
            })
            .eq('coli_space_id', coliSpaceId)
            .eq('step_id', nextStepId)
        }
      }

      setTimelineSteps(updatedSteps)

      // Send notification for step validation
      if (coliSpace) {
        if (stepId === 'picked_up') {
          await sendColiSpaceNotification('PACKAGE_PICKED_UP', coliSpace)
        } else if (stepId === 'delivered') {
          await sendColiSpaceNotification('PACKAGE_DELIVERED', coliSpace)
        } else {
          await sendColiSpaceNotification('STEP_VALIDATED', coliSpace)
        }
      }

    } catch (error) {
      console.error('Error validating step:', error)
    }
  }

  const fetchTimelineSteps = async () => {
    try {
      const { data, error } = await supabase
        .from('timeline_steps')
        .select('*')
        .eq('coli_space_id', coliSpaceId)
        .order('created_at')

      if (error) {
        console.error('Erreur lors du chargement de la timeline:', error)
        // Si la table n'existe pas encore ou erreur, utiliser les étapes par défaut
        setTimelineSteps([
          { id: 'created', label: 'Annonce créée', completed: true, date: null, canValidate: [], autoValidate: true },
          { id: 'validated', label: 'Colis validé', completed: false, date: null, canValidate: ['sender', 'gp'], autoValidate: false },
          { id: 'picked_up', label: 'GP prend en charge', completed: false, date: null, canValidate: ['gp'], autoValidate: false },
          { id: 'in_transit', label: 'Transport en cours', completed: false, date: null, canValidate: [], autoValidate: true },
          { id: 'delivered', label: 'Livré au destinataire', completed: false, date: null, canValidate: ['gp'], autoValidate: false },
          { id: 'completed', label: 'Clôturé', completed: false, date: null, canValidate: [], autoValidate: true },
        ])
        return
      }

      if (!data || data.length === 0) {
        console.log('Aucune étape de timeline trouvée, tentative de création...')

        // Essayer de créer les étapes manuellement si elles n'existent pas
        try {
          const defaultSteps = [
            { step_id: 'created', label: 'Annonce créée', completed: true },
            { step_id: 'validated', label: 'Colis validé', completed: false },
            { step_id: 'picked_up', label: 'GP prend en charge', completed: false },
            { step_id: 'in_transit', label: 'Transport en cours', completed: false },
            { step_id: 'delivered', label: 'Livré au destinataire', completed: false },
            { step_id: 'completed', label: 'Clôturé', completed: false },
          ]

          // Insérer les étapes par défaut
          for (const step of defaultSteps) {
            await supabase.from('timeline_steps').insert({
              coli_space_id: coliSpaceId,
              ...step
            })
          }

          console.log('Étapes de timeline créées avec succès')

          // Recharger les données
          const { data: newData } = await supabase
            .from('timeline_steps')
            .select('*')
            .eq('coli_space_id', coliSpaceId)
            .order('created_at')

          if (newData && newData.length > 0) {
            const formattedSteps = newData.map(step => ({
              id: step.step_id,
              label: step.label,
              completed: step.completed,
              date: step.validated_at || null,
              canValidate: getStepPermissions(step.step_id),
              autoValidate: ['created', 'in_transit', 'completed'].includes(step.step_id)
            }))
            setTimelineSteps(formattedSteps)
            return
          }
        } catch (createError) {
          console.error('Erreur lors de la création des étapes:', createError)
        }

        // Si la création échoue, utiliser les étapes par défaut côté client
        console.log('Utilisation des étapes par défaut côté client')
        setTimelineSteps([
          { id: 'created', label: 'Annonce créée', completed: true, date: null, canValidate: [], autoValidate: true },
          { id: 'validated', label: 'Colis validé', completed: false, date: null, canValidate: ['sender', 'gp'], autoValidate: false },
          { id: 'picked_up', label: 'GP prend en charge', completed: false, date: null, canValidate: ['gp'], autoValidate: false },
          { id: 'in_transit', label: 'Transport en cours', completed: false, date: null, canValidate: [], autoValidate: true },
          { id: 'delivered', label: 'Livré au destinataire', completed: false, date: null, canValidate: ['gp'], autoValidate: false },
          { id: 'completed', label: 'Clôturé', completed: false, date: null, canValidate: [], autoValidate: true },
        ])
        return
      }

      // Convert database format to component format
      const formattedSteps = data.map(step => ({
        id: step.step_id,
        label: step.label,
        completed: step.completed,
        date: step.validated_at || null,
        canValidate: getStepPermissions(step.step_id),
        autoValidate: ['created', 'in_transit', 'completed'].includes(step.step_id)
      }))

      console.log('Timeline chargée depuis la BD:', formattedSteps)
      setTimelineSteps(formattedSteps)
    } catch (err) {
      console.error('Erreur inattendue lors du chargement de la timeline:', err)
      // En cas d'erreur, utiliser les étapes par défaut
      setTimelineSteps([
        { id: 'created', label: 'Annonce créée', completed: true, date: null, canValidate: [], autoValidate: true },
        { id: 'validated', label: 'Colis validé', completed: false, date: null, canValidate: ['sender', 'gp'], autoValidate: false },
        { id: 'picked_up', label: 'GP prend en charge', completed: false, date: null, canValidate: ['gp'], autoValidate: false },
        { id: 'in_transit', label: 'Transport en cours', completed: false, date: null, canValidate: [], autoValidate: true },
        { id: 'delivered', label: 'Livré au destinataire', completed: false, date: null, canValidate: ['gp'], autoValidate: false },
        { id: 'completed', label: 'Clôturé', completed: false, date: null, canValidate: [], autoValidate: true },
      ])
    }
  }

  const getStepPermissions = (stepId: string) => {
    switch (stepId) {
      case 'validated': return ['sender', 'gp']
      case 'picked_up': return ['gp']
      case 'delivered': return ['gp']
      default: return []
    }
  }

  useEffect(() => {
    const initialize = async () => {
      await fetchColiSpace()
      await fetchMessages()
      await fetchTimelineSteps()
    }
    initialize()
  }, [coliSpaceId])

  useEffect(() => {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `coli_space_id=eq.${coliSpaceId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [coliSpaceId])

  const handleGoBack = () => {
    navigation.goBack()
  }

  const handleOpenMessaging = () => {
    // @ts-ignore
    navigation.navigate('Messaging', { coliSpaceId })
  }

  const handleOpenPhotos = () => {
    // @ts-ignore
    navigation.navigate('Photos', { coliSpaceId })
  }

  const fetchColiSpace = async () => {
    const { data, error } = await supabase
      .from('coli_spaces')
      .select(`
        *,
        announcements:announcement_id (
          departure_city,
          arrival_city
        )
      `)
      .eq('id', coliSpaceId)
      .single()
    if (error) console.error(error)
    else setColiSpace(data)
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase.from('messages').select('*').eq('coli_space_id', coliSpaceId).order('created_at')
    if (error) console.error(error)
    else setMessages(data || [])
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    const { error } = await supabase.from('messages').insert({
      coli_space_id: coliSpaceId,
      user_id: user!.id,
      message: newMessage,
    })
    if (error) console.error(error)
    else {
      setNewMessage('')
      // Send notification to other participants
      if (coliSpace) {
        await sendColiSpaceNotification('NEW_MESSAGE', coliSpace)
      }
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    })
    if (!result.canceled) {
      // Upload to Supabase storage and add to message
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.message, item.user_id === user!.id ? styles.myMessage : styles.otherMessage]}>
      <Text style={styles.messageText}>{item.message}</Text>
      {item.attachments && item.attachments.map(uri => <Image key={uri} source={{ uri }} style={styles.image} />)}
    </View>
  )

  const getStatusColor = () => {
    if (!timelineSteps || timelineSteps.length === 0) return '#6C47FF'
    const lastCompletedStep = timelineSteps.filter(step => step.completed).pop()
    if (!lastCompletedStep) return '#6C47FF'

    switch (lastCompletedStep.id) {
      case 'created': return '#6C47FF' // Bleu - En attente
      case 'validated': return '#ffc107' // Jaune - Validé
      case 'picked_up': return '#17a2b8' // Bleu ciel - Pris en charge
      case 'in_transit': return '#28a745' // Vert - En transit
      case 'delivered': return '#20c997' // Vert clair - Livré
      case 'completed': return '#6c757d' // Gris - Terminé
      default: return '#6C47FF'
    }
  }

  const getStatusText = () => {
    if (!timelineSteps || timelineSteps.length === 0) return 'Chargement...'
    const lastCompletedStep = timelineSteps.filter(step => step.completed).pop()
    if (!lastCompletedStep) return 'En attente'

    switch (lastCompletedStep.id) {
      case 'created': return 'Annonce créée'
      case 'validated': return 'Colis validé'
      case 'picked_up': return 'Pris en charge'
      case 'in_transit': return 'En transit'
      case 'delivered': return 'Livré'
      case 'completed': return 'Terminé'
      default: return 'En attente'
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#121212' : '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      paddingTop: 50,
      backgroundColor: '#6C47FF',
    },
    backButton: {
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
      flex: 1,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 15,
      marginRight: 10,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      marginLeft: 15,
      padding: 5,
    },
    participantsContainer: {
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
      padding: 16,
      margin: 10,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    participantsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#fff' : '#000',
      marginBottom: 16,
      textAlign: 'center',
    },
    participantsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    participantCard: {
      alignItems: 'center',
      flex: 1,
      padding: 8,
    },
    participantAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#6C47FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    participantInitial: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    participantName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#000',
      textAlign: 'center',
      marginBottom: 4,
    },
    participantRole: {
      fontSize: 12,
      color: theme === 'dark' ? '#ccc' : '#666',
      textAlign: 'center',
    },
    messagesList: {
      flex: 1,
      padding: 10,
    },
    message: {
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
      maxWidth: '80%',
    },
    myMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#6C47FF',
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9',
    },
    messageText: {
      color: '#fff',
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 8,
      marginTop: 5,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 10,
      backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#6C47FF',
      borderRadius: 8,
      padding: 10,
      marginRight: 10,
      color: theme === 'dark' ? '#fff' : '#000',
    },
    sendButton: {
      backgroundColor: '#6C47FF',
      padding: 10,
      borderRadius: 8,
      justifyContent: 'center',
    },
    sendButtonText: {
      color: '#fff',
    },
    timelineContainer: {
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
      padding: 16,
      margin: 10,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    timelineTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#fff' : '#000',
      marginBottom: 16,
      textAlign: 'center',
    },
    timelineStep: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    timelineLine: {
      width: 20,
      alignItems: 'center',
    },
    timelineConnector: {
      width: 2,
      height: 30,
      backgroundColor: '#e0e0e0',
      position: 'absolute',
      top: 20,
    },
    timelineDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#e0e0e0',
      borderWidth: 2,
      borderColor: '#6C47FF',
      marginRight: 12,
    },
    timelineDotCompleted: {
      backgroundColor: '#6C47FF',
    },
    timelineContent: {
      flex: 1,
    },
    timelineLabel: {
      fontSize: 14,
      color: theme === 'dark' ? '#ccc' : '#666',
      fontWeight: '500',
    },
    timelineLabelCompleted: {
      color: theme === 'dark' ? '#fff' : '#000',
    },
    timelineDate: {
      fontSize: 12,
      color: theme === 'dark' ? '#888' : '#999',
      marginTop: 2,
    },
    validateButton: {
      backgroundColor: '#6C47FF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    validateButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    timelineEmptyText: {
      textAlign: 'center',
      color: theme === 'dark' ? '#ccc' : '#666',
      fontStyle: 'italic',
      paddingVertical: 20,
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {coliSpace?.announcements ?
            `${coliSpace.announcements.departure_city} → ${coliSpace.announcements.arrival_city}` :
            'Coli Space'
          }
        </Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleOpenPhotos} style={styles.headerButton}>
            <Ionicons name="camera" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenMessaging} style={styles.headerButton}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Participants Info Section */}
      <View style={styles.participantsContainer}>
        <Text style={styles.participantsTitle}>Participants du coli</Text>
        <View style={styles.participantsGrid}>
          {/* Expéditeur */}
          <View style={styles.participantCard}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantInitial}>
                {coliSpace?.sender_id ? 'E' : '?'}
              </Text>
            </View>
            <Text style={styles.participantName}>
              {coliSpace?.sender_id ? 'Expéditeur' : 'Non assigné'}
            </Text>
            <Text style={styles.participantRole}>Expéditeur</Text>
          </View>

          {/* GP */}
          <View style={styles.participantCard}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantInitial}>
                {coliSpace?.gp_id ? 'T' : '?'}
              </Text>
            </View>
            <Text style={styles.participantName}>
              {coliSpace?.gp_id ? 'Transporteur' : 'Non assigné'}
            </Text>
            <Text style={styles.participantRole}>Transporteur</Text>
          </View>

          {/* Destinataire */}
          <View style={styles.participantCard}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantInitial}>
                {coliSpace?.receiver_email ? 'D' : '?'}
              </Text>
            </View>
            <Text style={styles.participantName}>
              {coliSpace?.receiver_email ? 'Destinataire' : 'Non assigné'}
            </Text>
            <Text style={styles.participantRole}>Destinataire</Text>
          </View>
        </View>
      </View>

      {/* Timeline Section */}
      <View style={styles.timelineContainer}>
        <Text style={styles.timelineTitle}>État du colis</Text>
        {timelineSteps && timelineSteps.length > 0 ? (
          timelineSteps.map((step, index) => (
            <View key={step.id} style={styles.timelineStep}>
              <View style={styles.timelineLine}>
                {index < timelineSteps.length - 1 && <View style={styles.timelineConnector} />}
              </View>
              <View style={[styles.timelineDot, step.completed && styles.timelineDotCompleted]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, step.completed && styles.timelineLabelCompleted]}>
                  {step.label}
                </Text>
                {step.date && (
                  <Text style={styles.timelineDate}>
                    {new Date(step.date).toLocaleDateString('fr-FR')}
                  </Text>
                )}
                {!step.completed && canValidateStep(step) && (
                  <TouchableOpacity
                    style={styles.validateButton}
                    onPress={() => validateStep(step.id)}
                  >
                    <Text style={styles.validateButtonText}>Valider cette étape</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.timelineEmptyText}>Chargement de la timeline...</Text>
        )}
      </View>
    </View>
  )
}

export default ColiSpaceScreen
