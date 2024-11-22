import os
import pandas as pd
import numpy as np
import tensorflow as tf
import mlflow
import mlflow.tensorflow
import logging
from ..models import ExpenseForecaster
from ..preprocessing import PreprocessingPipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_sequences(data: np.ndarray, seq_length: int):
    """Create sequences for time series prediction."""
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:(i + seq_length)])
        ys.append(data[i + seq_length])
    return np.array(xs), np.array(ys)

def train_forecasting_model(
    data_path: str,
    model_save_path: str,
    params: dict = None
) -> ExpenseForecaster:
    """
    Train an expense forecasting model.
    
    Args:
        data_path: Path to training data
        model_save_path: Path to save trained model
        params: Training parameters
    
    Returns:
        Trained ExpenseForecaster model
    """
    if params is None:
        params = {
            'sequence_length': 30,
            'train_size': 0.8,
            'batch_size': 32,
            'epochs': 100,
            'learning_rate': 0.001,
            'lstm_units': 64,
            'dropout_rate': 0.2
        }

    try:
        with mlflow.start_run():
            mlflow.log_params(params)
            
            # Load and preprocess data
            logger.info("Loading and preprocessing data...")
            df = pd.read_csv(data_path)
            
            # Prepare time series data
            df['date'] = pd.to_datetime(df['date'])
            daily_expenses = df.groupby('date')['amount'].sum().resample('D').sum().fillna(0)
            
            # Create sequences
            X, y = create_sequences(daily_expenses.values, params['sequence_length'])
            
            # Split data
            train_size = int(len(X) * params['train_size'])
            X_train, X_test = X[:train_size], X[train_size:]
            y_train, y_test = y[:train_size], y[train_size:]
            
            # Initialize model
            logger.info("Initializing model...")
            model = ExpenseForecaster(
                sequence_length=params['sequence_length'],
                lstm_units=params['lstm_units'],
                dropout_rate=params['dropout_rate']
            )
            
            # Compile model
            optimizer = tf.keras.optimizers.Adam(learning_rate=params['learning_rate'])
            model.compile(optimizer=optimizer, loss='mse', metrics=['mae'])
            
            # Create callbacks
            callbacks = [
                tf.keras.callbacks.EarlyStopping(
                    monitor='val_loss',
                    patience=10,
                    restore_best_weights=True
                ),
                tf.keras.callbacks.ReduceLROnPlateau(
                    monitor='val_loss',
                    factor=0.5,
                    patience=5
                )
            ]
            
            # Train model
            logger.info("Training model...")
            history = model.fit(
                X_train, y_train,
                validation_data=(X_test, y_test),
                epochs=params['epochs'],
                batch_size=params['batch_size'],
                callbacks=callbacks,
                verbose=1
            )
            
            # Evaluate model
            logger.info("Evaluating model...")
            evaluation = model.evaluate(X_test, y_test, verbose=0)
            metrics = {
                'test_loss': evaluation[0],
                'test_mae': evaluation[1]
            }
            
            # Log metrics
            mlflow.log_metrics(metrics)
            
            # Save training history
            history_df = pd.DataFrame(history.history)
            history_df.to_csv(f"{model_save_path}_history.csv")
            
            # Save model
            os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
            model.save(model_save_path)
            
            # Log model with MLflow
            mlflow.tensorflow.log_model(model, "forecaster")
            
            logger.info("Model training completed successfully")
            return model
            
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        raise