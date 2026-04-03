const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;

// MySQL Connection Pool (connects to AWS RDS)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'predictive_maintenance',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

// Test DB connection and create table if not exists
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully');

    // Auto-create the table if it doesn't exist
    await conn.execute(`
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
      )
    `);
    console.log('sensor_data table ready');
    conn.release();
  } catch (err) {
    console.error('MySQL connection error:', err.message);
  }
})();

const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
const venvPythonPath = '../ml-model/venv/bin/python';
const pyRunner = fs.existsSync(venvPythonPath) ? venvPythonPath : pythonCommand;

const upload = multer({ dest: 'uploads/' });

function predictRUL(sensorData) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
        cycle: Number(sensorData.cycle),
        temperature: Number(sensorData.temperature),
        pressure: Number(sensorData.pressure),
        vibration: Number(sensorData.vibration),
        rpm: Number(sensorData.rpm)
    });
    
    exec(`${pyRunner} run_model_quick.py '${payload}'`, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error("Python exec error:", error, stderr);
        return reject(error);
      }
      try {
        const lines = stdout.trim().split('\n');
        const result = JSON.parse(lines[lines.length - 1]);
        resolve(result);
      } catch (e) {
        console.error("Python parsing error:", e, "output:", stdout);
        reject(e);
      }
    });
  });
}

app.post('/sensor-data', async (req, res) => {
  try {
    const data = req.body;
    const prediction = await predictRUL(data);
    
    if (prediction.error) {
        return res.status(500).json({ error: prediction.error });
    }

    const [result] = await pool.execute(
      'INSERT INTO sensor_data (unit, cycle, temperature, pressure, vibration, rpm, rul_prediction, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.unit || 1, data.cycle, data.temperature, data.pressure, data.vibration, data.rpm, prediction.rul, prediction.status]
    );
    
    const newRecord = {
      id: result.insertId,
      unit: data.unit || 1,
      cycle: data.cycle,
      temperature: data.temperature,
      pressure: data.pressure,
      vibration: data.vibration,
      rpm: data.rpm,
      rul_prediction: prediction.rul,
      status: prediction.status
    };
    
    res.status(201).json({ message: 'Data logged', data: newRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/prediction', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100'
    );
    res.json(rows.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/status', async (req, res) => {
    try {
        const [rows] = await pool.execute(
          'SELECT status, rul_prediction FROM sensor_data ORDER BY timestamp DESC LIMIT 1'
        );
        if (rows.length === 0) return res.json({ status: "Unknown", rul: null });
        res.json({ status: rows[0].status, rul: rows[0].rul_prediction });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");
  
  const results = [];
  let autoCycle = 1;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      let cycle = data.cycle ? Number(data.cycle) : autoCycle++;
      results.push({
        unit: data.unit || 1,
        cycle: cycle,
        temperature: Number(data.temperature),
        pressure: Number(data.pressure),
        vibration: Number(data.vibration),
        rpm: Number(data.rpm)
      });
    })
    .on('end', async () => {
        fs.unlinkSync(req.file.path);
        
        let validRows = results.filter(row => !isNaN(row.temperature) && !isNaN(row.vibration));
        if(validRows.length === 0) return res.status(400).json({ error: "Invalid CSV format or empty rows." });
        
        try {
            const predictionsList = [];
            for (let row of validRows) {
                const pred = await predictRUL(row);
                
                const [result] = await pool.execute(
                  'INSERT INTO sensor_data (unit, cycle, temperature, pressure, vibration, rpm, rul_prediction, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                  [row.unit, row.cycle, row.temperature, row.pressure, row.vibration, row.rpm, pred.rul, pred.status]
                );

                predictionsList.push({
                  id: result.insertId,
                  unit: row.unit,
                  cycle: row.cycle,
                  temperature: row.temperature,
                  pressure: row.pressure,
                  vibration: row.vibration,
                  rpm: row.rpm,
                  rul_prediction: pred.rul,
                  status: pred.status
                });
            }
            res.status(200).json({ data: predictionsList, message: "CSV processed successfully." });
        } catch(err) {
            res.status(500).json({ error: "Error predicting offline CSV." });
        }
    });
});

// Analytics — status counts and sensor averages
app.get('/analytics', async (req, res) => {
    try {
        const [counts] = await pool.execute(
          `SELECT status, COUNT(*) as count FROM sensor_data GROUP BY status`
        );
        const [avgs] = await pool.execute(
          `SELECT 
            ROUND(AVG(temperature),2) as avg_temp,
            ROUND(AVG(pressure),2) as avg_pressure,
            ROUND(AVG(vibration),3) as avg_vibration,
            ROUND(AVG(rpm),1) as avg_rpm,
            ROUND(AVG(rul_prediction),1) as avg_rul,
            COUNT(*) as total_readings
          FROM sensor_data`
        );
        res.json({ counts, averages: avgs[0] });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Logs — filtered by status
app.get('/logs', async (req, res) => {
    try {
        const status = req.query.status;
        let query = 'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 500';
        let params = [];
        if (status && ['Safe', 'Warning', 'Critical'].includes(status)) {
            query = 'SELECT * FROM sensor_data WHERE status = ? ORDER BY timestamp DESC LIMIT 500';
            params = [status];
        }
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Export — download all data as JSON
app.get('/export', async (req, res) => {
    try {
        const status = req.query.status;
        let query = 'SELECT * FROM sensor_data ORDER BY cycle ASC';
        let params = [];
        if (status && ['Safe', 'Warning', 'Critical'].includes(status)) {
            query = 'SELECT * FROM sensor_data WHERE status = ? ORDER BY cycle ASC';
            params = [status];
        }
        const [rows] = await pool.execute(query, params);
        res.setHeader('Content-Disposition', `attachment; filename=sensor_data_${status || 'all'}.json`);
        res.setHeader('Content-Type', 'application/json');
        res.json({
            exported_at: new Date().toISOString(),
            filter: status || 'all',
            total_records: rows.length,
            data: rows
        });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
