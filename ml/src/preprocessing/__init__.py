# src/preprocessing/__init__.py
import logging
from typing import Union, Dict, List
import pandas as pd
import numpy as np
from .text_processor import TextProcessor
from .feature_engineer import FeatureEngineer
from .data_cleaner import DataCleaner

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PreprocessingPipeline:
    """
    A unified preprocessing pipeline that combines text processing,
    feature engineering, and data cleaning.
    """
    
    def __init__(self):
        self.text_processor = TextProcessor()
        self.feature_engineer = FeatureEngineer()
        self.data_cleaner = DataCleaner()
        self.is_fitted = False
        self.feature_stats = {}
        
    def fit(self, data: Union[pd.DataFrame, Dict, List]) -> 'PreprocessingPipeline':
        """
        Fit the preprocessing pipeline on training data.
        
        Args:
            data: Input data as DataFrame, dict, or list
            
        Returns:
            self: The fitted pipeline
        """
        try:
            # Convert input to DataFrame if necessary
            df = self._validate_and_convert_input(data)
            
            logger.info("Starting preprocessing pipeline fitting...")
            
            # Clean data
            logger.info("Fitting data cleaner...")
            df = self.data_cleaner.clean(df)
            
            # Process text features
            logger.info("Processing text features...")
            if 'description' in df.columns:
                df['processed_description'] = df['description'].apply(
                    self.text_processor.preprocess
                )
            
            # Engineer features and store feature statistics
            logger.info("Engineering features...")
            features_df = self.feature_engineer.transform(df)
            self.feature_stats = {
                'numerical': {
                    col: {
                        'mean': features_df[col].mean(),
                        'std': features_df[col].std(),
                        'min': features_df[col].min(),
                        'max': features_df[col].max()
                    }
                    for col in self.feature_engineer.numerical_features
                },
                'categorical': {
                    col: features_df[col].value_counts().to_dict()
                    for col in self.feature_engineer.categorical_features
                }
            }
            
            self.is_fitted = True
            logger.info("Pipeline fitting completed successfully")
            return self
            
        except Exception as e:
            logger.error(f"Error during pipeline fitting: {str(e)}")
            raise
            
    def transform(self, data: Union[pd.DataFrame, Dict, List]) -> pd.DataFrame:
        """
        Transform data using the fitted preprocessing pipeline.
        
        Args:
            data: Input data as DataFrame, dict, or list
            
        Returns:
            pd.DataFrame: Transformed features
        """
        if not self.is_fitted:
            raise ValueError("Pipeline must be fitted before transforming data")
            
        try:
            # Convert input to DataFrame if necessary
            df = self._validate_and_convert_input(data)
            
            logger.info("Starting data transformation...")
            
            # Clean data
            df = self.data_cleaner.clean(df)
            
            # Process text features
            if 'description' in df.columns:
                df['processed_description'] = df['description'].apply(
                    self.text_processor.preprocess
                )
            
            # Engineer features
            features_df = self.feature_engineer.transform(df)
            
            logger.info("Data transformation completed successfully")
            return features_df
            
        except Exception as e:
            logger.error(f"Error during data transformation: {str(e)}")
            raise
            
    def fit_transform(self, data: Union[pd.DataFrame, Dict, List]) -> pd.DataFrame:
        """
        Fit the pipeline and transform the data in one step.
        
        Args:
            data: Input data as DataFrame, dict, or list
            
        Returns:
            pd.DataFrame: Transformed features
        """
        return self.fit(data).transform(data)
    
    def _validate_and_convert_input(self, data: Union[pd.DataFrame, Dict, List]) -> pd.DataFrame:
        """
        Validate and convert input data to DataFrame.
        
        Args:
            data: Input data as DataFrame, dict, or list
            
        Returns:
            pd.DataFrame: Validated DataFrame
        """
        if isinstance(data, pd.DataFrame):
            df = data.copy()
        elif isinstance(data, dict):
            df = pd.DataFrame([data])
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            raise ValueError(
                "Input must be a pandas DataFrame, dictionary, or list"
            )
            
        return df
    
    def get_feature_stats(self) -> Dict:
        """
        Get statistics of engineered features.
        
        Returns:
            Dict: Feature statistics
        """
        if not self.is_fitted:
            raise ValueError("Pipeline must be fitted to get feature statistics")
        return self.feature_stats
    
    def save_feature_stats(self, filepath: str) -> None:
        """
        Save feature statistics to a file.
        
        Args:
            filepath: Path to save the statistics
        """
        if not self.is_fitted:
            raise ValueError("Pipeline must be fitted to save feature statistics")
            
        try:
            pd.DataFrame(self.feature_stats).to_pickle(filepath)
            logger.info(f"Feature statistics saved to {filepath}")
        except Exception as e:
            logger.error(f"Error saving feature statistics: {str(e)}")
            raise
    
    def load_feature_stats(self, filepath: str) -> None:
        """
        Load feature statistics from a file.
        
        Args:
            filepath: Path to load the statistics from
        """
        try:
            self.feature_stats = pd.read_pickle(filepath)
            self.is_fitted = True
            logger.info(f"Feature statistics loaded from {filepath}")
        except Exception as e:
            logger.error(f"Error loading feature statistics: {str(e)}")
            raise

# Export classes
__all__ = [
    'TextProcessor',
    'FeatureEngineer',
    'DataCleaner',
    'PreprocessingPipeline'
]

# Create default pipeline instance
default_pipeline = PreprocessingPipeline()