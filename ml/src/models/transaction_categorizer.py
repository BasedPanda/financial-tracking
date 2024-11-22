import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from transformers import DistilBertTokenizer, DistilBertModel
import torch
import torch.nn as nn

class TransactionCategorizer(BaseEstimator, ClassifierMixin):
    def __init__(self, num_categories, max_length=128):
        self.tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
        self.bert = DistilBertModel.from_pretrained('distilbert-base-uncased')
        self.max_length = max_length
        self.classifier = nn.Linear(768, num_categories)
        
    def forward(self, text):
        inputs = self.tokenizer(text, padding=True, truncation=True, 
                              max_length=self.max_length, return_tensors="pt")
        outputs = self.bert(**inputs)
        pooled_output = outputs[0][:, 0]
        return self.classifier(pooled_output)

    def predict(self, texts):
        self.eval()
        with torch.no_grad():
            predictions = []
            for text in texts:
                outputs = self.forward(text)
                _, predicted = torch.max(outputs, 1)
                predictions.append(predicted.item())
            return np.array(predictions)