import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

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
    info: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#000',
      marginBottom: 10,
    },
    button: {
      backgroundColor: '#6C47FF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.info}>Nom: {user?.name}</Text>
      {user?.photo && <Text style={styles.info}>Photo: {user.photo}</Text>}
      <TouchableOpacity style={styles.button} onPress={toggleTheme}>
        <Text style={styles.buttonText}>Changer thème</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  )
}

export default ProfileScreen
