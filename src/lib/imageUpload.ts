import axios from 'axios';

const IMAGE_STORAGE_URL = 'https://image.streamespn.org/api/upload';
const API_KEY = 'espn_img_sec_d8f2b7a9e14c3b52a6d708e1f5c3b9a0';

export interface UploadResponse {
  success: boolean;
  url: string;
  filename?: string;
  error?: string;
}

export const uploadImageFile = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post<UploadResponse>(IMAGE_STORAGE_URL, formData, {
      headers: {
        'x-api-key': API_KEY,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    if (response.data && response.data.url) {
      return response.data.url;
    }
    throw new Error('Upload succeeded but no image URL was returned.');
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.error || err.message || 'Image upload failed. Please check network connection.';
    throw new Error(errorMessage);
  }
};
