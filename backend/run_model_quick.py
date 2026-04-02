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
    
    model_path = os.path.join(os.path.dirname(__file__), '../ml-model/models/model.pkl')
    scaler_path = os.path.join(os.path.dirname(__file__), '../ml-model/models/scaler.pkl')
    
    try:
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
        sys.exit(1)

    try:
        data = json.loads(payload)
        features = [
            'cycle', 
            'temperature', 
            'pressure', 
            'vibration', 
            'rpm'
        ]
        df = pd.DataFrame([data])[features]
        X_scaled = scaler.transform(df)
        pred = model.predict(X_scaled)
        
        rul = max(0, float(pred[0]))
        status = "Safe"
        if rul <= 30:
            status = "Critical"
        elif rul <= 80:
            status = "Warning"
            
        print(json.dumps({"rul": rul, "status": status}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
