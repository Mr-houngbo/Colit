import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { Message, ColiSpace } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import * as ImagePicker from 'expo-image-picker'

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
  const { user } = useAuth()
  const { theme } = useTheme()

  const handleGoBack = () => {
    navigation.goBack()
  }

  useEffect(() => {
    const initialize = async () => {
      await fetchColiSpace()
      await fetchMessages()
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
    else setNewMessage('')
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
      </View>
      <FlatList
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Tapez un message..."
          placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
        />
        <TouchableOpacity onPress={pickImage}>
          <Text>📎</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ColiSpaceScreen
