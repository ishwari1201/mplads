import os

class Settings:
    PROJECT_NAME: str = "MPLADS ML Engine"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SIMILARITY_THRESHOLD: float = 0.85
    HAMMING_DISTANCE_THRESHOLD: int = 5

settings = Settings()
