
import joblib
import pandas as pd
import numpy as np

def predict_monthly_expenses(target_month_str, model_artifacts_path='models/model_artifacts.pkl'):
    """
    Predict monthly expenses for a given month.
    
    Parameters:
    -----------
    target_month_str : str
        Target month in format 'MM/YYYY' (e.g., '12/2025')
    model_artifacts_path : str
        Path to the saved model artifacts
    
    Returns:
    --------
    dict : Dictionary containing prediction and metadata
    """
    # Load artifacts
    artifacts = joblib.load(model_artifacts_path)
    model = artifacts['model']
    scaler = artifacts['scaler']
    feature_cols = artifacts['feature_columns']
    use_scaled = artifacts['use_scaled']
    training_data = artifacts['training_data']
    category_cols = artifacts['all_category_columns']
    
    # Parse target month
    month, year = map(int, target_month_str.split('/'))
    target_date = pd.Period(f'{year}-{month:02d}', freq='M')
    
    # Create feature vector
    features = {}
    
    # Basic features
    features['year'] = year
    features['month'] = month
    features['month_sin'] = np.sin(2 * np.pi * month / 12)
    features['month_cos'] = np.cos(2 * np.pi * month / 12)
    features['quarter'] = (month - 1) // 3 + 1
    features['is_year_start'] = int(month == 1)
    features['is_year_end'] = int(month == 12)
    features['is_mid_year'] = int(month in [6, 7])
    features['time_index'] = len(training_data)
    
    # Get last known values
    last_values = training_data.iloc[-12:]['total_amount'].values
    
    # Lag features
    for lag in [1, 2, 3, 6, 12]:
        if lag <= len(last_values):
            features[f'total_amount_lag_{lag}'] = last_values[-lag]
        else:
            features[f'total_amount_lag_{lag}'] = last_values[0]
    
    # Transaction count lags
    last_counts = training_data.iloc[-12:]['transaction_count'].values
    for lag in [1, 2, 3, 6, 12]:
        if lag <= len(last_counts):
            features[f'transaction_count_lag_{lag}'] = last_counts[-lag]
        else:
            features[f'transaction_count_lag_{lag}'] = last_counts[0]
    
    # Rolling statistics
    for window in [3, 6, 12]:
        window_data = last_values[-window:] if window <= len(last_values) else last_values
        features[f'rolling_mean_{window}'] = np.mean(window_data)
        features[f'rolling_std_{window}'] = np.std(window_data) if len(window_data) > 1 else 0
        features[f'rolling_max_{window}'] = np.max(window_data)
        features[f'rolling_min_{window}'] = np.min(window_data)
    
    # EWM features
    features['ewm_3'] = pd.Series(last_values[-6:]).ewm(span=3, adjust=False).mean().iloc[-1] if len(last_values) >= 6 else last_values[-1]
    features['ewm_6'] = pd.Series(last_values).ewm(span=6, adjust=False).mean().iloc[-1] if len(last_values) >= 6 else last_values[-1]
    
    # MoM and YoY changes
    if len(last_values) >= 2:
        features['mom_change'] = (last_values[-1] - last_values[-2]) / last_values[-2] if last_values[-2] != 0 else 0
        features['mom_change_abs'] = last_values[-1] - last_values[-2]
    else:
        features['mom_change'] = 0
        features['mom_change_abs'] = 0
    
    if len(last_values) >= 12:
        features['yoy_growth'] = (last_values[-1] - last_values[0]) / last_values[0] if last_values[0] != 0 else 0
    else:
        features['yoy_growth'] = 0
    
    # Basic stats features
    last_month = training_data.iloc[-1]
    features['avg_amount'] = last_month['avg_amount']
    features['std_amount'] = last_month['std_amount']
    features['transaction_count'] = last_month['transaction_count']
    features['min_amount'] = last_month['min_amount']
    features['max_amount'] = last_month['max_amount']
    
    # Category features
    for cat_col in category_cols:
        last_3_months = training_data.iloc[-3:][cat_col].mean()
        features[cat_col] = last_3_months
    
    # Create DataFrame
    X_pred = pd.DataFrame([features])[feature_cols]
    
    # Make prediction
    if use_scaled:
        X_pred_scaled = scaler.transform(X_pred)
        prediction = model.predict(X_pred_scaled)[0]
    else:
        prediction = model.predict(X_pred)[0]
    
    return {
        'month': target_month_str,
        'predicted_expense': float(prediction),
        'model': artifacts['model_name'],
        'metrics': artifacts['metrics']
    }

if __name__ == "__main__":
    # Example usage
    result = predict_monthly_expenses('12/2025')
    print(f"Prediction for {result['month']}: ₼{result['predicted_expense']:,.2f}")
    print(f"Model: {result['model']}")
    print(f"Test MAE: ₼{result['metrics']['test_mae']:.2f}")
