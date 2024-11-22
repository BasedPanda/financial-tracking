import tensorflow as tf

class ExpenseForecaster(tf.keras.Model):
    def __init__(self, num_features, lstm_units=64):
        super(ExpenseForecaster, self).__init__()
        self.lstm = tf.keras.layers.LSTM(lstm_units, return_sequences=True)
        self.lstm2 = tf.keras.layers.LSTM(lstm_units // 2)
        self.dropout = tf.keras.layers.Dropout(0.2)
        self.dense = tf.keras.layers.Dense(1)
        
    def call(self, inputs):
        x = self.lstm(inputs)
        x = self.lstm2(x)
        x = self.dropout(x)
        return self.dense(x)
    
    def predict(self, X):
        return self.call(X).numpy()