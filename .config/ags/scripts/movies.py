#!/usr/bin/env python3
"""
CLI-friendly movie/series provider using TMDB API
"""

import json
import sys
import argparse
import requests
import os
from dataclasses import dataclass, asdict
from typing import List, Optional
from pathlib import Path

API_KEY = "YOUR_TMDB_API_KEY"  # User needs to replace this
BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# Cache directory for posters
CACHE_DIR = Path.home() / ".config" / "ags" / "assets" / "movies" / "posters"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def download_poster(poster_path: str, movie_id: int) -> Optional[str]:
    """Download poster image to cache and return local path"""
    if not poster_path:
        return None
    
    # Create filename from movie ID
    filename = f"{movie_id}.jpg"
    local_path = CACHE_DIR / filename
    
    # If already cached, return local path
    if local_path.exists():
        return str(local_path)
    
    # Download the image
    image_url = f"{IMAGE_BASE_URL}{poster_path}"
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Save to cache
        with open(local_path, "wb") as f:
            f.write(response.content)
        
        return str(local_path)
    except Exception as e:
        print(f"Failed to download poster for {movie_id}: {e}", file=sys.stderr)
        return None


class TMDBProvider:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def process_item(self, item: dict) -> dict:
        """Process item and download poster"""
        # Ensure media_type is set
        if "media_type" not in item:
            item["media_type"] = "movie" if "title" in item else "tv"
        
        # Download poster and update poster_path to local path
        movie_id = item.get("id", 0)
        poster_path = item.get("poster_path")
        
        if poster_path:
            local_poster = download_poster(poster_path, movie_id)
            if local_poster:
                item["poster_path"] = local_poster
            else:
                item["poster_path"] = None
        
        # Also create poster_url field for compatibility
        item["poster_url"] = item.get("poster_path")
        
        return item

    def search(self, query: str, limit: int = 10) -> List[dict]:
        """Search for movies and TV shows"""
        url = f"{BASE_URL}/search/multi"
        params = {
            "query": query,
            "include_adult": "false",
            "language": "en-US",
            "page": 1
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("results", [])[:limit]:
                if item.get("media_type") in ["movie", "tv"]:
                    results.append(self.process_item(item))
            return results
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return []

    def get_popular_movies(self, limit: int = 10) -> List[dict]:
        """Get popular movies"""
        url = f"{BASE_URL}/movie/popular"
        params = {"language": "en-US", "page": 1}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("results", [])[:limit]:
                item["media_type"] = "movie"
                results.append(self.process_item(item))
            return results
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return []

    def get_popular_tv(self, limit: int = 10) -> List[dict]:
        """Get popular TV shows"""
        url = f"{BASE_URL}/tv/popular"
        params = {"language": "en-US", "page": 1}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("results", [])[:limit]:
                item["media_type"] = "tv"
                results.append(self.process_item(item))
            return results
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return []

    def get_trending(self, limit: int = 10) -> List[dict]:
        """Get trending movies and shows"""
        url = f"{BASE_URL}/trending/all/week"
        params = {"language": "en-US"}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("results", [])[:limit]:
                if item.get("media_type") in ["movie", "tv"]:
                    results.append(self.process_item(item))
            return results
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return []


def main():
    parser = argparse.ArgumentParser(description="TMDB CLI for AGS")
    parser.add_argument("--search", help="Search query")
    parser.add_argument("--popular-movies", action="store_true", help="Get popular movies")
    parser.add_argument("--popular-tv", action="store_true", help="Get popular TV shows")
    parser.add_argument("--trending", action="store_true", help="Get trending content")
    parser.add_argument("--limit", type=int, default=10, help="Limit results")
    
    args = parser.parse_args()
    
    # Try to load API key from config file
    api_key = API_KEY
    try:
        config_path = os.path.expanduser("~/.config/ags/assets/tmdb_api_key.txt")
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                api_key = f.read().strip()
    except:
        pass
    
    if api_key == "YOUR_TMDB_API_KEY":
        print(json.dumps({"error": "Please set your TMDB API key in ~/.config/ags/assets/tmdb_api_key.txt"}))
        sys.exit(1)
    
    provider = TMDBProvider(api_key)
    
    if args.search:
        results = provider.search(args.search, args.limit)
    elif args.popular_movies:
        results = provider.get_popular_movies(args.limit)
    elif args.popular_tv:
        results = provider.get_popular_tv(args.limit)
    elif args.trending:
        results = provider.get_trending(args.limit)
    else:
        results = provider.get_trending(args.limit)
    
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
