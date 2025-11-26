import cv2
import numpy as np
import base64
from typing import Dict
import logging
from deepface import DeepFace

logger = logging.getLogger(__name__)

class FaceEmotionDetector:
    """Face emotion detection using DeepFace"""
    
    CANONICAL_EMOTIONS = ['happy', 'sad', 'angry', 'calm', 'neutral', 'excited']
    
    def __init__(self):
        """Initialize face detector"""
        logger.info("Initializing Face Emotion Detector...")
        # DeepFace loads models on first call, but we can warm it up if needed.
        # For now, we just rely on it being installed.
        logger.info("Face Emotion Detector ready (using DeepFace)")
    
    def decode_image(self, base64_string: str) -> np.ndarray:
        """Decode base64 image to numpy array"""
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        img_bytes = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    
    def map_emotions(self, deepface_emotions: Dict) -> Dict:
        """Map DeepFace emotions to our canonical set"""
        # DeepFace: angry, disgust, fear, happy, sad, surprise, neutral
        # Ours: happy, sad, angry, calm, neutral, excited
        
        mapped = {e: 0.0 for e in self.CANONICAL_EMOTIONS}
        
        # Direct mappings
        mapped['happy'] = float(deepface_emotions.get('happy', 0.0))
        mapped['sad'] = float(deepface_emotions.get('sad', 0.0)) + float(deepface_emotions.get('fear', 0.0)) * 0.5
        mapped['angry'] = float(deepface_emotions.get('angry', 0.0)) + float(deepface_emotions.get('disgust', 0.0)) * 0.5
        mapped['neutral'] = float(deepface_emotions.get('neutral', 0.0))
        
        # Mapped mappings
        mapped['excited'] = float(deepface_emotions.get('surprise', 0.0))
        
        # 'calm' is not in DeepFace. We can infer it from low arousal emotions or just map a bit of neutral/sad to it.
        # Or we can say 'neutral' with high confidence is 'calm'.
        # For now, let's distribute some 'neutral' to 'calm' if neutral is high.
        
        if mapped['neutral'] > 0.4:
            mapped['calm'] = mapped['neutral'] * 0.4
            mapped['neutral'] = mapped['neutral'] * 0.6
            
        # Normalize
        total = sum(mapped.values())
        if total > 0:
            mapped = {k: float(v/total) for k, v in mapped.items()}
            
        return mapped

    def predict(self, image_base64: str) -> Dict:
        """Predict emotion from base64 encoded image"""
        try:
            # Decode image
            img = self.decode_image(image_base64)
            
            if img is None:
                raise ValueError("Failed to decode image")
            
            # DeepFace analyze
            # enforce_detection=False allows it to return even if face detection is weak (or it processes the whole image)
            # However, if no face is found, it might throw an error or return default.
            try:
                results = DeepFace.analyze(
                    img_path=img, 
                    actions=['emotion'], 
                    enforce_detection=True,
                    detector_backend='retinaface',
                    silent=True
                )
            except Exception as inner_e:
                logger.warning(f"DeepFace analysis failed: {inner_e}")
                results = []

            if results:
                # DeepFace returns a list (one for each face). We take the first/largest.
                result = results[0]
                deepface_emotions = result['emotion']
                
                # Map to our emotions
                canonical_probs = self.map_emotions(deepface_emotions)
                
                # Get top emotion
                top_emotion = max(canonical_probs, key=canonical_probs.get)
                confidence = canonical_probs[top_emotion]
                
                return {
                    'emotion': top_emotion,
                    'confidence': float(confidence),
                    'probabilities': canonical_probs
                }
            else:
                # No face detected or analysis failed
                logger.warning("No face detected or analysis failed")
                return {
                    'emotion': 'neutral',
                    'confidence': 0.5,
                    'probabilities': {e: 1/6 for e in self.CANONICAL_EMOTIONS}
                }
            
        except Exception as e:
            logger.error(f"Face emotion detection error: {str(e)}")
            return {
                'emotion': 'neutral',
                'confidence': 0.5,
                'probabilities': {e: 1/6 for e in self.CANONICAL_EMOTIONS}
            }
