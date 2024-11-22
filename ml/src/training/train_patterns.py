import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import mlflow
import mlflow.sklearn
import logging
from ..models import PatternAnalyzer
from ..preprocessing import PreprocessingPipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_pattern_model(
    data_path: str,
    model_save_path: str,
    params: dict = None
) -> PatternAnalyzer:
    """
    Train a pattern analysis model for transaction patterns.
    
    Args:
        data_path: Path to training data
        model_save_path: Path to save trained model
        params: Training parameters
    
    Returns:
        Trained PatternAnalyzer model
    """
    if params is None:
        params = {
            'eps': 0.5,
            'min_samples': 5,
            'algorithm': 'auto',
            'leaf_size': 30,
            'n_jobs': -1
        }

    try:
        with mlflow.start_run():
            mlflow.log_params(params)
            
            # Load and preprocess data
            logger.info("Loading and preprocessing data...")
            df = pd.read_csv(data_path)
            pipeline = PreprocessingPipeline()
            features = pipeline.fit_transform(df)
            
            # Scale features
            scaler = StandardScaler()
            scaled_features = scaler.fit_transform(features)
            
            # Initialize and train model
            logger.info("Training pattern analyzer...")
            analyzer = PatternAnalyzer(
                eps=params['eps'],
                min_samples=params['min_samples'],
                algorithm=params['algorithm'],
                leaf_size=params['leaf_size'],
                n_jobs=params['n_jobs']
            )
            
            # Find patterns
            patterns = analyzer.find_patterns(scaled_features)
            
            # Calculate metrics
            metrics = {
                'n_patterns': len(patterns),
                'avg_pattern_size': np.mean([p['size'] for p in patterns]),
                'max_pattern_size': np.max([p['size'] for p in patterns]),
                'pattern_coverage': sum(p['size'] for p in patterns) / len(features)
            }
            
            # Log metrics
            mlflow.log_metrics(metrics)
            
            # Save pattern analysis
            pattern_df = pd.DataFrame(patterns)
            pattern_df.to_csv(f"{model_save_path}_patterns.csv")
            
            # Save model and preprocessing components
            os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
            analyzer.save(model_save_path)
            pipeline.save_feature_stats(f"{model_save_path}_pipeline.pkl")
            
            # Save scaler
            joblib.dump(scaler, f"{model_save_path}_scaler.pkl")
            
            # Log model with MLflow
            mlflow.sklearn.log_model(analyzer, "pattern_analyzer")
            
            logger.info("Model training completed successfully")
            return analyzer
            
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        raise