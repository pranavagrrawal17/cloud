# Viva Preparation Guide

Use this document to prepare for justifications, technical explanations, and architecture questions during your project Viva.

## 1. System Architecture Flow

```text
[ User uploads CSV / Dashboard ]
         |
    (HTTP POST /upload-csv)
         |
         v
[ Node.js + Express Backend ] ---- (Saves Data) ----> [ AWS RDS (MySQL) ]
         |
    (child_process exec via pipes)
         |
         v
[ Python ML Predictor (Scikit-Learn/Joblib) ]
         |
    (Returns predicted RUL)
         |
         v
[ Node.js + Express Backend ]
         |
    (HTTP GET polling)
         |
         v
[ React Dashboard (Vite + Tailwind + Recharts) ]
```

## 2. Viva Justification (Crucial)

**Q: Why didn't you use an LSTM or Deep Learning model?**  
**A:** "We used the NASA dataset for training but optimized it by reducing size and features to meet AWS free tier constraints. We deployed a lightweight machine learning model (Random Forest Regressor) and used synthetic data that mimics real degradation patterns. This reflects real-world MLOps proxy systems where training is resource-intensive but deployment must be heavily optimized. An LSTM requires too much memory and compute for a simple `t2.micro` EC2 instance, whereas a tree-based regressor is highly performant (< 10ms prediction time) and provides strong baseline accuracy."

**Q: How did you connect Node.js with Python?**  
**A:** "To prevent running out of memory on AWS Free Tier, we avoided spawning a new Python child process on every HTTP request. Instead, the Node.js backend uses child_process.exec() to run a lightweight Python script that loads the model, makes a prediction, and returns JSON via stdout. This microservice bridge consumes virtually zero extra memory per request."

**Q: Why did you use RDS (MySQL) instead of MongoDB?**  
**A:** "For our cloud computing project, we wanted to demonstrate use of AWS-native services. AWS RDS is a fully managed relational database within Free Tier (750 hours/month, 20GB). It provides automated backups, patching, and high availability features. Since our sensor data has a fixed, structured schema (unit, cycle, temperature, etc.), a relational database is actually a better fit than a document store. We connect to RDS from our EC2 instance using the RDS endpoint, keeping everything within the AWS ecosystem."

**Q: How do you connect EC2 to RDS?**  
**A:** "We configured the RDS security group to allow inbound MySQL traffic (port 3306) from the EC2 instance's security group. The Node.js backend uses the `mysql2` package with a connection pool pointing to the RDS endpoint. This is a private, fast connection within the same VPC — no data leaves AWS."

**Q: Describe the Data Strategy?**  
**A:** "We introduced cycle-based synthetic data generation to simulate realistic machine lifecycle behavior. Each machine operates over ~218 cycles, with degradation reflected in sensor patterns. This ensures controlled, interpretable, and realistic predictive maintenance modeling while remaining efficient for AWS free tier deployment."

**Q: How do you identify failure probabilities?**  
**A:** "The model outputs an integer representing Remaining Useful Life (RUL). In our backend, we convert this into a qualitative state:
- SAFE: RUL > 80 cycles
- WARNING: 30 < RUL <= 80 cycles
- CRITICAL / FAILURE RISK: RUL <= 30 cycles"

## 3. AWS Services Used

| Service | Purpose | Free Tier? |
|---|---|---|
| EC2 (t2.micro) | Hosts backend, frontend, ML model | ✅ 750 hrs/month |
| RDS (db.t3.micro, MySQL) | Persistent database for sensor data | ✅ 750 hrs/month, 20GB |
| EC2 Instance Connect | Browser-based SSH terminal | ✅ Free |
| Nginx | Reverse proxy + serves React build | ✅ Free (installed on EC2) |
| pm2 | Process manager for Node.js | ✅ Free (npm package) |
