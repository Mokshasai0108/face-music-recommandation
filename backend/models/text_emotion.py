from transformers import pipeline
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class TextEmotionDetector:
    """Text emotion detection using HuggingFace transformers"""
    
    # Map model outputs to canonical emotions
    EMOTION_MAPPING = {
        'joy': 'happy',
        'happiness': 'happy',
        'love': 'happy',
        'sadness': 'sad',
        'sad': 'sad',
        'anger': 'angry',
        'angry': 'angry',
        'fear': 'calm',
        'surprise': 'excited',
        'neutral': 'neutral',
        'disgust': 'angry'
    }
    
    CANONICAL_EMOTIONS = ['happy', 'sad', 'angry', 'calm', 'neutral', 'excited']
    
    def __init__(self):
        """Initialize text emotion classifier"""
        logger.info("Initializing Text Emotion Detector...")
        try:
            # Using distilbert-base-uncased-emotion for emotion classification
            self.classifier = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                top_k=None  # Return all emotion scores
            )
            logger.info("Text Emotion Detector ready")
        except Exception as e:
            logger.error(f"Failed to load text emotion model: {str(e)}")
            self.classifier = None
    
    def map_to_canonical(self, model_outputs: list) -> Dict:
        """Map model outputs to canonical 6 emotions"""
        canonical_probs = {emotion: 0.0 for emotion in self.CANONICAL_EMOTIONS}
        
        for output in model_outputs:
            label = output['label'].lower()
            score = output['score']
            
            canonical_emotion = self.EMOTION_MAPPING.get(label, 'neutral')
            canonical_probs[canonical_emotion] += score
        
        # Normalize
        total = sum(canonical_probs.values())
        if total > 0:
            canonical_probs = {k: v/total for k, v in canonical_probs.items()}
        
        return canonical_probs
    
    def predict(self, text: str) -> Dict:
        """Predict emotion from text"""
        try:
            if not text or len(text.strip()) == 0:
                raise ValueError("Empty text input")
            
            if self.classifier is None:
                raise ValueError("Text classifier not loaded")
            
            # Get predictions
            results = self.classifier(text[:512])  # Limit to 512 chars
            
            # Map to canonical emotions
            if isinstance(results, list) and len(results) > 0:
                canonical_probs = self.map_to_canonical(results[0])
            else:
                canonical_probs = self.map_to_canonical(results)
            
            # Get top emotion
            top_emotion = max(canonical_probs, key=canonical_probs.get)
            confidence = canonical_probs[top_emotion]
            
            return {
                'emotion': top_emotion,
                'confidence': float(confidence),
                'probabilities': canonical_probs
            }
            
        except Exception as e:
            logger.error(f"Text emotion detection error: {str(e)}")
            # Simple keyword-based fallback
            return self.fallback_predict(text)
    
    def fallback_predict(self, text: str) -> Dict:
        """Simple keyword-based emotion detection fallback"""
        text_lower = text.lower()
        
        # Keyword lists
        happy_words = ['happy', 'joy', 'excited', 'love', 'great', 'wonderful', 'amazing', 'fantastic']
        sad_words = ['sad', 'depressed', 'unhappy', 'miserable', 'down', 'blue', 'gloomy']
        angry_words = ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated']
        calm_words = ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'chill']
        excited_words = ['excited', 'energetic', 'pumped', 'hyped', 'thrilled']
        
        scores = {
            'happy': sum(1 for word in happy_words if word in text_lower),
            'sad': sum(1 for word in sad_words if word in text_lower),
            'angry': sum(1 for word in angry_words if word in text_lower),
            'calm': sum(1 for word in calm_words if word in text_lower),
            'excited': sum(1 for word in excited_words if word in text_lower),
            'neutral': 1
        }
        
        total = sum(scores.values())
        probs = {k: v/total for k, v in scores.items()}
        
        top_emotion = max(probs, key=probs.get)
        
        return {
            'emotion': top_emotion,
            'confidence': float(probs[top_emotion]),
            'probabilities': probs
        }
