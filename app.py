from fastapi import FastAPI, Request, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Optional
import os

# Initialize FastAPI app
app = FastAPI(
    title="Monthly Expenses Prediction API",
    description="Predict monthly expenses based on historical data",
    version="1.0.0"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="templates")

# Load model artifacts
MODEL_PATH = "models/model_artifacts.pkl"
artifacts = joblib.load(MODEL_PATH)

model = artifacts['model']
scaler = artifacts['scaler']
feature_cols = artifacts['feature_columns']
use_scaled = artifacts['use_scaled']
training_data = artifacts['training_data']
category_cols = artifacts['all_category_columns']
metrics = artifacts['metrics']


# Pydantic models for request/response
class PredictionRequest(BaseModel):
    month: int
    year: int


class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    month: str
    year: int
    predicted_expense: float
    currency: str
    confidence_interval_68: dict
    confidence_interval_95: dict
    model_name: str
    model_metrics: dict


def predict_expenses(month: int, year: int) -> dict:
    """
    Predict monthly expenses for a given month and year.
    """
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

    # Calculate confidence intervals
    mae = metrics['test_mae']
    ci_68 = {
        'lower': round(prediction - mae, 2),
        'upper': round(prediction + mae, 2)
    }
    ci_95 = {
        'lower': round(prediction - 2 * mae, 2),
        'upper': round(prediction + 2 * mae, 2)
    }

    month_names = {
        1: 'January', 2: 'February', 3: 'March', 4: 'April',
        5: 'May', 6: 'June', 7: 'July', 8: 'August',
        9: 'September', 10: 'October', 11: 'November', 12: 'December'
    }

    return {
        'month': month_names[month],
        'year': year,
        'predicted_expense': round(prediction, 2),
        'currency': 'AZN',
        'confidence_interval_68': ci_68,
        'confidence_interval_95': ci_95,
        'model_name': artifacts['model_name'],
        'model_metrics': {
            'test_mae': round(metrics['test_mae'], 2),
            'test_rmse': round(metrics['test_rmse'], 2),
            'test_r2': round(metrics['test_r2'], 4)
        }
    }


# Routes
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Render home page"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_name": artifacts['model_name']
    }


@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict monthly expenses for the given month and year.
    """
    # Validate month
    if request.month < 1 or request.month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")

    # Validate year
    if request.year < 2022 or request.year > 2030:
        raise HTTPException(status_code=400, detail="Year must be between 2022 and 2030")

    try:
        result = predict_expenses(request.month, request.year)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/api/history")
async def get_history():
    """
    Get historical spending data summary.
    """
    try:
        history_data = training_data[['year_month', 'total_amount', 'transaction_count']].tail(12)
        history_data['year_month'] = history_data['year_month'].astype(str)

        return {
            "history": history_data.to_dict('records'),
            "statistics": {
                "average_monthly": round(training_data['total_amount'].mean(), 2),
                "median_monthly": round(training_data['total_amount'].median(), 2),
                "max_monthly": round(training_data['total_amount'].max(), 2),
                "min_monthly": round(training_data['total_amount'].min(), 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


@app.get("/api/model-info")
async def get_model_info():
    """
    Get information about the trained model.
    """
    return {
        "model_name": artifacts['model_name'],
        "metrics": {
            "test_mae": round(metrics['test_mae'], 2),
            "test_rmse": round(metrics['test_rmse'], 2),
            "test_r2": round(metrics['test_r2'], 4)
        },
        "features_count": len(feature_cols),
        "training_samples": len(training_data),
        "currency": "AZN (Azerbaijani Manat)"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
