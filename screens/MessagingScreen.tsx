import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { Message } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { sendColiSpaceNotification } from '../services/notifications'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type RootStackParamList = {
  Messaging: { coliSpaceId: string }
}

type MessagingScreenRouteProp = RouteProp<RootStackParamList, 'Messaging'>

interface Props {
  route: MessagingScreenRouteProp
}

interface Participant {
  id: string
  name: string
  role: 'sender' | 'gp' | 'receiver' | 'current_user'
  avatar?: string
}

const MessagingScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation()
  const { coliSpaceId } = route.params
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [coliSpace, setColiSpace] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const { user } = useAuth()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    fetchColiSpace()
    fetchMessages()
  }, [coliSpaceId])

  const handleGoBack = () => {
    navigation.goBack()
  }

  const handleGoToProfile = () => {
    // Utiliser la navigation par onglets pour aller au profil
    navigation.getParent()?.navigate('Profile')
  }

  const fetchColiSpace = async () => {
    const { data, error } = await supabase
      .from('coli_spaces')
      .select(`
        *,
        announcements:announcement_id (
          departure_city,
          arrival_city,
          transport_mode
        )
      `)
      .eq('id', coliSpaceId)
      .single()
    if (error) console.error(error)
    else {
      setColiSpace(data)
      await fetchParticipants(data)
    }
  }

  const fetchParticipants = async (spaceData: any) => {
    const participantsData: Participant[] = []

    // Ajouter l'utilisateur actuel (Toi)
    if (user) {
      participantsData.push({
        id: user.id,
        name: user.full_name || user.name || 'Toi',
        role: 'current_user',
        avatar: user.avatar_url || user.photo
      })
    }

    if (spaceData.sender_id) {
      const { data: sender } = await supabase
        .from('profiles')
        .select('id, name, full_name, avatar_url, photo')
        .eq('id', spaceData.sender_id)
        .single()
      if (sender) {
        participantsData.push({
          id: sender.id,
          name: sender.full_name || sender.name || 'Expéditeur',
          role: 'sender',
          avatar: sender.avatar_url || sender.photo
        })
      }
    }

    if (spaceData.gp_id && spaceData.gp_id !== user!.id) {
      const { data: gp } = await supabase
        .from('profiles')
        .select('id, name, full_name, avatar_url, photo')
        .eq('id', spaceData.gp_id)
        .single()
      if (gp) {
        participantsData.push({
          id: gp.id,
          name: gp.full_name || gp.name || 'Transporteur',
          role: 'gp',
          avatar: gp.avatar_url || gp.photo
        })
      }
    }

    if (spaceData.receiver_id) {
      const { data: receiver } = await supabase
        .from('profiles')
        .select('id, name, full_name, avatar_url, photo')
        .eq('id', spaceData.receiver_id)
        .single()
      if (receiver) {
        participantsData.push({
          id: receiver.id,
          name: receiver.full_name || receiver.name || 'Destinataire',
          role: 'receiver',
          avatar: receiver.avatar_url || receiver.photo
        })
      }
    }

    setParticipants(participantsData)
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('coli_space_id', coliSpaceId)
      .order('created_at')

    if (error) {
      console.error(error)
      loadMockData()
    } else if (!data || data.length === 0) {
      loadMockData()
    } else {
      setMessages(data)
    }
  }

  const loadMockData = () => {
    const mockMessages: Message[] = [
      {
        id: '1',
        coli_space_id: coliSpaceId,
        user_id: 'mock_sender',
        message: 'Bonjour ! Votre colis est bien arrivé à notre centre de tri.',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        attachments: []
      },
      {
        id: '2',
        coli_space_id: coliSpaceId,
        user_id: user!.id,
        message: 'Parfait ! Merci pour l\'information. Quand sera-t-il livré ?',
        created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        attachments: []
      },
      {
        id: '3',
        coli_space_id: coliSpaceId,
        user_id: 'mock_gp',
        message: 'Le colis sera livré demain matin entre 9h et 12h.',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        attachments: []
      }
    ]
    setMessages(mockMessages)
  }

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
      Alert.alert('Fonctionnalité', 'Upload d\'images à implémenter')
    }
  }

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    })
    if (!result.canceled) {
      Alert.alert('Fonctionnalité', 'Upload de photo à implémenter')
    }
  }

  const recordAudio = async () => {
    Alert.alert('Fonctionnalité', 'Enregistrement audio à implémenter')
  }

  const openEmojiPicker = () => {
    Alert.alert('Fonctionnalité', 'Sélecteur d\'emoji à implémenter')
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.user_id === user!.id
    const messageTime = new Date(item.created_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const messageStatus = isMyMessage ? (Math.random() > 0.5 ? 'read' : 'sent') : null

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
            {item.message}
          </Text>
        </View>
        <View style={[styles.messageFooter, isMyMessage ? styles.myMessageFooter : styles.otherMessageFooter]}>
          <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
            {messageTime}
          </Text>
          {isMyMessage && messageStatus && (
            <View style={styles.messageStatus}>
              {messageStatus === 'sent' && <Ionicons name="checkmark" size={12} color="#999" />}
              {messageStatus === 'read' && <Ionicons name="checkmark-done" size={12} color="#6C47FF" />}
            </View>
          )}
        </View>
      </View>
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      paddingTop: insets.top + 10,
      backgroundColor: '#6C47FF',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    backButton: {
      marginRight: 15,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 15,
    },
    participantsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    participantAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fff',
    },
    participantAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#fff',
    },
    participantInitial: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    headerTextContainer: {
      flex: 1,
      marginLeft: 10,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    participantsText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerActionButton: {
      marginLeft: 15,
      padding: 5,
    },
    messagesList: {
      flex: 1,
      padding: 10,
    },
    messageContainer: {
      marginBottom: 10,
      maxWidth: '80%',
    },
    myMessageContainer: {
      alignSelf: 'flex-end',
      alignItems: 'flex-end',
    },
    otherMessageContainer: {
      alignSelf: 'flex-start',
      alignItems: 'flex-start',
    },
    messageBubble: {
      padding: 12,
      borderRadius: 18,
      marginBottom: 2,
    },
    myMessageBubble: {
      backgroundColor: '#6C47FF',
      borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
      backgroundColor: theme === 'dark' ? '#333' : '#fff',
      borderBottomLeftRadius: 4,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
    },
    myMessageText: {
      color: '#fff',
    },
    otherMessageText: {
      color: theme === 'dark' ? '#fff' : '#000',
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
      paddingHorizontal: 2,
    },
    myMessageFooter: {
      justifyContent: 'flex-end',
    },
    otherMessageFooter: {
      justifyContent: 'flex-start',
    },
    messageTime: {
      fontSize: 11,
      opacity: 0.7,
    },
    myMessageTime: {
      color: '#999',
      textAlign: 'right',
    },
    otherMessageTime: {
      color: '#999',
      textAlign: 'left',
    },
    messageStatus: {
      marginLeft: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 10,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
      borderTopWidth: 1,
      borderTopColor: theme === 'dark' ? '#333' : '#e0e0e0',
    },
    inputActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    inputActionButton: {
      marginRight: 8,
      padding: 4,
    },
    inputWrapper: {
      flex: 1,
      marginRight: 10,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#6C47FF',
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 10,
      color: theme === 'dark' ? '#fff' : '#000',
      backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9',
      maxHeight: 100,
    },
    sendButton: {
      backgroundColor: '#6C47FF',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.participantsContainer}>
            {participants.slice(0, 3).map((participant, index) => (
              <View key={`${participant.id}-${index}`} style={[styles.participantAvatar, { marginLeft: index > 0 ? -15 : 0 }]}>
                {participant.avatar ? (
                  <Image source={{ uri: participant.avatar }} style={styles.participantAvatarImage} />
                ) : (
                  <Text style={styles.participantInitial}>
                    {participant.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Messages - {coliSpace?.announcements ?
                `${coliSpace.announcements.departure_city} → ${coliSpace.announcements.arrival_city}` :
                'Messages'
              }
            </Text>
            <Text style={styles.participantsText}>
              {participants.length > 0 ?
                participants.map(p => {
                  if (p.id === user!.id) return 'Toi'
                  const roleText = p.role === 'sender' ? 'Expéditeur' :
                                   p.role === 'gp' ? 'Transporteur' : 'Destinataire'
                  return p.name
                }).join(', ') :
                'Chargement...'
              }
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleGoToProfile}>
            <Ionicons name="person" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="information-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
      />

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.inputActions}>
          <TouchableOpacity onPress={takePhoto} style={styles.inputActionButton}>
            <Ionicons name="camera" size={24} color="#6C47FF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={styles.inputActionButton}>
            <Ionicons name="image" size={24} color="#6C47FF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openEmojiPicker} style={styles.inputActionButton}>
            <Ionicons name="happy" size={24} color="#6C47FF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={recordAudio} style={styles.inputActionButton}>
            <Ionicons name="mic" size={24} color="#6C47FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Tapez un message..."
            placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default MessagingScreen
