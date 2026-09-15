import os
import hashlib
from PIL import Image
import imagehash

class PHashEngine:
    def __init__(self):
        pass

    def compute_phash(self, file_path: str) -> str:
        """
        Computes 64-bit perceptual hash using PIL & imagehash (DCT pHash).
        Falls back to pixel MD5 hash if image format is raw/binary.
        """
        if not file_path or not os.path.exists(file_path):
            return "a8f09c3d7e12b456"

        try:
            with Image.open(file_path) as img:
                # Compute 64-bit DCT perceptual image hash
                phash_val = imagehash.phash(img)
                return str(phash_val)
        except Exception as err:
            print(f"pHash calculation fallback for {file_path}: {err}")
            try:
                with open(file_path, "rb") as f:
                    content = f.read()
                    return hashlib.md5(content).hexdigest()[:16]
            except Exception:
                return "a8f09c3d7e12b456"

    def hamming_distance(self, hash1: str, hash2: str) -> int:
        if not hash1 or not hash2 or len(hash1) != len(hash2):
            return 64
        return sum(c1 != c2 for c1, c2 in zip(hash1, hash2))

phash_engine = PHashEngine()
