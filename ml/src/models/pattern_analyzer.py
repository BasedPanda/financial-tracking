from sklearn.cluster import DBSCAN
import numpy as np
import pandas as pd

class PatternAnalyzer:
    def __init__(self, eps=0.5, min_samples=5):
        self.model = DBSCAN(eps=eps, min_samples=min_samples)
        
    def find_patterns(self, transactions_df):
        # Extract features
        features = self._extract_features(transactions_df)
        
        # Perform clustering
        clusters = self.model.fit_predict(features)
        
        # Analyze patterns
        patterns = self._analyze_clusters(transactions_df, clusters)
        return patterns
    
    def _extract_features(self, df):
        # Feature engineering
        features = []
        for _, group in df.groupby('category'):
            amounts = group['amount'].values
            timestamps = pd.to_datetime(group['timestamp']).values
            
            # Calculate statistical features
            features.append([
                amounts.mean(),
                amounts.std(),
                np.median(amounts),
                len(amounts),
                np.diff(timestamps).mean()
            ])
        return np.array(features)
    
    def _analyze_clusters(self, df, clusters):
        patterns = []
        for cluster_id in np.unique(clusters):
            if cluster_id == -1:  # Noise points
                continue
                
            cluster_data = df[clusters == cluster_id]
            pattern = {
                'cluster_id': cluster_id,
                'size': len(cluster_data),
                'avg_amount': cluster_data['amount'].mean(),
                'common_categories': cluster_data['category'].value_counts().to_dict(),
                'frequency': self._calculate_frequency(cluster_data)
            }
            patterns.append(pattern)
        return patterns
    
    def _calculate_frequency(self, cluster_data):
        timestamps = pd.to_datetime(cluster_data['timestamp'])
        diff = timestamps.diff().dropna()
        return diff.mean()