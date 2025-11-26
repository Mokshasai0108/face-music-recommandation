import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Face emotion prediction
export const predictFaceEmotion = async (imageBase64) => {
  const response = await api.post('/predict/face', { image: imageBase64 });
  return response.data;
};



// Text emotion prediction
export const predictTextEmotion = async (text) => {
  const response = await api.post('/predict/text', { text });
  return response.data;
};

// Fuse emotions
export const fuseEmotions = async (face, text, strategy = 'late', weights = null) => {
  const response = await api.post('/fuse', { face, text, strategy, weights });
  return response.data;
};

// Get song recommendation
export const recommendSong = async (emotion, currentSongId = null) => {
  const response = await api.post('/recommend', { emotion, current_song_id: currentSongId });
  return response.data;
};

// Log feedback
export const logFeedback = async (songId, emotion, emotionConfidence, rating) => {
  const response = await api.post('/feedback', {
    song_id: songId,
    emotion,
    emotion_confidence: emotionConfidence,
    rating,
    timestamp: new Date().toISOString()
  });
  return response.data;
};

// Get playlist stats
export const getPlaylistStats = async () => {
  const response = await api.get('/playlist/stats');
  return response.data;
};

// Fetch Spotify playlist
export const fetchSpotifyPlaylist = async () => {
  const response = await api.post('/setup/fetch-playlist');
  return response.data;
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
