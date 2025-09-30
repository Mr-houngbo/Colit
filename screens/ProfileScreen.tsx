import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Image } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '../lib/supabase'

const ProfileScreen = () => {
  const { user, signOut, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
  })

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error)
      Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const uploadAvatar = async (imageUri: string, fileName: string) => {
    try {
      setIsSaving(true)
      const fileExt = fileName.split('.').pop() || 'jpg'
      const fileNameUnique = `${user!.id}_${Date.now()}.${fileExt}`
      console.log('📁 Nom fichier:', fileNameUnique)

      // ✅ Lire fichier en base64 avec expo-file-system
      console.log('📖 Lecture fichier en base64...')
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      console.log('✅ Base64 lu, taille:', base64.length)

      // ✅ Convertir base64 -> Uint8Array
      console.log('🔄 Conversion base64 vers Uint8Array...')
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      console.log('✅ Uint8Array créé, taille:', bytes.length)

      // ✅ Upload vers Supabase Storage
      console.log('☁️ Upload vers Supabase Storage...')
      const uploadPromise = supabase.storage
        .from('avatars')
        .upload(fileNameUnique, bytes, {
          contentType: `image/${fileExt}`,
          upsert: true,
        })

      // Timeout simple
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout après 30 secondes')), 30000)
      )

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Erreur Supabase upload:', error)
        let errorMessage = 'Impossible d\'uploader la photo de profil'
        if (error.message?.includes('Bucket not found')) {
          errorMessage += '\n\nAssurez-vous d\'avoir créé le bucket "avatars" dans Supabase Storage.'
        } else if (error.message?.includes('auth')) {
          errorMessage += '\n\nProblème d\'authentification.'
        } else if (error.message?.includes('Duplicate')) {
          errorMessage += '\n\nUn fichier avec ce nom existe déjà.'
        } else if (error.message?.includes('Network request failed')) {
          errorMessage += '\n\nProblème de réseau. Vérifiez votre connexion internet.'
        } else if (error.message?.includes('violates row-level security policy')) {
          errorMessage += '\n\nPolitiques de sécurité non configurées. Exécutez le script fix_supabase_storage.sql dans Supabase.'
        } else if (error.message) {
          errorMessage += ': ' + error.message
        }

        Alert.alert('Erreur', errorMessage)
        return
      }

      console.log('✅ Upload réussi:', data)

      // Générer URL publique
      console.log('🔗 Génération URL publique...')
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileNameUnique)
      console.log('✅ URL publique:', publicUrl)

      // Mettre à jour le profil
      console.log('👤 Mise à jour profil...')
      await updateProfile({ avatar_url: publicUrl })
      console.log('🎉 Profil mis à jour!')
      Alert.alert('Succès', 'Photo de profil mise à jour avec succès!')
    } catch (err: any) {
      console.error('❌ Erreur upload avatar:', err.message)
      let errorMessage = 'Erreur lors de l\'upload de la photo'
      if (err.name === 'AbortError') {
        errorMessage = 'Upload annulé : timeout après 30 secondes'
      } else if (err.message?.includes('Network')) {
        errorMessage = 'Problème de réseau'
      } else if (err.message) {
        errorMessage += ': ' + err.message
      }
      Alert.alert('Erreur', errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à vos photos.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      const asset = result.assets[0]
      await uploadAvatar(asset.uri, asset.fileName || `photo_${Date.now()}.jpg`)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à l\'appareil photo.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      const asset = result.assets[0]
      await uploadAvatar(asset.uri, asset.fileName || `camera_${Date.now()}.jpg`)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      await updateProfile(formData)
      setIsEditing(false)
      Alert.alert('Succès', 'Votre profil a été mis à jour avec succès!')
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error)
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil. Veuillez réessayer.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setFormData({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
    })
    setIsEditing(false)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5',
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 20,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#6C47FF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#fff',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarInitial: {
      color: '#fff',
      fontSize: 40,
      fontWeight: 'bold',
    },
    avatarEditButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#6C47FF',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme === 'dark' ? '#121212' : '#f5f5f5',
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#fff' : '#000',
      marginBottom: 5,
    },
    email: {
      fontSize: 16,
      color: theme === 'dark' ? '#ccc' : '#666',
      marginBottom: 20,
    },
    section: {
      backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#fff' : '#000',
      marginBottom: 15,
    },
    input: {
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#333' : '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#000',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
      marginBottom: 15,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    infoText: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#000',
      marginBottom: 15,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
    },
    button: {
      backgroundColor: '#6C47FF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      flex: 1,
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#6C47FF',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonTextSecondary: {
      color: '#6C47FF',
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      opacity: 0.6,
    },
    avatarOptions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 15,
    },
    avatarOption: {
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
    },
  })

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url || user?.photo ? (
              <Image source={{ uri: user.avatar_url || user.photo }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>
                  {(user?.full_name || user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.avatarEditButton} onPress={() => Alert.alert(
              'Changer la photo de profil',
              'Choisir une option',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Prendre une photo', onPress: takePhoto },
                { text: 'Choisir depuis la galerie', onPress: pickImage },
              ]
            )}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>
            {user?.full_name || user?.name || 'Utilisateur'}
          </Text>
          <Text style={styles.email}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Informations personnelles
          </Text>

          {isEditing ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                value={formData.full_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Numéro de téléphone"
                placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Biographie (optionnel)"
                placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                multiline
                numberOfLines={3}
              />

              <TextInput
                style={styles.input}
                placeholder="Localisation (ville, pays)"
                placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.buttonTextSecondary}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, isSaving && styles.buttonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  <Text style={styles.buttonText}>
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.infoText}>
                <Text style={{ fontWeight: 'bold' }}>Nom complet:</Text> {user?.full_name || 'Non défini'}
              </Text>

              <Text style={styles.infoText}>
                <Text style={{ fontWeight: 'bold' }}>Téléphone:</Text> {user?.phone || 'Non défini'}
              </Text>

              <Text style={styles.infoText}>
                <Text style={{ fontWeight: 'bold' }}>Localisation:</Text> {user?.location || 'Non définie'}
              </Text>

              <Text style={styles.infoText}>
                <Text style={{ fontWeight: 'bold' }}>Biographie:</Text> {user?.bio || 'Aucune biographie'}
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>Modifier le profil</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Préférences
          </Text>

          <TouchableOpacity style={styles.button} onPress={toggleTheme}>
            <Text style={styles.buttonText}>Changer thème ({theme === 'dark' ? 'Clair' : 'Sombre'})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Compte
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, isLoggingOut && styles.buttonDisabled]}
            onPress={handleSignOut}
            disabled={isLoggingOut}
          >
            <Text style={styles.buttonTextSecondary}>
              {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

export default ProfileScreen
