-- Test simple de l'upload d'avatar
// Script de test pour vérifier l'upload d'avatar

import { supabase } from './lib/supabase'

export const testUpload = async (imageUri, fileName) => {
  try {
    console.log('Testing upload with URI:', imageUri)
    
    const fileExt = fileName.split('.').pop() || 'jpg'
    const fileNameUnique = `test_${Date.now()}.${fileExt}`
    
    // Essayer avec l'URI directement
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileNameUnique, imageUri, {
        contentType: `image/${fileExt}`,
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      return { success: false, error }
    }
    
    console.log('Upload success:', data)
    return { success: true, data }
  } catch (err) {
    console.error('Test failed:', err)
    return { success: false, error: err.message }
  }
}
