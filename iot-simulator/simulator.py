import time
import requests
import random

API_URL = "http://localhost:5002/sensor-data"
LIFECYCLE_LENGTH = 218

def get_sensor_values(cycle):
    if cycle <= 70:
        temp = random.uniform(60, 70)
        vib = random.uniform(0.1, 0.2)
    elif cycle <= 150:
        temp = random.uniform(70, 85)
        vib = random.uniform(0.2, 0.5)
    else:
        temp = random.uniform(85, 100)
        vib = random.uniform(0.5, 1.0)
    
    base_pressure = 500.0 - (cycle * 0.1)
    pressure = base_pressure + random.uniform(-2, 2)
    
    base_rpm = 8000.0 - (cycle * 1.5)
    rpm = base_rpm + random.uniform(-10, 10)
    
    return temp, pressure, vib, rpm

def simulate():
    unit = 1 
    
    while True:
        print(f"\nStarting new lifecycle for Engine Unit #{unit}...")
        
        for cycle in range(1, LIFECYCLE_LENGTH + 1):
            temp, pressure, vib, rpm = get_sensor_values(cycle)
            
            payload = {
                "unit": unit,
                "cycle": cycle,
                "temperature": temp,
                "pressure": pressure,
                "vibration": vib,
                "rpm": rpm
            }
            
            try:
                res = requests.post(API_URL, json=payload)
                if res.status_code == 201:
                    data = res.json()
                    backend_data = data.get('data', {})
                    pred_rul = backend_data.get('rul_prediction', 'N/A')
                    if isinstance(pred_rul, float):
                        pred_rul = round(pred_rul, 2)
                    status = backend_data.get('status', 'Unknown')
                    print(f"Cycle {cycle}: Data Sent. RUL: {pred_rul} | Status: {status}")
                else:
                    print(f"Cycle {cycle}: Backend returned {res.status_code}")
            except requests.exceptions.RequestException:
                print(f"Cycle {cycle}: Failed to connect to Backend API. Is it running?")
            
            time.sleep(3)
            
        print("Engine failed. Replacing with new unit...")
        unit += 1

if __name__ == "__main__":
    print("Starting IoT Simulator...")
    print(f"Targeting backend at {API_URL}")
    print(f"Engine Lifespan simulated as {LIFECYCLE_LENGTH} cycles.")
    simulate()
