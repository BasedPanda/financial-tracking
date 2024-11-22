import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import mlflow
import mlflow.sklearn
import logging
from ..models import AnomalyDetector
from ..preprocessing import PreprocessingPipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_anomaly_model(
    data_path: str,
    model_save_path: str,
    params: dict = None
) -> AnomalyDetector:
    """
    Train an anomaly detection model for transaction monitoring.
    
    Args:
        data_path: Path to training data
        model_save_path: Path to save trained model
        params: Training parameters
    
    Returns:
        Trained AnomalyDetector model
    """
    if params is None:
        params = {
            'contamination': 0.1,
            'random_state': 42,
            'train_size': 0.8,
            'n_estimators': 100,
            'max_samples': 'auto'
        }

    try:
        with mlflow.start_run():
            mlflow.log_params(params)
            
            # Load and preprocess data
            logger.info("Loading and preprocessing data...")
            df = pd.read_csv(data_path)
            pipeline = PreprocessingPipeline()
            features = pipeline.fit_transform(df)
            
            # Split data
            X_train, X_test = train_test_split(
                features,
                train_size=params['train_size'],
                random_state=params['random_state']
            )
            
            # Initialize and train model
            logger.info("Training anomaly detection model...")
            detector = AnomalyDetector(
                contamination=params['contamination'],
                n_estimators=params['n_estimators'],
                max_samples=params['max_samples']
            )
            
            detector.fit(X_train)
            
            # Evaluate model
            logger.info("Evaluating model...")
            train_scores = detector.score_samples(X_train)
            test_scores = detector.score_samples(X_test)
            
            # Calculate metrics
            train_anomalies = (train_scores < np.percentile(train_scores, 
                                                          params['contamination'] * 100))
            test_anomalies = (test_scores < np.percentile(test_scores, 
                                                        params['contamination'] * 100))
            
            metrics = {
                'train_anomaly_ratio': train_anomalies.mean(),
                'test_anomaly_ratio': test_anomalies.mean(),
                'train_score_mean': train_scores.mean(),
                'test_score_mean': test_scores.mean()
            }
            
            # Log metrics
            mlflow.log_metrics(metrics)
            
            # Save model and preprocessing pipeline
            os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
            detector.save(model_save_path)
            pipeline.save_feature_stats(f"{model_save_path}_pipeline.pkl")
            
            # Log model with MLflow
            mlflow.sklearn.log_model(detector, "anomaly_detector")
            
            logger.info("Model training completed successfully")
            return detector
            
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        raise