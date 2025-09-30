import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert } from 'react-native'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type RootStackParamList = {
  Photos: { coliSpaceId: string }
}
type PhotosScreenRouteProp = RouteProp<RootStackParamList, 'Photos'>

interface Props {
  route: PhotosScreenRouteProp
}

interface Photo {
  id: string
  uri: string
  uploaded_at: string
  uploaded_by: string
}

const PhotosScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation()
  const { coliSpaceId } = route.params
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [coliSpace, setColiSpace] = useState<any>(null)
  const { user } = useAuth()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    fetchColiSpace()
    fetchPhotos()
  }, [coliSpaceId])

  const handleGoBack = () => {
    navigation.goBack()
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

  const fetchPhotos = async () => {
    // Pour l'instant, on simule des photos existantes
    // Dans un vrai projet, on récupérerait depuis Supabase Storage
    setPhotos([
      {
        id: '1',
        uri: 'https://via.placeholder.com/200x200?text=Photo+1',
        uploaded_at: new Date().toISOString(),
        uploaded_by: user!.id
      },
      {
        id: '2',
        uri: 'https://via.placeholder.com/200x200?text=Photo+2',
        uploaded_at: new Date().toISOString(),
        uploaded_by: 'other_user'
      }
    ])
  }

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
    })

    if (!result.canceled) {
      const newSelectedPhotos = result.assets.map(asset => asset.uri)
      setSelectedPhotos(prev => [...prev, ...newSelectedPhotos])
    }
  }

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      setSelectedPhotos(prev => [...prev, result.assets[0].uri])
    }
  }

  const removeSelectedPhoto = (uri: string) => {
    setSelectedPhotos(prev => prev.filter(photoUri => photoUri !== uri))
  }

  const uploadPhotos = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins une photo')
      return
    }

    setIsUploading(true)
    try {
      // Simulation d'upload
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Dans un vrai projet, on uploaderait vers Supabase Storage
      // puis on ajouterait les références en base

      Alert.alert('Succès', `${selectedPhotos.length} photo(s) uploadée(s) avec succès !`)
      setSelectedPhotos([])
      fetchPhotos() // Rafraîchir la liste
    } catch (error) {
      console.error('Erreur upload:', error)
      Alert.alert('Erreur', 'Échec de l\'upload des photos')
    } finally {
      setIsUploading(false)
    }
  }

  const renderPhoto = ({ item }: { item: Photo }) => (
    <View style={styles.photoContainer}>
      <Image source={{ uri: item.uri }} style={styles.photo} />
      <Text style={styles.photoDate}>
        {new Date(item.uploaded_at).toLocaleDateString('fr-FR')}
      </Text>
    </View>
  )

  const renderSelectedPhoto = ({ item }: { item: string }) => (
    <View style={styles.selectedPhotoContainer}>
      <Image source={{ uri: item }} style={styles.selectedPhoto} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeSelectedPhoto(item)}
      >
        <Ionicons name="close-circle" size={24} color="#ff4444" />
      </TouchableOpacity>
    </View>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 15,
      paddingTop: 50,
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
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
      flex: 1,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      marginLeft: 15,
      padding: 5,
    },
    content: {
      flex: 1,
      padding: 15,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#fff' : '#000',
      marginBottom: 15,
    },
    actionButtons: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    actionButton: {
      flex: 1,
      backgroundColor: '#6C47FF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    selectedPhotosSection: {
      marginBottom: 20,
    },
    selectedPhotosList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    selectedPhotoContainer: {
      position: 'relative',
      margin: 5,
    },
    selectedPhoto: {
      width: 100,
      height: 100,
      borderRadius: 8,
    },
    removeButton: {
      position: 'absolute',
      top: -10,
      right: -10,
      backgroundColor: '#fff',
      borderRadius: 12,
    },
    confirmButton: {
      backgroundColor: '#28a745',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 20,
    },
    confirmButtonDisabled: {
      backgroundColor: '#ccc',
    },
    confirmButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    existingPhotosSection: {
      flex: 1,
    },
    photosList: {
      // FlatList with numColumns handles layout automatically
    },
    photoContainer: {
      margin: 5,
      alignItems: 'center',
    },
    photo: {
      width: 100,
      height: 100,
      borderRadius: 8,
    },
    photoDate: {
      fontSize: 12,
      color: theme === 'dark' ? '#ccc' : '#666',
      marginTop: 5,
      textAlign: 'center',
    },
  })

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Photos - {coliSpace?.announcements ?
            `${coliSpace.announcements.departure_city} → ${coliSpace.announcements.arrival_city}` :
            'Coli Space'
          }
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={takePhoto} style={styles.headerButton}>
            <Ionicons name="camera" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Boutons d'action */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={pickImages} style={styles.actionButton}>
            <Ionicons name="images" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Galerie</Text>
          </TouchableOpacity>
        </View>

        {/* Photos sélectionnées */}
        {selectedPhotos.length > 0 && (
          <View style={styles.selectedPhotosSection}>
            <Text style={styles.sectionTitle}>Photos à uploader ({selectedPhotos.length})</Text>
            <FlatList
              data={selectedPhotos}
              keyExtractor={(item) => item}
              renderItem={renderSelectedPhoto}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
            <TouchableOpacity
              style={[styles.confirmButton, isUploading && styles.confirmButtonDisabled]}
              onPress={uploadPhotos}
              disabled={isUploading}
            >
              <Text style={styles.confirmButtonText}>
                {isUploading ? 'Upload en cours...' : 'Confirmer l\'upload'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Photos existantes */}
        <View style={styles.existingPhotosSection}>
          <Text style={styles.sectionTitle}>Photos du coli</Text>
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            renderItem={renderPhoto}
            numColumns={3}
            contentContainerStyle={styles.photosList}
            ListEmptyComponent={
              <Text style={{ color: theme === 'dark' ? '#ccc' : '#666', textAlign: 'center', marginTop: 20 }}>
                Aucune photo pour le moment
              </Text>
            }
          />
        </View>
      </View>
    </View>
  )
}

export default PhotosScreen
