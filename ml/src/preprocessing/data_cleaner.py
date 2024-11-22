import pandas as pd
import numpy as np

class DataCleaner:
    def __init__(self):
        self.required_columns = ['amount', 'description', 'category', 'timestamp']
        
    def clean(self, df):
        # Check required columns
        self._validate_columns(df)
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Handle missing values
        df = self._handle_missing_values(df)
        
        # Clean amounts
        df['amount'] = self._clean_amounts(df['amount'])
        
        # Clean descriptions
        df['description'] = df['description'].apply(self._clean_description)
        
        # Validate timestamps
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    
    def _validate_columns(self, df):
        missing_cols = set(self.required_columns) - set(df.columns)
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")
    
    def _handle_missing_values(self, df):
        # Fill missing numerical values with median
        df['amount'] = df['amount'].fillna(df['amount'].median())
        
        # Fill missing descriptions with 'Unknown'
        df['description'] = df['description'].fillna('Unknown')
        
        # Drop rows with missing categories
        df = df.dropna(subset=['category'])
        
        return df
    
    def _clean_amounts(self, amounts):
        # Convert to float and handle currency symbols
        amounts = amounts.replace('[\$,]', '', regex=True).astype(float)
        
        # Handle negative values
        amounts = amounts.abs()
        
        # Remove outliers
        q1 = amounts.quantile(0.25)
        q3 = amounts.quantile(0.75)
        iqr = q3 - q1
        amounts = amounts[(amounts >= q1 - 1.5*iqr) & 
                        (amounts <= q3 + 1.5*iqr)]
        
        return amounts
    
    def _clean_description(self, desc):
        if not isinstance(desc, str):
            return 'Unknown'
        
        # Remove special characters and extra whitespace
        desc = ' '.join(desc.split())
        
        # Truncate long descriptions
        max_length = 100
        if len(desc) > max_length:
            desc = desc[:max_length] + '...'
            
        return desc