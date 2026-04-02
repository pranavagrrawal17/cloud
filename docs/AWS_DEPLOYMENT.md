# AWS Deployment Guide — Step by Step (Free Tier)

> **EVERYTHING happens inside AWS. All terminal work via EC2 Instance Connect (browser terminal).**

---

## STEP 1: Log In to AWS

1. Open your browser → Go to **https://aws.amazon.com**
2. Click **"Sign In to the Console"** (top right)
3. If you don't have an account → Click **"Create an AWS Account"**
   - It asks for a credit card — **don't worry, Free Tier won't charge you**
   - Choose the **"Basic Support - Free"** plan
4. After logging in, **set your region** (top-right corner) to **Asia Pacific (Mumbai) ap-south-1**

> ⚠️ **Always check your region is ap-south-1 (Mumbai)** before creating any resource. If you create EC2 in Mumbai and RDS in Ohio, they won't be able to talk to each other.

---

## STEP 2: Create an RDS MySQL Database

This is your database that will store all sensor data and predictions.

### 2.1: Navigate to RDS
1. In the search bar at the top, type **"RDS"** → Click **"RDS"**
2. Click the orange **"Create database"** button

### 2.2: Database Settings

| Setting | What to select |
|---|---|
| **Creation method** | Standard create |
| **Engine type** | **MySQL** |
| **Engine Version** | MySQL 8.0.x (keep default, any 8.0 version is fine) |
| **Templates** | ⭐ Click **"Free tier"** — this is very important! |

### 2.3: Instance Settings

| Setting | What to enter |
|---|---|
| **DB instance identifier** | `predictive-maintenance-db` |
| **Master username** | `admin` |
| **Credentials management** | Self managed |
| **Master password** | Enter a password (e.g., `MyProject2026!`) |
| **Confirm password** | Same password again |

> 📝 **WRITE DOWN THIS PASSWORD** somewhere. You will need it later.

### 2.4: Instance Configuration

| Setting | What to select |
|---|---|
| **DB instance class** | `db.t3.micro` (should be auto-selected for Free Tier) |
| **Storage type** | General Purpose SSD (gp2) |
| **Allocated storage** | `20` GB |
| **Enable storage autoscaling** | ❌ **UNCHECK this** |

### 2.5: Connectivity

| Setting | What to select |
|---|---|
| **Compute resource** | Don't connect to an EC2 compute resource |
| **VPC** | Default VPC |
| **DB subnet group** | default |
| **Public access** | ⭐ **Yes** |
| **VPC security group** | **Create new** |
| **New VPC security group name** | `rds-mysql-sg` |

### 2.6: Additional Configuration

1. Click the **"Additional configuration"** dropdown to expand it
2. **Initial database name**: `predictive_maintenance`
3. **Enable automated backups**: ❌ **UNCHECK**
4. **Enable Enhanced Monitoring**: ❌ **UNCHECK**
5. **Enable deletion protection**: ❌ **UNCHECK**

### 2.7: Create!
1. Click **"Create database"**
2. ⏳ Wait 5–10 minutes for it to become **"Available"**
3. Once available, **click on the database name** to open its details
4. Under **"Connectivity & security"**, find and copy the **Endpoint**:
   ```
   predictive-maintenance-db.c9xxxxxxxxxxx.ap-south-1.rds.amazonaws.com
   ```

> 📝 **WRITE DOWN THIS ENDPOINT** — you'll need it in Step 9.

---

## STEP 3: Create an EC2 Instance

This is your cloud server that will run everything.

### 3.1: Navigate to EC2
1. In the search bar, type **"EC2"** → Click **"EC2"**
2. Click the orange **"Launch instance"** button

### 3.2: Instance Settings

