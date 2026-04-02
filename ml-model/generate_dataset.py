import pandas as pd
import numpy as np
import random
import os

TOTAL_MACHINES = 15
LIFECYCLE_LENGTH = 218

def get_sensor_values(cycle):
    # Phase 1: 1-70
    if cycle <= 70:
        temp = random.uniform(60, 70)
        vib = random.uniform(0.1, 0.2)
    # Phase 2: 71-150
    elif cycle <= 150:
        temp = random.uniform(70, 85)
        vib = random.uniform(0.2, 0.5)
    # Phase 3: 151-218
    else:
        temp = random.uniform(85, 100)
        vib = random.uniform(0.5, 1.0)
    
    # Slight pressure fluctuations
    base_pressure = 500.0 - (cycle * 0.1)
    pressure = base_pressure + random.uniform(-2, 2)
    
    # RPM decreasing slightly over time
    base_rpm = 8000.0 - (cycle * 1.5)
    rpm = base_rpm + random.uniform(-10, 10)
    
    return temp, pressure, vib, rpm

def generate():
    data = []
    
    for unit in range(1, TOTAL_MACHINES + 1):
        for cycle in range(1, LIFECYCLE_LENGTH + 1):
            temp, pressure, vib, rpm = get_sensor_values(cycle)
            rul = LIFECYCLE_LENGTH - cycle
            
            data.append({
                "unit": unit,
                "cycle": cycle,
                "temperature": temp,
                "pressure": pressure,
                "vibration": vib,
                "rpm": rpm,
                "RUL": rul
            })
            
    df = pd.DataFrame(data)
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/train_FD001.csv', index=False)
    print(f"Generated {len(df)} rows representing exact 1-218 phase degradation logic.")

if __name__ == "__main__":
    generate()
