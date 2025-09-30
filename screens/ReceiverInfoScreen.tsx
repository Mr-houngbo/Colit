import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'

type RootStackParamList = {
  ReceiverInfo: { announcementId: string }
}

type ReceiverInfoScreenRouteProp = RouteProp<RootStackParamList, 'ReceiverInfo'>

const ReceiverInfoScreen: React.FC = () => {
  const navigation = useNavigation()
  const route = useRoute<ReceiverInfoScreenRouteProp>()
  const { announcementId } = route.params
  const { user } = useAuth()
  const { theme } = useTheme()

  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverEmail, setReceiverEmail] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGoBack = () => {
    navigation.goBack()
  }

  const handleContinue = async () => {
    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsLoading(true)

    try {
      // Get announcement details
      const { data: announcement, error: announcementError } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', announcementId)
        .single()

      if (announcementError) throw announcementError

      // 🔒 VÉRIFICATIONS DE RÉFLEXIVITÉ - Interdire les espaces coli avec soi-même
      const senderId = user!.id // Current user is the sender
      const gpId = announcement.user_id // GP who created the announcement

      if (senderId === gpId) {
        Alert.alert('Erreur', 'Vous ne pouvez pas être à la fois expéditeur et transporteur pour le même colis.')
        return
      }

      // Vérifier si l'email du destinataire correspond à l'utilisateur actuel
      if (receiverEmail && receiverEmail.toLowerCase() === user?.email?.toLowerCase()) {
        Alert.alert('Erreur', 'Vous ne pouvez pas vous désigner comme votre propre destinataire.')
        return
      }

      // Create ColiSpace with receiver info
      const { data: coliSpace, error: coliSpaceError } = await supabase
        .from('coli_spaces')
        .insert({
          announcement_id: announcementId,
          sender_id: senderId,
          gp_id: gpId,
          receiver_name: receiverName,
          receiver_phone: receiverPhone,
          receiver_email: receiverEmail || null,
          receiver_address: receiverAddress,
          status: 'created'
        })
        .select()
        .single()

      if (coliSpaceError) throw coliSpaceError

      // Navigate to ColiSpace
      navigation.navigate('ColiSpace' as never, { coliSpaceId: coliSpace.id } as never)

    } catch (error: any) {
      console.error('Error creating ColiSpace:', error)
      Alert.alert('Erreur', 'Erreur lors de la création de l\'espace Coli: ' + error.message)
    } finally {
      setIsLoading(false)
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
      padding: 20,
      paddingTop: 50,
      backgroundColor: '#6C47FF',
    },
    backButton: {
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#fff' : '#000',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: theme === 'dark' ? '#ccc' : '#666',
      marginBottom: 30,
      lineHeight: 24,
    },
    input: {
      borderWidth: 1,
      borderColor: '#6C47FF',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#000',
      backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9',
    },
    optionalText: {
      fontSize: 12,
      color: theme === 'dark' ? '#ccc' : '#666',
      marginTop: -10,
      marginBottom: 15,
      marginLeft: 5,
    },
    continueButton: {
      backgroundColor: '#6C47FF',
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    continueButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Informations du destinataire</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Ajouter un destinataire</Text>
        <Text style={styles.subtitle}>
          Pour finaliser la création de votre espace Coli, nous avons besoin des informations du destinataire.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nom du destinataire *"
          value={receiverName}
          onChangeText={setReceiverName}
          placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
        />

        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone *"
          value={receiverPhone}
          onChangeText={setReceiverPhone}
          keyboardType="phone-pad"
          placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
        />

        <TextInput
          style={styles.input}
          placeholder="Email (optionnel)"
          value={receiverEmail}
          onChangeText={setReceiverEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
        />
        <Text style={styles.optionalText}>L'email permet d'envoyer des notifications au destinataire</Text>

        <TextInput
          style={styles.input}
          placeholder="Adresse de livraison *"
          value={receiverAddress}
          onChangeText={setReceiverAddress}
          multiline
          numberOfLines={3}
          placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
        />

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'Création...' : 'Créer l\'espace Coli'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

export default ReceiverInfoScreen
