# src/models/__init__.py
import os
import requests
import torch
from pathlib import Path
from tqdm import tqdm
import logging
from .transaction_categorizer import TransactionCategorizer
from .anomaly_detector import AnomalyDetector
from .expense_forecaster import ExpenseForecaster
from .pattern_analyzer import PatternAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define model URLs and file paths
MODEL_URLS = {
    'transaction_categorizer': 'https://fintrack-models.s3.amazonaws.com/models/transaction_categorizer.pt',
    'anomaly_detector': 'https://fintrack-models.s3.amazonaws.com/models/anomaly_detector.joblib',
    'expense_forecaster': 'https://fintrack-models.s3.amazonaws.com/models/expense_forecaster.h5',
    'pattern_analyzer': 'https://fintrack-models.s3.amazonaws.com/models/pattern_analyzer.joblib'
}

MODEL_PATHS = {
    'transaction_categorizer': 'models/transaction_categorizer.pt',
    'anomaly_detector': 'models/anomaly_detector.joblib',
    'expense_forecaster': 'models/expense_forecaster.h5',
    'pattern_analyzer': 'models/pattern_analyzer.joblib'
}

def download_file(url: str, destination: str, chunk_size: int = 8192) -> None:
    """
    Download a file from a URL to a destination with progress bar.
    
    Args:
        url (str): URL to download from
        destination (str): Local path to save the file
        chunk_size (int): Size of chunks to download
    """
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Get file size for progress bar
        total_size = int(response.headers.get('content-length', 0))
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(destination), exist_ok=True)
        
        # Download with progress bar
        with open(destination, 'wb') as f, tqdm(
            desc=os.path.basename(destination),
            total=total_size,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
        ) as pbar:
            for chunk in response.iter_content(chunk_size=chunk_size):
                size = f.write(chunk)
                pbar.update(size)
                
        logger.info(f"Successfully downloaded {destination}")
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error downloading {url}: {str(e)}")
        raise

def verify_model_file(file_path: str, min_size_bytes: int = 1000) -> bool:
    """
    Verify if a model file exists and has a minimum size.
    
    Args:
        file_path (str): Path to the model file
        min_size_bytes (int): Minimum expected file size
        
    Returns:
        bool: True if file exists and is valid
    """
    path = Path(file_path)
    if not path.exists():
        return False
    if path.stat().st_size < min_size_bytes:
        logger.warning(f"Model file {file_path} is smaller than expected")
        return False
    return True

def load_models():
    """
    Load all models into memory.
    
    Returns:
        dict: Dictionary containing loaded models
    """
    models = {}
    try:
        # Load transaction categorizer
        if verify_model_file(MODEL_PATHS['transaction_categorizer']):
            models['transaction_categorizer'] = TransactionCategorizer.load(
                MODEL_PATHS['transaction_categorizer']
            )
        
        # Load anomaly detector
        if verify_model_file(MODEL_PATHS['anomaly_detector']):
            models['anomaly_detector'] = AnomalyDetector.load(
                MODEL_PATHS['anomaly_detector']
            )
        
        # Load expense forecaster
        if verify_model_file(MODEL_PATHS['expense_forecaster']):
            models['expense_forecaster'] = ExpenseForecaster.load(
                MODEL_PATHS['expense_forecaster']
            )
        
        # Load pattern analyzer
        if verify_model_file(MODEL_PATHS['pattern_analyzer']):
            models['pattern_analyzer'] = PatternAnalyzer.load(
                MODEL_PATHS['pattern_analyzer']
            )
        
        return models
    
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        raise

def download_models(force: bool = False) -> None:
    """
    Download pre-trained models if they don't exist.
    
    Args:
        force (bool): Force download even if files exist
    """
    try:
        logger.info("Checking for pre-trained models...")
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        
        # Download each model if needed
        for model_name, url in MODEL_URLS.items():
            file_path = MODEL_PATHS[model_name]
            
            if force or not verify_model_file(file_path):
                logger.info(f"Downloading {model_name} model...")
                download_file(url, file_path)
            else:
                logger.info(f"{model_name} model already exists")
        
        logger.info("All models downloaded successfully")
        
    except Exception as e:
        logger.error(f"Error downloading models: {str(e)}")
        raise

def cleanup_models() -> None:
    """
    Clean up downloaded model files.
    """
    try:
        for file_path in MODEL_PATHS.values():
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Removed {file_path}")
        
        # Remove models directory if empty
        if os.path.exists('models') and not os.listdir('models'):
            os.rmdir('models')
            logger.info("Removed empty models directory")
            
    except Exception as e:
        logger.error(f"Error cleaning up models: {str(e)}")
        raise

# Initialize models on import
__models = None

def get_models():
    """
    Get initialized models or load them if not initialized.
    
    Returns:
        dict: Dictionary containing loaded models
    """
    global __models
    if __models is None:
        # Download models if they don't exist
        download_models()
        # Load models
        __models = load_models()
    return __models

# Export classes and functions
__all__ = [
    'TransactionCategorizer',
    'AnomalyDetector',
    'ExpenseForecaster',
    'PatternAnalyzer',
    'download_models',
    'load_models',
    'cleanup_models',
    'get_models'
]