import pandas as pd
import numpy as np
from datetime import datetime

class FeatureEngineer:
    def __init__(self):
        self.numerical_features = ['amount']
        self.categorical_features = ['category', 'description']
        self.temporal_features = ['timestamp']
        
    def transform(self, df):
        features = pd.DataFrame()
        
        # Process numerical features
        features = self._process_numerical(df, features)
        
        # Process categorical features
        features = self._process_categorical(df, features)
        
        # Process temporal features
        features = self._process_temporal(df, features)
        
        return features
    
    def _process_numerical(self, df, features):
        for col in self.numerical_features:
            features[col] = df[col]
            features[f'{col}_log'] = np.log1p(df[col])
            features[f'{col}_scaled'] = (df[col] - df[col].mean()) / df[col].std()
        return features
    
    def _process_categorical(self, df, features):
        for col in self.categorical_features:
            dummies = pd.get_dummies(df[col], prefix=col)
            features = pd.concat([features, dummies], axis=1)
        return features
    
    def _process_temporal(self, df, features):
        for col in self.temporal_features:
            dt = pd.to_datetime(df[col])
            features[f'{col}_hour'] = dt.dt.hour
            features[f'{col}_day'] = dt.dt.day
            features[f'{col}_month'] = dt.dt.month
            features[f'{col}_year'] = dt.dt.year
            features[f'{col}_dayofweek'] = dt.dt.dayofweek
            features[f'{col}_quarter'] = dt.dt.quarter
            features[f'{col}_is_weekend'] = dt.dt.dayofweek.isin([5, 6]).astype(int)
        return features