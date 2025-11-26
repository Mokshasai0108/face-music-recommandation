import os
import pandas as pd
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from typing import Dict, List, Optional
import logging
from pathlib import Path
import json

logger = logging.getLogger(__name__)

class SpotifyHandler:
    """Handle Spotify API interactions and playlist caching"""
    
    # Emotion to audio feature mapping
    # Emotion to audio feature mapping
    EMOTION_CRITERIA = {
        'happy': {'valence': (0.6, 1.0), 'energy': (0.5, 1.0)},
        'sad': {'valence': (0.0, 0.4), 'energy': (0.0, 0.6)},
        'angry': {'valence': (0.0, 0.5), 'energy': (0.6, 1.0)},
        'calm': {'valence': (0.4, 1.0), 'energy': (0.0, 0.4)},
        'neutral': {'valence': (0.3, 0.7), 'energy': (0.3, 0.7)},
        'excited': {'valence': (0.5, 1.0), 'energy': (0.7, 1.0)}
    }
    
    def __init__(self):
        """Initialize Spotify client"""
        self.client_id = os.getenv('SPOTIFY_CLIENT_ID')
        self.client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
        self.playlist_id = os.getenv('SPOTIFY_PLAYLIST_ID')
        
        self.data_dir = Path(__file__).parent / 'data'
        self.data_dir.mkdir(exist_ok=True, parents=True)
        self.cache_file = self.data_dir / 'spotify_playlist_25hrs.csv'
        
        self.sp = None
        self.playlist_df = None
        
        # Try to initialize Spotify client
        self._init_spotify_client()
        
        # Load cached playlist if exists
        self._load_cache()
    
    def _init_spotify_client(self):
        """Initialize Spotify API client"""
        try:
            logger.info(f"Initializing Spotify client with ID: {self.client_id[:5]}... if present")
            if self.client_id == 'your_client_id_here' or not self.client_id:
                logger.warning("Spotify credentials not configured. Please update .env file.")
                return
            
            auth_manager = SpotifyClientCredentials(
                client_id=self.client_id,
                client_secret=self.client_secret
            )
            self.sp = spotipy.Spotify(auth_manager=auth_manager)
            logger.info("Spotify client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Spotify client: {str(e)}")
            self.sp = None
    
    def _load_cache(self):
        """Load cached playlist data or fetch if missing"""
        try:
            logger.info(f"Checking for cache file at: {self.cache_file}")
            
            if self.cache_file.exists():
                self.playlist_df = pd.read_csv(self.cache_file)
                if len(self.playlist_df) > 0:
                    logger.info(f"Loaded {len(self.playlist_df)} tracks from cache")
                    return

            logger.info("Cache missing or empty. Fetching from Spotify...")
            result = self.fetch_and_cache_playlist()
            if result.get('status') == 'success':
                logger.info("Successfully fetched and cached playlist on startup")
            else:
                logger.error(f"Failed to fetch playlist on startup: {result.get('message')}")

        except Exception as e:
            logger.error(f"Failed to load cache: {str(e)}")
    
    def _estimate_features(self, genres: List[str]) -> Dict[str, float]:
        """Estimate valence and energy based on genres"""
        valence = 0.5
        energy = 0.5
        
        if not genres:
            return {'valence': valence, 'energy': energy}
            
        # Simple keyword matching
        happy_keywords = ['pop', 'dance', 'disco', 'funk', 'happy', 'upbeat', 'party', 'summer', 'synthpop']
        sad_keywords = ['sad', 'acoustic', 'ballad', 'slow', 'blues', 'folk', 'indie folk', 'melancholy', 'piano', 'heartbreak']
        angry_keywords = ['metal', 'rock', 'punk', 'grunge', 'aggressive', 'hardcore', 'screamo', 'industrial']
        calm_keywords = ['classical', 'jazz', 'ambient', 'chill', 'lo-fi', 'piano', 'meditation', 'sleep', 'instrumental']
        excited_keywords = ['edm', 'techno', 'house', 'party', 'electronic', 'dubstep', 'drum and bass', 'trance', 'club']
        
        genre_text = " ".join(genres).lower()
        
        if any(k in genre_text for k in happy_keywords):
            valence += 0.4
            energy += 0.3
        if any(k in genre_text for k in sad_keywords):
            valence -= 0.4
            energy -= 0.3
        if any(k in genre_text for k in angry_keywords):
            valence -= 0.3
            energy += 0.4
        if any(k in genre_text for k in calm_keywords):
            valence += 0.2
            energy -= 0.4
        if any(k in genre_text for k in excited_keywords):
            valence += 0.3
            energy += 0.5
            
        # Clamp values
        return {
            'valence': max(0.0, min(1.0, valence)),
            'energy': max(0.0, min(1.0, energy))
        }

    def fetch_and_cache_playlist(self) -> Dict:
        """Fetch playlist from Spotify and cache locally"""
        try:
            if self.sp is None:
                return {
                    'status': 'error',
                    'message': 'Spotify client not initialized. Please check credentials.'
                }
            
            logger.info(f"Fetching playlist: {self.playlist_id}")
            
            # Fetch all tracks
            tracks = []
            # Use sp.playlist instead of playlist_tracks for better reliability
            playlist = self.sp.playlist(self.playlist_id)
            results = playlist['tracks']
            tracks.extend(results['items'])
            
            while results['next']:
                results = self.sp.next(results)
                tracks.extend(results['items'])
            
            logger.info(f"Fetched {len(tracks)} tracks")
            
            # Extract Artist IDs
            artist_ids = set()
            for item in tracks:
                if item['track'] and item['track']['artists']:
                    aid = item['track']['artists'][0]['id']
                    if aid:
                        artist_ids.add(aid)
            
            artist_ids = list(artist_ids)
            logger.info(f"Found {len(artist_ids)} unique artists")
            
            # Fetch Artists in batches
            artist_map = {}
            batch_size = 50
            for i in range(0, len(artist_ids), batch_size):
                batch = artist_ids[i:i+batch_size]
                artists = self.sp.artists(batch)
                for artist in artists['artists']:
                    artist_map[artist['id']] = artist['genres']
            
            logger.info("Fetched artist details")
            
            # Build dataframe
            playlist_data = []
            for track_item in tracks:
                if not track_item['track']:
                    continue
                
                track = track_item['track']
                artist_id = track['artists'][0]['id'] if track['artists'] else None
                genres = artist_map.get(artist_id, []) if artist_id else []
                
                # Estimate features
                features = self._estimate_features(genres)
                
                playlist_data.append({
                    'track_id': track['id'],
                    'title': track['name'],
                    'artist': ', '.join([artist['name'] for artist in track['artists']]),
                    'album': track['album']['name'],
                    'image_url': track['album']['images'][0]['url'] if track['album']['images'] else '',
                    'preview_url': track['preview_url'] or '',
                    'url': track['external_urls'].get('spotify', ''),
                    'duration_ms': track['duration_ms'],
                    'valence': features['valence'],
                    'energy': features['energy'],
                    'tempo': 120.0, # Default
                    'danceability': 0.5, # Default
                    'acousticness': 0.5, # Default
                    'key': 0, # Default
                    'mode': 1 # Default
                })
            
            # Save to cache
            self.playlist_df = pd.DataFrame(playlist_data)
            self.playlist_df.to_csv(self.cache_file, index=False)
            
            total_duration_hours = self.playlist_df['duration_ms'].sum() / (1000 * 60 * 60)
            
            logger.info(f"Cached {len(self.playlist_df)} tracks to {self.cache_file}")
            
            return {
                'status': 'success',
                'songs_cached': len(self.playlist_df),
                'duration_hours': round(total_duration_hours, 2)
            }
            
        except Exception as e:
            import traceback
            logger.error(f"Failed to fetch playlist: {str(e)}")
            return {
                'status': 'error',
                'message': f"{str(e)} | {traceback.format_exc()}"
            }
    
    def recommend_by_emotion(self, emotion: str, current_song_id: Optional[str] = None) -> Optional[Dict]:
        """Recommend a song based on detected emotion"""
        try:
            if self.playlist_df is None or len(self.playlist_df) == 0:
                logger.warning("Playlist not loaded")
                return None
            
            # Get emotion criteria
            criteria = self.EMOTION_CRITERIA.get(emotion, self.EMOTION_CRITERIA['neutral'])
            
            # Filter songs matching emotion
            filtered_df = self.playlist_df.copy()
            
            for feature, (min_val, max_val) in criteria.items():
                filtered_df = filtered_df[
                    (filtered_df[feature] >= min_val) & 
                    (filtered_df[feature] <= max_val)
                ]
            
            # Exclude current song
            if current_song_id:
                filtered_df = filtered_df[filtered_df['track_id'] != current_song_id]
            
            if len(filtered_df) == 0:
                # Fallback to any song if no matches
                logger.warning(f"No songs found for emotion '{emotion}' with criteria {criteria}. Falling back to random song.")
                filtered_df = self.playlist_df
            
            # Pick random song
            song = filtered_df.sample(n=1).iloc[0]
            
            return {
                'song_id': song['track_id'],
                'title': song['title'],
                'artist': song['artist'],
                'album': song['album'],
                'image_url': song['image_url'],
                'preview_url': song['preview_url'],
                'url': song['url'],
                'valence': float(song['valence']),
                'energy': float(song['energy']),
                'duration_ms': int(song['duration_ms'])
            }
            
        except Exception as e:
            logger.error(f"Recommendation error: {str(e)}")
            return None
    
    def get_playlist_stats(self) -> Dict:
        """Get statistics about the cached playlist"""
        try:
            if self.playlist_df is None or len(self.playlist_df) == 0:
                return {
                    'total_songs': 0,
                    'total_duration_hours': 0,
                    'average_valence': 0,
                    'average_energy': 0,
                    'cached': False
                }
            
            total_duration_hours = self.playlist_df['duration_ms'].sum() / (1000 * 60 * 60)
            
            # Classify songs by mood
            mood_distribution = {}
            for emotion in self.EMOTION_CRITERIA.keys():
                criteria = self.EMOTION_CRITERIA[emotion]
                filtered = self.playlist_df.copy()
                for feature, (min_val, max_val) in criteria.items():
                    filtered = filtered[
                        (filtered[feature] >= min_val) & 
                        (filtered[feature] <= max_val)
                    ]
                mood_distribution[emotion] = len(filtered)
            
            return {
                'total_songs': len(self.playlist_df),
                'total_duration_hours': round(total_duration_hours, 2),
                'average_valence': float(self.playlist_df['valence'].mean()),
                'average_energy': float(self.playlist_df['energy'].mean()),
                'average_tempo': float(self.playlist_df['tempo'].mean()),
                'mood_distribution': mood_distribution,
                'cached': True
            }
            
        except Exception as e:
            logger.error(f"Stats error: {str(e)}")
            return {'error': str(e)}
