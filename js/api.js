// API client for interfacing with the backend

// Base API URL - adjust if your server is running on a different port/host
const API_BASE_URL = window.location.origin;

// API functions
const api = {
    // Get all images
    getImages: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/images`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching images:', error);
            return [];
        }
    },

    // Add a new image
    addImage: async (url) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Failed to add image');
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding image:', error);
            throw error;
        }
    },

    // Delete an image
    deleteImage: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/images/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete image');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    },

    // Upload audio file to Cloudinary
    uploadAudioToCloudinary: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', cloudinaryConfig.uploadPreset);
            formData.append('resource_type', 'audio');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw error;
        }
    },

    // Get all audio tracks
    getAudioTracks: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/audio`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching audio tracks:', error);
            return [];
        }
    },

    // Add a new audio track
    addAudioTrack: async (trackData) => {
        try {
            console.log('API: Adding audio track with data:', trackData);

            if (!trackData || !trackData.url) {
                throw new Error('URL bài hát là bắt buộc');
            }

            const response = await fetch(`${API_BASE_URL}/api/audio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trackData),
            });

            const data = await response.json();
            console.log('API response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add audio track');
            }

            return data;
        } catch (error) {
            console.error('Error in API.addAudioTrack:', error);
            throw error;
        }
    },

    // Delete an audio track
    deleteAudioTrack: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/audio/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete audio track');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting audio track:', error);
            throw error;
        }
    }
};

// Export the API object
window.api = api;
