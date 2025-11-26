import numpy as np
import base64
import io
import librosa
from typing import Dict
import logging
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class SpeechEmotionDetector:
    """Speech emotion detection using audio features"""
    
    CANONICAL_EMOTIONS = ['happy', 'sad', 'angry', 'calm', 'neutral', 'excited']
    
    def __init__(self):
        """Initialize speech emotion detector"""
        logger.info("Initializing Speech Emotion Detector...")
        # For MVP, using feature-based heuristics
        # Can be replaced with SpeechBrain model later
        logger.info("Speech Emotion Detector ready")
    
    def decode_audio(self, audio_base64: str, sample_rate: int = 16000) -> np.ndarray:
        """Decode base64 audio to numpy array"""
        # Remove data URL prefix if present
        if ',' in audio_base64:
            audio_base64 = audio_base64.split(',')[1]
        
        audio_bytes = base64.b64decode(audio_base64)
        audio_array, sr = librosa.load(io.BytesIO(audio_bytes), sr=sample_rate)
        return audio_array, sr
    
    def extract_features(self, audio: np.ndarray, sr: int) -> Dict:
        """Extract audio features for emotion detection"""
        # Energy
        energy = np.mean(librosa.feature.rms(y=audio))
        
        # Zero crossing rate
        zcr = np.mean(librosa.feature.zero_crossing_rate(audio))
        
        # Spectral centroid (brightness)
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr))
        
        # Tempo
        tempo, _ = librosa.beat.beat_track(y=audio, sr=sr)
        
        # Pitch (fundamental frequency)
        pitches, magnitudes = librosa.piptrack(y=audio, sr=sr)
        pitch = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0
        
        # MFCCs
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfccs, axis=1)
        
        return {
            'energy': float(energy),
            'zcr': float(zcr),
            'spectral_centroid': float(spectral_centroid),
            'tempo': float(tempo),
            'pitch': float(pitch),
            'mfcc_mean': mfcc_mean.tolist()
        }
    
    def predict_from_features(self, features: Dict) -> Dict:
        """Predict emotion based on audio features (heuristic approach)"""
        energy = features['energy']
        tempo = features['tempo']
        pitch = features['pitch']
        zcr = features['zcr']
        
        # Initialize probabilities
        probs = {emotion: 0.0 for emotion in self.CANONICAL_EMOTIONS}
        
        # Heuristic rules based on prosodic features
        # High energy + high tempo = excited/angry
        if energy > 0.05 and tempo > 120:
            probs['excited'] = 0.4
            probs['angry'] = 0.2
            probs['happy'] = 0.2
        
        # Low energy + low tempo = sad/calm
        elif energy < 0.03 and tempo < 100:
            probs['sad'] = 0.3
            probs['calm'] = 0.3
            probs['neutral'] = 0.2
        
        # High energy + moderate tempo = happy
        elif energy > 0.04 and 100 <= tempo <= 130:
            probs['happy'] = 0.4
            probs['excited'] = 0.2
            probs['neutral'] = 0.2
        
        # Low energy + moderate tempo = calm
        elif energy < 0.04 and 90 <= tempo <= 120:
            probs['calm'] = 0.4
            probs['neutral'] = 0.3
            probs['sad'] = 0.1
        
        # High ZCR suggests agitation
        if zcr > 0.1:
            probs['angry'] += 0.1
            probs['excited'] += 0.1
        
        # Default to neutral if unclear
        if sum(probs.values()) < 0.5:
            probs['neutral'] = 0.5
        
        # Normalize
        total = sum(probs.values())
        if total > 0:
            probs = {k: v/total for k, v in probs.items()}
        else:
            probs = {e: 1/6 for e in self.CANONICAL_EMOTIONS}
        
        top_emotion = max(probs, key=probs.get)
        confidence = probs[top_emotion]
        
        return {
            'emotion': top_emotion,
            'confidence': float(confidence),
            'probabilities': probs
        }
    
    def predict(self, audio_base64: str, sample_rate: int = 16000) -> Dict:
        """Predict emotion from base64 encoded audio"""
        try:
            # Decode audio
            audio, sr = self.decode_audio(audio_base64, sample_rate)
            
            if len(audio) == 0:
                raise ValueError("Empty audio data")
            
            # Extract features
            features = self.extract_features(audio, sr)
            
            # Predict emotion
            result = self.predict_from_features(features)
            
            return result
            
        except Exception as e:
            logger.error(f"Speech emotion detection error: {str(e)}")
            # Return neutral with low confidence on error
            return {
                'emotion': 'neutral',
                'confidence': 0.5,
                'probabilities': {e: 1/6 for e in self.CANONICAL_EMOTIONS}
            }
