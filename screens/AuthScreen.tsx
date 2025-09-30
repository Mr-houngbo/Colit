import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const AuthScreen: React.FC = () => {
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp } = useAuth()
  const { theme } = useTheme()

  const handleGoBack = () => {
    navigation.goBack()
  }

  const handleSubmit = async () => {
    try {
      if (isSignUp) {
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme === 'dark' ? '#121212' : '#fff',
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
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#6C47FF',
      flex: 1,
    },
    input: {
      borderWidth: 1,
      borderColor: '#6C47FF',
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      color: theme === 'dark' ? '#fff' : '#000',
      backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9',
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
    toggleText: {
      color: '#6C47FF',
      textAlign: 'center',
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={theme === 'dark' ? '#fff' : '#000'} 
          />
        </TouchableOpacity>
        <Text style={styles.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
      </View>
      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={theme === 'dark' ? '#ccc' : '#666'}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.toggleText}>
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default AuthScreen
