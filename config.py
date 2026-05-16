import os

class Config:
    # OpenRouter API Configuration
    OPENROUTER_API_KEY = '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'
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

    JSON_AS_ASCII = False

    # CONFIRMED WORKING FREE MODELS (May 2026)
    MODELS = {
       'study-mate': 'openai/gpt-oss-120b:free',
        'college-mate': 'openai/gpt-oss-120b:free',
        'core-leveling': 'openai/gpt-oss-120b:free',
        'writer-guru': 'openai/gpt-oss-120b:free',
        'code-explainer': 'openai/gpt-oss-120b:free',
        'code-converter': 'openai/gpt-oss-120b:free',
        'dr-jjc': 'openai/gpt-oss-120b:free',
        'dream-interpreter': 'openai/gpt-oss-120b:free',
        'default': 'openai/gpt-oss-120b:free'
    }

    # Vision Model for Image Analysis
    VISION_MODEL = 'google/gemma-4-31b-it:free'

    # Upload Configuration
    UPLOAD_FOLDER = 'static/uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # Session Configuration
    SECRET_KEY = 'helpinghub-secret-key-2025'

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)