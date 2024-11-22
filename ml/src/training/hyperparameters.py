from typing import Dict, Any

def get_default_params() -> Dict[str, Dict[str, Any]]:
    """
    Get default hyperparameters for all models.
    
    Returns:
        Dictionary containing default parameters for each model
    """
    return {
        'categorizer': {
            'batch_size': 32,
            'epochs': 10,
            'learning_rate': 2e-5,
            'max_length': 128,
            'train_size': 0.8,
            'num_labels': None,  # Set dynamically based on data
            'dropout_rate': 0.1
        },
        'anomaly_detector': {
            'contamination': 0.1,
            'n_estimators': 100,
            'max_samples': 'auto',
            'train_size': 0.8,
            'random_state': 42
        },
        'forecaster': {
            'sequence_length': 30,
            'train_size': 0.8,
            'batch_size': 32,
            'epochs': 100,
            'learning_rate': 0.001,
            'lstm_units': 64,
            'dropout_rate': 0.2
        },
        'pattern_analyzer': {
            'eps': 0.5,
            'min_samples': 5,
            'algorithm': 'auto',
            'leaf_size': 30,
            'n_jobs': -1
        }
    }

def validate_params(model_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and merge provided parameters with defaults.
    
    Args:
        model_type: Type of model ('categorizer', 'anomaly_detector', etc.)
        params: Provided parameters
        
    Returns:
        Merged parameters dictionary
    """
    defaults = get_default_params()
    if model_type not in defaults:
        raise ValueError(f"Unknown model type: {model_type}")
        
    # Get default parameters for model type
    default_params = defaults[model_type]
    
    # If no parameters provided, return defaults
    if params is None:
        return default_params
        
    # Merge provided parameters with defaults
    merged_params = default_params.copy()
    merged_params.update(params)
    
    return merged_params

def get_param_grid(model_type: str) -> Dict[str, list]:
    """
    Get parameter grid for hyperparameter tuning.
    
    Args:
        model_type: Type of model
        
    Returns:
        Dictionary containing parameter grid
    """
    param_grids = {
        'categorizer': {
            'batch_size': [16, 32, 64],
            'learning_rate': [1e-5, 2e-5, 3e-5],
            'dropout_rate': [0.1, 0.2, 0.3]
        },
        'anomaly_detector': {
            'contamination': [0.05, 0.1, 0.15],
            'n_estimators': [50, 100, 200]
        },
        'forecaster': {
            'lstm_units': [32, 64, 128],
            'dropout_rate': [0.1, 0.2, 0.3],
            'learning_rate': [0.0001, 0.001, 0.01]
        },
        'pattern_analyzer': {
            'eps': [0.3, 0.5, 0.7],
            'min_samples': [3, 5, 7]
        }
    }
    
    if model_type not in param_grids:
        raise ValueError(f"Unknown model type: {model_type}")
        
    return param_grids[model_type]