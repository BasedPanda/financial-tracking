from sklearn.ensemble import IsolationForest
import joblib

class AnomalyDetector:
    def __init__(self, contamination=0.1):
        self.model = IsolationForest(contamination=contamination, random_state=42)
        
    def fit(self, X):
        self.model.fit(X)
        return self
        
    def predict(self, X):
        return self.model.predict(X)
    
    def save(self, path):
        joblib.dump(self.model, path)
    
    @classmethod
    def load(cls, path):
        detector = cls()
        detector.model = joblib.load(path)
        return detector