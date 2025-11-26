from typing import Dict, List, Optional
import numpy as np
import logging

logger = logging.getLogger(__name__)

class EmotionFusion:
    """Multimodal emotion fusion strategies"""
    
    CANONICAL_EMOTIONS = ['happy', 'sad', 'angry', 'calm', 'neutral', 'excited']
    
    def __init__(self):
        """Initialize fusion module"""
        logger.info("Initializing Emotion Fusion module")
        # Default weights for late fusion
        self.default_weights = {
            'face': 0.4,
            'speech': 0.3,
            'text': 0.3
        }
    
    def late_fusion(
        self,
        face_result: Optional[Dict] = None,
        speech_result: Optional[Dict] = None,
        text_result: Optional[Dict] = None,
        weights: Optional[Dict] = None
    ) -> Dict:
        """Late fusion: weighted average of probability distributions"""
        try:
            if weights is None:
                weights = self.default_weights.copy()
            
            # Collect available modalities
            available_modalities = []
            modality_probs = []
            modality_weights = []
            
            if face_result and 'probabilities' in face_result:
                available_modalities.append('face')
                modality_probs.append(face_result['probabilities'])
                modality_weights.append(weights.get('face', 0.4))
            
            if speech_result and 'probabilities' in speech_result:
                available_modalities.append('speech')
                modality_probs.append(speech_result['probabilities'])
                modality_weights.append(weights.get('speech', 0.3))
            
            if text_result and 'probabilities' in text_result:
                available_modalities.append('text')
                modality_probs.append(text_result['probabilities'])
                modality_weights.append(weights.get('text', 0.3))
            
            if len(available_modalities) == 0:
                raise ValueError("No valid modality results provided")
            
            # Normalize weights
            total_weight = sum(modality_weights)
            normalized_weights = [w/total_weight for w in modality_weights]
            
            # Compute weighted average
            fused_probs = {emotion: 0.0 for emotion in self.CANONICAL_EMOTIONS}
            
            for probs, weight in zip(modality_probs, normalized_weights):
                for emotion in self.CANONICAL_EMOTIONS:
                    fused_probs[emotion] += probs.get(emotion, 0.0) * weight
            
            # Get top emotion
            top_emotion = max(fused_probs, key=fused_probs.get)
            confidence = fused_probs[top_emotion]
            
            return {
                'emotion_fused': top_emotion,
                'confidence': float(confidence),
                'probabilities': fused_probs,
                'modalities_used': available_modalities,
                'weights': dict(zip(available_modalities, normalized_weights))
            }
            
        except Exception as e:
            logger.error(f"Late fusion error: {str(e)}")
            # Return neutral on error
            return {
                'emotion_fused': 'neutral',
                'confidence': 0.5,
                'probabilities': {e: 1/6 for e in self.CANONICAL_EMOTIONS},
                'modalities_used': [],
                'weights': {}
            }
    
    def get_modality_confidences(
        self,
        face_result: Optional[Dict] = None,
        speech_result: Optional[Dict] = None,
        text_result: Optional[Dict] = None
    ) -> Dict:
        """Get individual confidence scores for each modality"""
        confidences = {}
        
        if face_result:
            confidences['face'] = face_result.get('confidence', 0.0)
        
        if speech_result:
            confidences['speech'] = speech_result.get('confidence', 0.0)
        
        if text_result:
            confidences['text'] = text_result.get('confidence', 0.0)
        
        return confidences
