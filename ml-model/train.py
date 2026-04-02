import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

def train_model():
    print("Loading synthetic phased dataset...")
    df = pd.DataFrame()
    try:
        df = pd.read_csv('data/train_FD001.csv')
    except Exception as e:
        print("Error reading dataset! Make sure to run generate_dataset.py first.")
        return

    features = ['cycle', 'temperature', 'pressure', 'vibration', 'rpm']
    X = df[features]
    y = df['RUL']

    print("Splitting and Scaling data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("Training Optimized Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=30, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    from sklearn.metrics import root_mean_squared_error
    rmse = root_mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Evaluation => RMSE: {rmse:.2f} | R2 Score: {r2:.2f}")

    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')

    model_size = os.path.getsize('models/model.pkl') / (1024 * 1024)
    print(f"Exported model size: {model_size:.2f} MB (Optimized for AWS Free Tier)")

if __name__ == "__main__":
    train_model()
