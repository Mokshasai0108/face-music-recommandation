from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

# Import emotion detection models
from models.face_emotion import FaceEmotionDetector
from models.speech_emotion import SpeechEmotionDetector

from models.fusion import EmotionFusion
from spotify_handler import SpotifyHandler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="Emotion Music API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize models (lazy loading)
face_detector = None
speech_detector = None

fusion_module = None
spotify_handler = None

def load_models():
    """Load ML models on startup"""
    global face_detector, speech_detector, fusion_module, spotify_handler
    
    logger.info("Starting model initialization...")
    
    # Initialize Spotify Handler first (lightweight and critical for setup)
    try:
        logger.info("Initializing Spotify Handler...")
        spotify_handler = SpotifyHandler()
    except Exception as e:
        logger.error(f"Error loading Spotify Handler: {str(e)}")

    # Initialize Face Detector
    try:
        face_detector = FaceEmotionDetector()
    except Exception as e:
        logger.error(f"Error loading Face Detector: {str(e)}")

    # Initialize Speech Detector
    try:
        speech_detector = SpeechEmotionDetector()
    except Exception as e:
        logger.error(f"Error loading Speech Detector: {str(e)}")



    # Initialize Fusion Module
    try:
        fusion_module = EmotionFusion()
    except Exception as e:
        logger.error(f"Error loading Fusion Module: {str(e)}")
        
    logger.info("Model initialization complete")

# Pydantic Models
class FacePredictRequest(BaseModel):
    image: str  # base64 encoded image

class SpeechPredictRequest(BaseModel):
    audio: str  # base64 encoded audio
    sample_rate: int = 16000



class FusionRequest(BaseModel):
    face: Optional[Dict] = None
    speech: Optional[Dict] = None
    face: Optional[Dict] = None
    speech: Optional[Dict] = None
    strategy: str = "late"
    weights: Optional[Dict] = None

class RecommendRequest(BaseModel):
    emotion: str
    current_song_id: Optional[str] = None

class FeedbackRequest(BaseModel):
    song_id: str
    emotion: str
    emotion_confidence: float
    rating: str  # like, dislike, skip
    timestamp: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "Emotion Music API", "status": "running"}

@api_router.get("/health")
async def health_check():
    """Check API and model health"""
    models_loaded = all([
        face_detector is not None,
        speech_detector is not None,
        face_detector is not None,
        speech_detector is not None,
        fusion_module is not None,
        spotify_handler is not None
    ])
    
    playlist_loaded = spotify_handler and spotify_handler.playlist_df is not None
    
    return {
        "status": "ok",
        "models_loaded": models_loaded,
        "spotify_playlist_loaded": playlist_loaded
    }

@api_router.post("/predict/face")
async def predict_face_emotion(request: FacePredictRequest):
    try:
        if face_detector is None:
            raise HTTPException(status_code=503, detail="Face detector not loaded")
        
        logger.info("Received face prediction request")
        result = face_detector.predict(request.image)
        logger.info(f"Face prediction result: {result}")
        return result
    except Exception as e:
        logger.error(f"Face prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/predict/speech")
async def predict_speech_emotion(request: SpeechPredictRequest):
    try:
        if speech_detector is None:
            raise HTTPException(status_code=503, detail="Speech detector not loaded")
        
        result = speech_detector.predict(request.audio, request.sample_rate)
        return result
    except Exception as e:
        logger.error(f"Speech prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@api_router.post("/fuse")
async def fuse_emotions(request: FusionRequest):
    try:
        if fusion_module is None:
            raise HTTPException(status_code=503, detail="Fusion module not loaded")
        
        if request.strategy == "late":
            return fusion_module.late_fusion(
                face_result=request.face,
                speech_result=request.speech,
                text_result=None,
                weights=request.weights
            )
        else:
            raise HTTPException(status_code=400, detail="Only late fusion supported")
    except Exception as e:
        logger.error(f"Fusion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/recommend")
async def recommend_song(request: RecommendRequest):
    try:
        if spotify_handler is None:
            raise HTTPException(status_code=503, detail="Spotify handler not initialized")
        
        logger.info(f"Received recommendation request for emotion: {request.emotion}")
        song = spotify_handler.recommend_by_emotion(request.emotion, request.current_song_id)
        
        if song is None:
            logger.warning("No song found")
            raise HTTPException(status_code=404, detail="No song found. Please sync playlist first.")
        
        logger.info(f"Recommended song: {song.get('title', 'Unknown')}")
        return song
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/feedback")
async def log_feedback(request: FeedbackRequest):
    """
    Feedback endpoint preserved but now does NOT store anything.
    Simply acknowledges receiving feedback.
    """
    return {"status": "received", "note": "MongoDB removed — feedback not stored."}

@api_router.get("/playlist/stats")
async def get_playlist_stats():
    try:
        if spotify_handler is None:
            raise HTTPException(status_code=503, detail="Spotify handler not initialized")
        
        return spotify_handler.get_playlist_stats()
    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/setup/fetch-playlist")
async def fetch_spotify_playlist():
    try:
        if spotify_handler is None:
            raise HTTPException(status_code=503, detail="Spotify handler not initialized")
        
        return spotify_handler.fetch_and_cache_playlist()
    except Exception as e:
        logger.error(f"Playlist fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/session")
async def get_session_analytics():
    """Returns empty structure since MongoDB is removed."""
    return {
        "emotions_timeline": [],
        "songs_played": [],
        "feedback": []
    }

# Include router
app.include_router(api_router)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    load_models()
