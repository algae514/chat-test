import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'application/pdf': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'text/plain': true
};

import type { FileAttachment } from '../types';

type UploadResponse = FileAttachment;

export const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }
  
  if (!ALLOWED_FILE_TYPES[file.type]) {
    return 'File type not supported';
  }
  
  return null;
};

export const uploadFile = async (file: File, userId: string): Promise<UploadResponse> => {
  console.log('Starting file upload for user:', userId);
  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const timestamp = Date.now();
  const fileName = `${userId}_${timestamp}_${file.name}`;
  // Create a storage reference with a unique path
  const uniqueId = Math.random().toString(36).substring(2);
  const filePath = `uploads/${uniqueId}_${Date.now()}_${file.name}`;
  console.log('File path:', filePath);
  const storageRef = ref(storage, filePath);

  try {
    console.log('Starting upload...');
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    const snapshot = await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress + '%');
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        () => {
          resolve(uploadTask.snapshot);
        }
      );
    });
    const downloadURL = await getDownloadURL(snapshot.ref);

    const result: UploadResponse = {
      url: downloadURL,
      fileName: file.name,
      fileType: file.type,
      size: file.size
    };
    console.log('Upload completed with result:', result);
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};
