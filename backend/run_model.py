import sys
import json
import joblib
import pandas as pd
import os
import warnings

# Suppress sklearn warnings about feature names
warnings.filterwarnings("ignore")

def main():
    # Load model and scaler
    model_path = os.path.join(os.path.dirname(__file__), '../ml-model/models/model.pkl')
    scaler_path = os.path.join(os.path.dirname(__file__), '../ml-model/models/scaler.pkl')
    
    try:
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
        sys.exit(1)

    # Signal to Node that we are ready
    print("READY")
    sys.stdout.flush()

    while True:
        line = sys.stdin.readline()
        if not line:
            continue
        line = line.strip()
        if line == "EXIT":
            break
        
        try:
            data = json.loads(line)
            df = pd.DataFrame([data])
            
            # Predict
            X_scaled = scaler.transform(df)
            pred = model.predict(X_scaled)
            
            rul = max(0, float(pred[0]))
            status = "Safe"
            if rul < 30:
                status = "Critical"
            elif rul < 80:
                status = "Warning"
                
            response = {"rul": rul, "status": status}
            print(json.dumps(response))
            sys.stdout.flush()
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()

if __name__ == '__main__':
    main()