| Setting | What to enter/select |
|---|---|
| **Name** | `predictive-maintenance` |
| **Application and OS Images** | **Ubuntu** → Ubuntu Server 24.04 LTS → **Free tier eligible** |
| **Instance type** | `t2.micro` (Free tier eligible) |
| **Key pair** | Click **"Proceed without a key pair"** (we'll use EC2 Instance Connect) |

### 3.3: Network Settings

Click **"Edit"** next to Network settings:

1. **VPC**: Default VPC
2. **Auto-assign Public IP**: **Enable**
3. **Firewall (security groups)**: Click **"Create security group"**
4. **Security group name**: `ec2-web-sg`
5. Add these rules (click "Add security group rule" for each):

| Type | Port Range | Source | Description |
|---|---|---|---|
| SSH | 22 | 0.0.0.0/0 | EC2 Instance Connect |
| HTTP | 80 | 0.0.0.0/0 | Frontend (Nginx) |
| Custom TCP | 5002 | 0.0.0.0/0 | Backend API |

### 3.4: Storage
- Keep default **8 GiB gp3** (free tier allows up to 30 GiB)

### 3.5: Launch!
1. Click **"Launch instance"**
2. Click **"View all instances"**
3. Wait for **Instance state** to show **"Running"** and **Status check** to show **"2/2 checks passed"**

---

## STEP 4: Fix the RDS Security Group (Allow EC2 to Connect)

Right now your RDS blocks all connections. We need to open port 3306 for your EC2.

1. Go to **EC2 Dashboard** → **Security Groups** (left sidebar, under "Network & Security")
2. You'll see two security groups:
   - `ec2-web-sg` (for your EC2 instance)
   - `rds-mysql-sg` (for your RDS database)
3. Click on **`rds-mysql-sg`**
4. Click **"Inbound rules"** tab → Click **"Edit inbound rules"**
5. If there's an existing rule, **delete it** (click the X)
6. Click **"Add rule"**:

   | Type | Port Range | Source | Description |
   |---|---|---|---|
   | MySQL/Aurora | 3306 | **Custom** → type `ec2-web-sg` and select it from the dropdown | EC2 to RDS |

   > 💡 What this does: It says "only allow traffic on port 3306 from any machine that has the `ec2-web-sg` security group" — which is your EC2 instance.

7. Click **"Save rules"**

---

## STEP 5: Connect to EC2 (Browser Terminal)

1. Go to **EC2 Dashboard** → **Instances**
2. Select (checkbox) your `predictive-maintenance` instance
3. Click the **"Connect"** button at the top
4. You'll see the **"EC2 Instance Connect"** tab — it should be pre-selected
5. Username should say `ubuntu`
6. Click **"Connect"**

🎉 **A terminal opens in your browser!** This is your cloud server.

> **All remaining commands should be typed in this browser terminal.**

---

## STEP 6: Install All Software on EC2

Copy-paste these commands **one block at a time** into the EC2 terminal:

### 6.1: System Update
```bash
sudo apt update && sudo apt upgrade -y
```
*(If it asks "Which services should be restarted?" just press Enter)*

### 6.2: Install Python
```bash
sudo apt install python3 python3-pip python3-venv -y
```

### 6.3: Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 6.4: Install MySQL Client
```bash
sudo apt install mysql-client -y
```

### 6.5: Install Nginx
```bash
sudo apt install nginx -y
```

### 6.6: Install pm2
```bash
sudo npm install -g pm2
```

### 6.7: Verify Everything
```bash
echo "Node: $(node -v)"
echo "Python: $(python3 --version)"
echo "npm: $(npm -v)"
echo "MySQL client: $(mysql --version)"
echo "Nginx: $(nginx -v 2>&1)"
echo "pm2: $(pm2 --version)"
```

All of these should print version numbers without errors.

---

## STEP 7: Test RDS Connection from EC2

```bash
mysql -h predictive-maintenance-db.c9xxxxxxxxxxx.ap-south-1.rds.amazonaws.com -u admin -p
```

> Replace the hostname with **YOUR RDS Endpoint** from Step 2.

When it asks for the password, type the password you set in Step 2 and press Enter.

If you see `mysql>` prompt — **it works! 🎉**

Now create the table:

```sql
USE predictive_maintenance;

CREATE TABLE IF NOT EXISTS sensor_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit INT NOT NULL,
  cycle INT NOT NULL,
  temperature FLOAT NOT NULL,
  pressure FLOAT NOT NULL,
  vibration FLOAT NOT NULL,
  rpm FLOAT NOT NULL,
  rul_prediction FLOAT,
  status ENUM('Safe', 'Warning', 'Critical'),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

SHOW TABLES;
```

You should see:
```
+----------------------------------+
| Tables_in_predictive_maintenance |
+----------------------------------+
| sensor_data                      |
+----------------------------------+
```

Type `EXIT;` to quit MySQL.

---

## STEP 8: Get Your Project Code onto EC2

### Option A: Git Clone (if your code is on GitHub)
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/cloud_project_promise.git
cd cloud_project_promise
```

### Option B: Create files manually (if no GitHub)

If you don't have GitHub, you can upload files using SCP from your Mac. Open a **new local terminal** (not EC2):

```bash
scp -r /Users/pranavagrrawal/Desktop/cloud_project_promise ubuntu@YOUR_EC2_PUBLIC_IP:~/
```

> You'll need to create a temporary key pair in EC2 console for this. Git clone is much easier.

---

## STEP 9: Set Up the ML Model

```bash
cd ~/cloud_project_promise/ml-model

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Generate dataset
python3 generate_dataset.py

# Train the model
python3 train.py

# Verify
ls models/
# Should show: model.pkl  scaler.pkl

deactivate
```

---

## STEP 10: Configure and Start the Backend

```bash
cd ~/cloud_project_promise/backend

# Install Node.js packages  
npm install
```

Now **edit the .env file** with your RDS details:

```bash
nano .env
```

Change the contents to:
```
PORT=5002
DB_HOST=predictive-maintenance-db.c9xxxxxxxxxxx.ap-south-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=MyProject2026!
DB_NAME=predictive_maintenance
DB_PORT=3306
```

> ⚠️ Replace `DB_HOST` with YOUR RDS endpoint and `DB_PASSWORD` with YOUR password.

Press **Ctrl+O** → Enter → **Ctrl+X** to save and exit nano.

### Test the backend:
```bash
node index.js
```

You should see:
```
Server running on port 5002
MySQL connected successfully
sensor_data table ready
```

Press **Ctrl+C** to stop the test.

### Start with pm2 (runs permanently):
```bash
pm2 start index.js --name "backend"
pm2 save
pm2 status
```

You should see `backend | online`.

---

## STEP 11: Build the Frontend

```bash
cd ~/cloud_project_promise/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify
ls dist/
# Should show: index.html  assets/
```

---

## STEP 12: Set Up Nginx (Web Server)

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/predictive-maintenance
```

Paste this entire block into the editor:

```
server {
    listen 80;
    server_name _;

    root /home/ubuntu/cloud_project_promise/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /sensor-data {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /prediction {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /status {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /upload-csv {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 10M;
    }
}
```

Press **Ctrl+O** → Enter → **Ctrl+X** to save.

Now enable it:

```bash
sudo ln -sf /etc/nginx/sites-available/predictive-maintenance /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

`nginx -t` should say **"syntax is ok"** and **"test is successful"**.

---

## STEP 13: Auto-Start on Reboot

```bash
pm2 startup
```

pm2 will print a command starting with `sudo env PATH=...` — **copy that entire line and run it**.

Then:
```bash
pm2 save
```

---

## STEP 14: Test Everything! 🎉

### From EC2 terminal:
```bash
# Check backend is running
pm2 status

# Test backend
curl http://localhost:5002/status

# Get your public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

### From your browser:
1. Copy your EC2 Public IP from the EC2 Console (or from the curl command above)
2. Open browser → Go to `http://YOUR_EC2_PUBLIC_IP`
3. You should see the **Turbofan Diagnostics** dashboard!
4. Click **"Upload CSV"** → Upload the `engine_test_data.csv` file
5. Charts should populate with predictions!

### Verify data in RDS:
```bash
mysql -h YOUR_RDS_ENDPOINT -u admin -p -e "SELECT COUNT(*) FROM predictive_maintenance.sensor_data;"
```

---

## ⚠️ IMPORTANT: After Your Viva/Demo

To avoid any AWS charges, do this:

1. **Stop EC2**: EC2 → Instances → Select instance → Instance State → **Stop instance**
2. **Stop RDS**: RDS → Databases → Select database → Actions → **Stop**
3. **OR Delete everything**: If you're completely done:
   - EC2 → Terminate instance
   - RDS → Delete database (uncheck "Create final snapshot")

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `mysql: command not found` | Run `sudo apt install mysql-client -y` |
| Can't connect to RDS | Check Security Group allows port 3306 from EC2's security group |
| `npm: command not found` | Re-run the Node.js install: `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash - && sudo apt install -y nodejs` |
| Frontend shows "System Offline" | Upload a CSV file first — there's no data in the database yet |
| `ECONNREFUSED` on port 5002 | Run `pm2 restart backend` and check `pm2 logs backend` |
| Nginx shows default page | Run `sudo rm /etc/nginx/sites-enabled/default && sudo systemctl restart nginx` |
| EC2 Instance Connect fails | Make sure Security Group has SSH (port 22) open to `0.0.0.0/0` |
