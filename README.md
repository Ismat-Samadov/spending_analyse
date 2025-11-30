# Monthly Expenses Predictor

AI-powered monthly expense forecasting application using machine learning and historical spending data.

## Features

- 📊 **Accurate Predictions**: Uses Lasso regression model with 86% R² score
- 💰 **Azerbaijani Manat (₼)**: All predictions in AZN currency
- 🎯 **Confidence Intervals**: Provides 68% and 95% confidence ranges
- 📈 **Historical Analysis**: View past spending trends
- 🚀 **Fast API**: Built with FastAPI for high performance
- 🐳 **Docker Ready**: Easy deployment with Docker

## Tech Stack

- **Backend**: FastAPI, Python 3.11
- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **ML Model**: Scikit-learn (Lasso Regression)
- **Templating**: Jinja2
- **Containerization**: Docker & Docker Compose

## Project Structure

```
monthly_expenses_prediction/
├── app.py                      # FastAPI application
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose configuration
├── .dockerignore              # Docker ignore rules
├── models/                    # Trained ML models
│   ├── best_model.pkl
│   ├── scaler.pkl
│   ├── model_artifacts.pkl
│   ├── predict.py
│   └── training_monthly_data.csv
├── templates/                 # Jinja2 HTML templates
│   └── index.html
├── static/                    # Static assets
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── notebooks/                 # Jupyter notebooks for analysis
│   ├── analyse.ipynb
│   ├── prediction.ipynb
│   └── performance.md
└── data/                      # Raw data
    └── budget.csv
```

## Installation & Running

### Option 1: Docker (Recommended)

#### Prerequisites
- Docker installed
- Docker Compose installed

#### Steps

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Open browser: http://localhost:8000

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

#### Alternative Docker Commands

```bash
# Build the Docker image
docker build -t monthly-expenses-predictor .

# Run the container
docker run -d -p 8000:8000 --name expenses-app monthly-expenses-predictor

# View logs
docker logs -f expenses-app

# Stop container
docker stop expenses-app

# Remove container
docker rm expenses-app
```

### Option 2: Local Development

#### Prerequisites
- Python 3.11 or higher
- pip

#### Steps

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

   Or with uvicorn:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Access the application:**
   - Open browser: http://localhost:8000

## API Documentation

Once the app is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints

#### `GET /`
- **Description**: Home page (HTML)
- **Response**: Rendered HTML template

#### `GET /health`
- **Description**: Health check endpoint
- **Response**:
  ```json
  {
    "status": "healthy",
    "model_loaded": true,
    "model_name": "Lasso"
  }
  ```

#### `POST /api/predict`
- **Description**: Predict monthly expenses
- **Request Body**:
  ```json
  {
    "month": 12,
    "year": 2025
  }
  ```
- **Response**:
  ```json
  {
    "month": "December",
    "year": 2025,
    "predicted_expense": 2589.15,
    "currency": "AZN",
    "confidence_interval_68": {
      "lower": 2399.00,
      "upper": 2779.30
    },
    "confidence_interval_95": {
      "lower": 2209.00,
      "upper": 2969.30
    },
    "model_name": "Lasso",
    "model_metrics": {
      "test_mae": 190.15,
      "test_rmse": 241.58,
      "test_r2": 0.8621
    }
  }
  ```

#### `GET /api/history`
- **Description**: Get historical spending data
- **Response**:
  ```json
  {
    "history": [...],
    "statistics": {
      "average_monthly": 2361.22,
      "median_monthly": 2162.19,
      "max_monthly": 5509.49,
      "min_monthly": 1017.81
    }
  }
  ```

#### `GET /api/model-info`
- **Description**: Get model information and metrics
- **Response**:
  ```json
  {
    "model_name": "Lasso",
    "metrics": {
      "test_mae": 190.15,
      "test_rmse": 241.58,
      "test_r2": 0.8621
    },
    "features_count": 70,
    "training_samples": 41,
    "currency": "AZN (Azerbaijani Manat)"
  }
  ```

## Model Performance

- **Model**: Lasso Regression
- **Test MAE**: ₼190.15 (8% average error)
- **Test RMSE**: ₼241.58
- **Test R²**: 0.8621 (86.21% variance explained)
- **Features**: 70+ engineered features including:
  - Lag features (1, 2, 3, 6, 12 months)
  - Rolling statistics (3, 6, 12 month windows)
  - Category-based spending patterns
  - Time-based features (seasonality)
  - Exponential weighted moving averages

For detailed performance analysis, see [notebooks/performance.md](notebooks/performance.md).

## Usage Example

### Web Interface

1. Open http://localhost:8000
2. Select month and year
3. Click "Predict Expenses"
4. View prediction with confidence intervals

### Python API Client

```python
import requests

url = "http://localhost:8000/api/predict"
data = {"month": 12, "year": 2025}

response = requests.post(url, json=data)
result = response.json()

print(f"Predicted expenses: ₼{result['predicted_expense']}")
print(f"Confidence interval (68%): ₼{result['confidence_interval_68']['lower']} - ₼{result['confidence_interval_68']['upper']}")
```

## Development

### Running Notebooks

1. **Install notebook dependencies:**
   ```bash
   pip install -r analytics_requirements.txt
   pip install -r prediction_requirements.txt
   ```

2. **Launch Jupyter:**
   ```bash
   jupyter notebook
   ```

3. **Open notebooks:**
   - `notebooks/analyse.ipynb` - Data analysis
   - `notebooks/prediction.ipynb` - Model training

### Retraining the Model

If you want to retrain the model with new data:

1. Update `data/budget.csv` with new transactions
2. Run `notebooks/prediction.ipynb`
3. New model artifacts will be saved to `models/` directory
4. Restart the FastAPI application

## Docker Deployment Tips

### Production Deployment

```bash
# Build with production tag
docker build -t monthly-expenses-predictor:v1.0 .

# Run with restart policy
docker run -d \
  --name expenses-app \
  --restart always \
  -p 8000:8000 \
  monthly-expenses-predictor:v1.0
```

### Environment Variables (Optional)

Create a `.env` file for configuration:

```env
PORT=8000
LOG_LEVEL=info
```

Update `docker-compose.yml` to use env file:

```yaml
services:
  web:
    env_file:
      - .env
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Docker Build Issues

```bash
# Clean build (no cache)
docker-compose build --no-cache

# Remove all unused Docker resources
docker system prune -a
```

### Model Loading Errors

Ensure the `models/` directory contains all required files:
- `model_artifacts.pkl`
- `best_model.pkl`
- `scaler.pkl`
- `feature_columns.pkl`
- `training_monthly_data.csv`

## License

This project is for personal use and educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ using FastAPI and Machine Learning**
