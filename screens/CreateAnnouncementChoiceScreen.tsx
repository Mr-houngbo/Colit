import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../contexts/ThemeContext'

const CreateAnnouncementChoiceScreen: React.FC = () => {
  const navigation = useNavigation()
  const { theme } = useTheme()

  const handleGoBack = () => {
    navigation.goBack()
  }

  const handleGPChoice = () => {
    navigation.navigate('CreateGPAnnouncement' as never)
  }

  const handleSenderChoice = () => {
    navigation.navigate('CreateSenderAnnouncement' as never)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#121212' : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={theme === 'dark' ? '#fff' : '#000'} 
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          Créer une annonce
        </Text>
      </View>

      <View style={styles.choicesContainer}>
        <TouchableOpacity style={[styles.choiceCard, styles.gpCard]} onPress={handleGPChoice}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🚚</Text>
          </View>
          <Text style={styles.choiceTitle}>Je suis voyageur et j'ai de l'espace disponible dans mes bagages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.choiceCard, styles.senderCard]} onPress={handleSenderChoice}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>📦</Text>
          </View>
          <Text style={styles.choiceTitle}>J'ai un colis à envoyer et je cherche un voyageur de confiance</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  choicesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  choiceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  gpCard: {
    backgroundColor: '#6C47FF',
  },
  senderCard: {
    backgroundColor: '#28A745',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
})

export default CreateAnnouncementChoiceScreen
