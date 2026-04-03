# 🚀 Predictive Maintenance on AWS
**Cloud-Native IoT Predictive Analytics for Industrial Turbofans**

A full-stack industrial IoT application that predicts Remaining Useful Life (RUL) and failure risk for aircraft engines using Machine Learning, hosted on a production-ready AWS architecture.

## 🏗️ System Architecture
- **Edge Layer**: Local IoT Simulator (Python) streaming telemetry via REST API.
- **Compute Layer**: AWS EC2 (Ubuntu) running Node.js Backend & React Frontend.
- **ML Layer**: Scikit-Learn (Random Forest Regressor) for batch and real-time inference.
- **Database Layer**: AWS RDS (MySQL) for persistent, high-performance structured storage.
- **Web Layer**: Nginx Reverse Proxy for secure, production-grade routing.

## ✨ Key Features
- **Real-time Monitoring**: Live dashboard updates every 3 seconds from the AWS Cloud.
- **Batch Processing**: High-speed CSV ingestion of thousands of records using optimized Pandas inference.
- **Intelligent Results**: Automatic status categorization (Safe/Warning/Critical) based on ML RUL predictions.
- **Data Portability**: JSON Export feature for compliance and maintenance logging.
- **Modern UI**: Dark-themed, responsive dashboard with interactive sensor trajectory charts.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Node.js, Express, PM2 (Process Management).
- **ML/Analytics**: Python 3, Scikit-Learn, Pandas, joblib.
- **Cloud**: AWS (EC2, RDS, VPC/Security Groups), Nginx.

## 🚀 Presentation & Viva
- **[Viva Cheat Sheet](./docs/VIVA_CHEATSHEET.md)**: Important commands and architecture verification.
- **[Technical Viva Guide](./docs/VIVA_GUIDE.md)**: Deep dive into the "Why" and "How" of choices (e.g., Random Forest vs. RNN).
- **[PPT Presentation Guide](./docs/PRESENTATION_ASSETS.md)**: Slide-by-slide guide for your viva presentation.
