import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv
import sys

# Load env vars
load_dotenv()

client_id = os.getenv('SPOTIFY_CLIENT_ID')
client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
playlist_id = os.getenv('SPOTIFY_PLAYLIST_ID')

print(f"Testing with:")
print(f"Client ID: {client_id[:5]}..." if client_id else "Client ID: None")
print(f"Playlist ID: {playlist_id}")

if not client_id or not client_secret:
    print("Error: Missing credentials")
    sys.exit(1)

try:
    auth_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
    sp = spotipy.Spotify(auth_manager=auth_manager)
    
    print("\nAttempting to fetch playlist...")
    playlist = sp.playlist(playlist_id)
    print(f"Success! Found playlist: {playlist['name']}")
    print(f"Owner: {playlist['owner']['display_name']}")
    print(f"Public: {playlist['public']}")
    print(f"Tracks: {playlist['tracks']['total']}")

except spotipy.exceptions.SpotifyException as e:
    print(f"\nSpotify Error: {e}")
    print(f"HTTP Status: {e.http_status}")
    print(f"Code: {e.code}")
    print(f"Message: {e.msg}")
except Exception as e:
    print(f"\nGeneral Error: {e}")
