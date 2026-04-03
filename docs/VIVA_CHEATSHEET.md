# 🎓 Viva & Demo Cheat Sheet

Use these commands in your **AWS EC2 terminal** to show your teacher the project's technical depth.

---

## 🏗️ 1. Prove the "Cloud Backend" is Running
This shows that your Node.js server is active and managing your ML model.

```bash
# Check if the backend is online
pm2 status

# See real-time data arriving from your Mac (Simulator)
pm2 logs backend
```

---

## 🗄️ 2. Prove the "Cloud Database" (RDS) Connection
This is the most important part of the cloud project.

```bash
# Connect to RDS MySQL and count the total records
# (Replace with your actual password when it asks)
mysql -h predictive-maintenance-db.cny2qu6smt8v.ap-south-1.rds.amazonaws.com -u admin -p -e "USE predictive_maintenance; SELECT COUNT(*) as TOTAL_RECORDS FROM sensor_data;"

# Show the 5 most recent failures (Critical status)
mysql -h predictive-maintenance-db.cny2qu6smt8v.ap-south-1.rds.amazonaws.com -u admin -p -e "USE predictive_maintenance; SELECT cycle, rul_prediction, status FROM sensor_data WHERE status='Critical' ORDER BY timestamp DESC LIMIT 5;"
```

---

## 🧹 3. "The Fresh Start" (Clear Old Data)
If you want to clear your old CSV data so your Live Simulator starts from a clean Slate:

```bash
mysql -h predictive-maintenance-db.cny2qu6smt8v.ap-south-1.rds.amazonaws.com -u admin -p -e "TRUNCATE TABLE predictive_maintenance.sensor_data;"
```

---

## 🕸️ 4. Prove Nginx (Web Server) is Active
This proves you aren't just running a "dev" server, but a production-grade web server.

```bash
# Check Nginx status
sudo systemctl status nginx

# Verify the Nginx config file
sudo nginx -t
```

---

## 📡 5. Professional "Workflow" Checklist
1.  **Start Simulator on Mac**: `python3 simulator.py`
2.  **Show Live Updates on Dashboard**: `http://65.0.169.127`
3.  **Show Data in RDS Table**: Run the MySQL Query above.
4.  **Download JSON Export**: Click the blue button on the dashboard to show data portability.

---

> [!TIP]
> **Pro Tip for the Viva:** If the teacher asks about security, mention that your RDS database is protected by a **Security Group** that only allows traffic from your EC2 instance's ID!
