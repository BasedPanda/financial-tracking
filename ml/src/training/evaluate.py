import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def evaluate_models(models: Dict[str, Any], test_data: pd.DataFrame) -> Dict[str, Dict]:
    """
    Evaluate all trained models on test data.
    
    Args:
        models: Dictionary of trained models
        test_data: Test dataset
        
    Returns:
        Dictionary containing evaluation metrics for each model
    """
    try:
        results = {}
        
        # Evaluate transaction categorizer
        if 'transaction_categorizer' in models:
            results['categorizer'] = evaluate_categorizer(
                models['transaction_categorizer'],
                test_data
            )
        
        # Evaluate anomaly detector
        if 'anomaly_detector' in models:
            results['anomaly_detector'] = evaluate_anomaly_detector(
                models['anomaly_detector'],
                test_data
            )
        
        # Evaluate expense forecaster
        if 'expense_forecaster' in models:
            results['forecaster'] = evaluate_forecaster(
                models['expense_forecaster'],
                test_data
            )
        
        # Evaluate pattern analyzer
        if 'pattern_analyzer' in models:
            results['pattern_analyzer'] = evaluate_pattern_analyzer(
                models['pattern_analyzer'],
                test_data
            )
        
        return results
        
    except Exception as e:
        logger.error(f"Error during model evaluation: {str(e)}")
        raise

def evaluate_categorizer(model, test_data: pd.DataFrame) -> Dict:
    """Evaluate transaction categorization model."""
    try:
        y_true = test_data['category']
        y_pred = model.predict(test_data['description'])
        
        report = classification_report(y_true, y_pred, output_dict=True)
        conf_matrix = confusion_matrix(y_true, y_pred)
        
        # Plot confusion matrix
        plt.figure(figsize=(10, 8))
        sns.heatmap(conf_matrix, annot=True, fmt='d')
        plt.title('Transaction Categorizer Confusion Matrix')
        plt.ylabel('True Category')
        plt.xlabel('Predicted Category')
        plt.savefig('categorizer_confusion_matrix.png')
        plt.close()
        
        return {
            'classification_report': report,
            'confusion_matrix': conf_matrix.tolist()
        }
        
    except Exception as e:
        logger.error(f"Error evaluating categorizer: {str(e)}")
        raise

def evaluate_anomaly_detector(model, test_data: pd.DataFrame) -> Dict:
    """Evaluate anomaly detection model."""
    try:
        scores = model.score_samples(test_data)
        predictions = model.predict(test_data)
        
        # Calculate metrics
        anomaly_ratio = (predictions == -1).mean()
        score_distribution = {
            'mean': scores.mean(),
            'std': scores.std(),
            'min': scores.min(),
            'max': scores.max()
        }
        
        # Plot score distribution
        plt.figure(figsize=(10, 6))
        sns.histplot(scores, bins=50)
        plt.title('Anomaly Score Distribution')
        plt.xlabel('Anomaly Score')
        plt.ylabel('Count')
        plt.savefig('anomaly_score_distribution.png')
        plt.close()
        
        return {
            'anomaly_ratio': anomaly_ratio,
            'score_distribution': score_distribution
        }
        
    except Exception as e:
        logger.error(f"Error evaluating anomaly detector: {str(e)}")
        raise

def evaluate_forecaster(model, test_data: pd.DataFrame) -> Dict:
    """Evaluate expense forecasting model."""
    try:
        # Prepare sequences
        X_test, y_test = create_sequences(
            test_data['amount'].values,
            model.sequence_length
        )
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        mse = np.mean((y_test - y_pred) ** 2)
        mae = np.mean(np.abs(y_test - y_pred))
        rmse = np.sqrt(mse)
        
        # Calculate relative errors
        mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
        
        # Plot predictions vs actual
        plt.figure(figsize=(12, 6))
        plt.plot(y_test, label='Actual')
        plt.plot(y_pred, label='Predicted')
        plt.title('Expense Forecasting: Predicted vs Actual')
        plt.xlabel('Time')
        plt.ylabel('Amount')
        plt.legend()
        plt.savefig('forecaster_predictions.png')
        plt.close()
        
        return {
            'mse': mse,
            'mae': mae,
            'rmse': rmse,
            'mape': mape
        }
        
    except Exception as e:
        logger.error(f"Error evaluating forecaster: {str(e)}")
        raise

