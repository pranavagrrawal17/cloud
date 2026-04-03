import sys
import json
import joblib
import pandas as pd
import os
import warnings

warnings.filterwarnings("ignore")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No payload provided"}))
        sys.exit(1)
        
    payload = sys.argv[1]
    
    model_dir = os.path.join(os.path.dirname(__file__), '../ml-model/models/')
    model_path = os.path.join(model_dir, 'model.pkl')
    scaler_path = os.path.join(model_dir, 'scaler.pkl')
    
    try:
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
        sys.exit(1)

    try:
        data_list = json.loads(payload)
        # Ensure it's a list even if a single object was passed
        if isinstance(data_list, dict):
            data_list = [data_list]
            
        features = ['cycle', 'temperature', 'pressure', 'vibration', 'rpm']
        df = pd.DataFrame(data_list)[features]
        
        # Vectorized scaling and prediction
        X_scaled = scaler.transform(df)
        preds = model.predict(X_scaled)
        
        results = []
        for i, pred in enumerate(preds):
            rul = max(0, float(pred))
            status = "Safe"
            if rul <= 30:
                status = "Critical"
            elif rul <= 80:
                status = "Warning"
            results.append({"rul": rul, "status": status})
            
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
