import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import os
import re

def get_spotify_client():
    return spotipy.Spotify(auth_manager=SpotifyClientCredentials(
        client_id=os.environ.get('SPOTIFY_CLIENT_ID'),
        client_secret=os.environ.get('SPOTIFY_CLIENT_SECRET')
    ))

def extract_track_id(spotify_url):
    # handles https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=...
    match = re.search(r'track/([a-zA-Z0-9]+)', spotify_url)
    return match.group(1) if match else None

def fetch_album_art_from_url(spotify_url):
    try:
        sp = get_spotify_client()
        track_id = extract_track_id(spotify_url)
        if not track_id:
            return None
        track = sp.track(track_id)
        images = track['album']['images']
        return images[1]['url'] if len(images) > 1 else images[0]['url']
    except Exception as e:
        print(f"Spotify URL fetch failed: {e}")
    return None

def fetch_album_art_from_search(title, artist):
    try:
        sp = get_spotify_client()
        results = sp.search(q=f"track:{title} artist:{artist}", type='track', limit=1)
        items = results['tracks']['items']
        if items:
            images = items[0]['album']['images']
            return images[1]['url'] if len(images) > 1 else images[0]['url']
    except Exception as e:
        print(f"Spotify search failed: {e}")
    return None

def fetch_album_art(title, artist, spotify_url=None):
    if spotify_url:
        image = fetch_album_art_from_url(spotify_url)
        if image:
            return image
    # fallback to search
    return fetch_album_art_from_search(title, artist)