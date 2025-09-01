import json
import hashlib
from pathlib import Path
from typing import Optional, Any
from datetime import datetime, timedelta
from ..config import settings

class SimpleFileCache:
    """Simple file-based cache for protein data"""
    
    def __init__(self, cache_dir: str = ".cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.ttl = settings.CACHE_TTL
    
    def _get_cache_key(self, key: str) -> str:
        """Generate a safe filename from cache key"""
        return hashlib.md5(key.encode()).hexdigest()
    
    def _get_cache_path(self, key: str) -> Path:
        """Get the full path for a cache file"""
        cache_key = self._get_cache_key(key)
        return self.cache_dir / f"{cache_key}.json"
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached data if it exists and hasn't expired"""
        if not settings.CACHE_ENABLED:
            return None
            
        try:
            cache_path = self._get_cache_path(key)
            
            if not cache_path.exists():
                return None
            
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
            
            # Check if cache has expired
            cached_time = datetime.fromisoformat(cache_data['timestamp'])
            if datetime.now() - cached_time > timedelta(seconds=self.ttl):
                # Cache expired, remove it
                cache_path.unlink(missing_ok=True)
                return None
            
            return cache_data['data']
            
        except (json.JSONDecodeError, KeyError, ValueError, OSError):
            # If there's any error reading cache, just return None
            return None
    
    def set(self, key: str, data: Any) -> bool:
        """Cache data with current timestamp"""
        if not settings.CACHE_ENABLED:
            return False
            
        try:
            cache_path = self._get_cache_path(key)
            
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'key': key,
                'data': data
            }
            
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f, indent=2, default=str)
            
            return True
            
        except (OSError, TypeError):
            return False
    
    def clear(self) -> int:
        """Clear all cached files, return count of files removed"""
        if not self.cache_dir.exists():
            return 0
            
        count = 0
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cache_file.unlink()
                count += 1
            except OSError:
                pass
        
        return count
    
    def cleanup_expired(self) -> int:
        """Remove expired cache files, return count of files removed"""
        if not self.cache_dir.exists():
            return 0
            
        count = 0
        current_time = datetime.now()
        
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                with open(cache_file, 'r') as f:
                    cache_data = json.load(f)
                
                cached_time = datetime.fromisoformat(cache_data['timestamp'])
                if current_time - cached_time > timedelta(seconds=self.ttl):
                    cache_file.unlink()
                    count += 1
                    
            except (json.JSONDecodeError, KeyError, ValueError, OSError):
                # If we can't read it, delete it
                try:
                    cache_file.unlink()
                    count += 1
                except OSError:
                    pass
        
        return count

# Global cache instance
cache = SimpleFileCache()
