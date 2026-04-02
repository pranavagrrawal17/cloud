# Predictive Maintenance of Industrial Machinery

An end-to-end Machine Learning and Cloud Computing project utilizing an optimized NASA C-MAPSS dataset to predict the Remaining Useful Life (RUL) of turbofan engines.

## 🌟 Project Features
- **Machine Learning**: Random Forest Regressor trained on optimized NASA sensor data.
- **Microservice Architecture**: Fast and lightweight Python predictor running within a Node.js + Express backend.
- **AWS Cloud**: Deployed on EC2 (Free Tier) with RDS MySQL for persistent storage.
- **Live Dashboard**: React (Vite) + Tailwind CSS dashboard with dynamic visual alerts and CSV upload.

## 📂 Project Structure
* `/ml-model/`: Contains dataset generator (`generate_dataset.py`) and training script (`train.py`) that exports `model.pkl`.
* `/backend/`: Node.js Express API that connects to AWS RDS (MySQL) and bridges communication to the Python model.
* `/frontend/`: React Dashboard for monitoring and CSV upload.
* `/docs/`: Contains extra guides (`AWS_DEPLOYMENT.md`, `VIVA_GUIDE.md`).

## 🚀 Quick Start (Local)

### 1. Model Training
```bash
cd ml-model
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 generate_dataset.py
python3 train.py
```
*(This creates `models/model.pkl` and `models/scaler.pkl`)*

### 2. Backend
Requires MySQL. Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in an `.env` file.
```bash
cd backend
npm install
npm start
```
*(Ensure the ML model's `venv` exists, as the backend uses it to run `run_model.py`)*

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## ☁️ AWS Deployment
See [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md) for the complete step-by-step guide.