def evaluate_pattern_analyzer(model, test_data: pd.DataFrame) -> Dict:
    """Evaluate pattern analysis model."""
    try:
        # Find patterns
        patterns = model.find_patterns(test_data)
        
        # Calculate pattern metrics
        pattern_sizes = [p['size'] for p in patterns]
        pattern_frequencies = [p['frequency'].total_seconds() for p in patterns]
        
        pattern_stats = {
            'num_patterns': len(patterns),
            'avg_pattern_size': np.mean(pattern_sizes),
            'median_pattern_size': np.median(pattern_sizes),
            'avg_frequency_days': np.mean(pattern_frequencies) / (24 * 3600),
            'coverage_ratio': sum(pattern_sizes) / len(test_data)
        }
        
        # Plot pattern size distribution
        plt.figure(figsize=(10, 6))
        sns.histplot(pattern_sizes, bins=30)
        plt.title('Pattern Size Distribution')
        plt.xlabel('Pattern Size')
        plt.ylabel('Count')
        plt.savefig('pattern_size_distribution.png')
        plt.close()
        
        # Plot pattern frequency distribution
        plt.figure(figsize=(10, 6))
        sns.histplot([f / (24 * 3600) for f in pattern_frequencies], bins=30)
        plt.title('Pattern Frequency Distribution')
        plt.xlabel('Frequency (days)')
        plt.ylabel('Count')
        plt.savefig('pattern_frequency_distribution.png')
        plt.close()
        
        return {
            'pattern_stats': pattern_stats,
            'patterns': patterns
        }
        
    except Exception as e:
        logger.error(f"Error evaluating pattern analyzer: {str(e)}")
        raise

def generate_evaluation_report(results: Dict[str, Dict], output_path: str) -> None:
    """
    Generate a comprehensive evaluation report.
    
    Args:
        results: Dictionary containing evaluation results
        output_path: Path to save the report
    """
    try:
        report = []
        
        # Add header
        report.append("# Model Evaluation Report")
        report.append(f"\nGenerated on: {pd.Timestamp.now()}\n")
        
        # Transaction Categorizer Results
        if 'categorizer' in results:
            report.append("\n## Transaction Categorizer")
            report.append("\n### Classification Report")
            report.append("```")
            report.append(pd.DataFrame(results['categorizer']['classification_report']).to_string())
            report.append("```")
        
        # Anomaly Detector Results
        if 'anomaly_detector' in results:
            report.append("\n## Anomaly Detector")
            report.append(f"\nAnomaly Ratio: {results['anomaly_detector']['anomaly_ratio']:.2%}")
            report.append("\nScore Distribution:")
            for metric, value in results['anomaly_detector']['score_distribution'].items():
                report.append(f"- {metric}: {value:.4f}")
        
        # Forecaster Results
        if 'forecaster' in results:
            report.append("\n## Expense Forecaster")
            report.append("\nPerformance Metrics:")
            for metric, value in results['forecaster'].items():
                report.append(f"- {metric}: {value:.4f}")
        
        # Pattern Analyzer Results
        if 'pattern_analyzer' in results:
            report.append("\n## Pattern Analyzer")
            report.append("\nPattern Statistics:")
            for metric, value in results['pattern_analyzer']['pattern_stats'].items():
                report.append(f"- {metric}: {value:.4f}")
        
        # Write report
        with open(output_path, 'w') as f:
            f.write('\n'.join(report))
        
        logger.info(f"Evaluation report generated at {output_path}")
        
    except Exception as e:
        logger.error(f"Error generating evaluation report: {str(e)}")
        raise

def plot_model_comparison(results: Dict[str, Dict], output_path: str) -> None:
    """
    Generate comparative visualizations of model performance.
    
    Args:
        results: Dictionary containing evaluation results
        output_path: Path to save the plots
    """
    try:
        # Create comparison plots
        plt.style.use('seaborn')
        
        # Model accuracy comparison
        plt.figure(figsize=(12, 6))
        
        # Add model-specific metrics to plot
        metrics = []
        if 'categorizer' in results:
            metrics.append({
                'Model': 'Categorizer',
                'Metric': 'Accuracy',
                'Value': results['categorizer']['classification_report']['accuracy']
            })
        
        if 'forecaster' in results:
            metrics.append({
                'Model': 'Forecaster',
                'Metric': 'R² Score',
                'Value': 1 - results['forecaster']['mse'] / np.var(results['forecaster']['y_test'])
            })
        
        if metrics:
            metrics_df = pd.DataFrame(metrics)
            sns.barplot(data=metrics_df, x='Model', y='Value', hue='Metric')
            plt.title('Model Performance Comparison')
            plt.savefig(f"{output_path}/model_comparison.png")
            plt.close()
        
        logger.info(f"Model comparison plots saved to {output_path}")
        
    except Exception as e:
        logger.error(f"Error generating model comparison plots: {str(e)}")
        raise