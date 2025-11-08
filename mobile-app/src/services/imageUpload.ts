import * as ImagePicker from 'expo-image-picker';
import { apiService } from './api';

export interface ImageUploadResult {
  uri: string;
  url?: string;
  error?: string;
}

export const pickImage = async (): Promise<ImageUploadResult | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return {
        uri: '',
        error: 'Permission to access media library is required',
      };
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return {
      uri: result.assets[0].uri,
    };
  } catch (error: any) {
    return {
      uri: '',
      error: error.message || 'Failed to pick image',
    };
  }
};

export const takePhoto = async (): Promise<ImageUploadResult | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return {
        uri: '',
        error: 'Permission to access camera is required',
      };
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return {
      uri: result.assets[0].uri,
    };
  } catch (error: any) {
    return {
      uri: '',
      error: error.message || 'Failed to take photo',
    };
  }
};

export const uploadImage = async (
  uri: string,
  endpoint: string,
  fieldName: string = 'file'
): Promise<ImageUploadResult> => {
  try {
    const formData = new FormData();
    
    // Get file name from URI
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append(fieldName, {
      uri,
      name: filename,
      type,
    } as any);

    // In production, use proper upload endpoint
    // For now, return the local URI
    return {
      uri,
      url: uri, // In production, this would be the server URL
    };
  } catch (error: any) {
    return {
      uri: '',
      error: error.message || 'Failed to upload image',
    };
  }
};

