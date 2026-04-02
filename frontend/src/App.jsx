import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  AlertTriangle, CheckCircle2, XOctagon, Activity, 
  Thermometer, Wind, Zap, Gauge, Server, Cpu, Clock, UploadCloud
} from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:5002' 
  : '';
const API_URL = `${API_BASE}/prediction`;
const UPLOAD_URL = `${API_BASE}/upload-csv`;

function App() {
  const [dataHistory, setDataHistory] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [uploadText, setUploadText] = useState('Upload CSV');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // Filter out any corrupted or old-schema data
        const validData = Array.isArray(data) ? data.filter(d => d.temperature !== undefined && d.cycle !== undefined) : [];
        if (validData.length > 0) {
            setDataHistory(validData);
            setCurrentData(validData[validData.length - 1]);
            setIsLive(true);
        } else {
            setIsLive(false);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setIsLive(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadText('Processing...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        setUploadText('Success! Data Appended.');
        setTimeout(() => setUploadText('Upload CSV'), 3000);
      } else {
        setUploadText('Error processing file');
      }
    } catch (err) {
      console.error(err);
      setUploadText('Error processing file');
    } finally {
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!currentData || !isLive) {
    return (
      <div className="flex flex-col items-center justify-center h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
        <div className="relative z-10 flex flex-col items-center p-12 glass-panel rounded-3xl text-center max-w-md w-full mx-4">
          <div className="relative w-24 h-24 mb-8 flex justify-center items-center">
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-purple-500 animate-[spin_1.5s_linear_reverse]"></div>
            <Activity className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 text-gradient">System Offline</h2>
          <p className="text-slate-400 mb-6">No data found. Upload a CSV dataset or make sure the Backend is running on Port 5002.</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status, rul) => {
    if (status === 'Critical' || rul <= 30) {
      return { 
        color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', 
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]', icon: <XOctagon className="w-10 h-10 animate-pulse" /> 
      };
    } else if (status === 'Warning' || rul <= 80) {
      return { 
        color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', 
        glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]', icon: <AlertTriangle className="w-10 h-10" /> 
      };
    }
    return { 
      color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', 
      glow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]', icon: <CheckCircle2 className="w-10 h-10" /> 
    };
  };

  const statusConfig = getStatusConfig(currentData.status, Math.round(currentData.rul_prediction || 0));
  const progressPercent = Math.min(((currentData.rul_prediction || 0) / 218) * 100, 100);

  return (
    <div className="py-8 px-4 sm:px-8 lg:px-12 max-w-[1600px] mx-auto min-h-screen flex flex-col gap-6 relative z-10">
      
      <div className="fixed inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>

      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 glass-panel p-6 sm:p-8 rounded-[2rem]">
        <div className="flex gap-6 items-center">
          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 items-center justify-center shadow-lg border border-white/10">
            <Server className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              Turbofan <span className="text-gradient">Diagnostics</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                <Cpu className="w-4 h-4" /> Unit #{currentData.unit || 1}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-slate-300">
                <Clock className="w-4 h-4" /> Cycle: {currentData.cycle || 0} / 218
              </span>
              <span className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30"></span>
                Live Stream Active
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
          <div className="flex w-full sm:w-auto">
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 font-semibold transition-all duration-300 w-full whitespace-nowrap"
            >
              <UploadCloud className={`w-5 h-5 ${isUploading ? 'animate-bounce' : ''}`} />
              {uploadText}
            </button>
          </div>
          
          <div className={`flex items-center justify-center gap-4 px-6 py-3 rounded-[1.5rem] border ${statusConfig.border} ${statusConfig.bg} ${statusConfig.glow} transition-all duration-500 w-full sm:w-auto`}>
            <div className={`${statusConfig.color}`}>{statusConfig.icon}</div>
            <div className="flex flex-col text-left">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Analysis</span>
              <span className={`text-xl font-black uppercase tracking-wide ${statusConfig.color}`}>
                {currentData.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-8 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-64 h-64 bg-current opacity-5 blur-[100px] rounded-full ${statusConfig.color}`} pointer-events-none></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="text-slate-400 font-semibold uppercase tracking-wider text-sm mb-1">RUL Prediction</h3>
                <p className="text-5xl font-black text-white flex items-baseline gap-2">
                  {Math.round(currentData.rul_prediction || 0)}
                  <span className="text-lg font-medium text-slate-500">cycles</span>
                </p>
              </div>
            </div>
            
            <div className="w-full bg-slate-800/80 rounded-full h-3 mb-2 border border-black/50 overflow-hidden relative z-10">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r relative ${
                  progressPercent > 40 ? 'from-emerald-600 to-emerald-400' : progressPercent > 15 ? 'from-amber-600 to-amber-400' : 'from-rose-600 to-rose-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              >
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-widest relative z-10">
              <span>Failed</span>
              <span>218 Cycles</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SensorCard label="Core Temp" value={(currentData.temperature || 0).toFixed(1)} unit="°C" icon={<Thermometer className="w-6 h-6 text-orange-400" />} />
            <SensorCard label="Pressure" value={(currentData.pressure || 0).toFixed(1)} unit="psia" icon={<Wind className="w-6 h-6 text-cyan-400" />} />
            <SensorCard label="Vibration" value={(currentData.vibration || 0).toFixed(2)} unit="g" icon={<Activity className="w-6 h-6 text-purple-400" />} />
            <SensorCard label="RPM" value={Math.round(currentData.rpm || 0)} unit="rpm" icon={<Zap className="w-6 h-6 text-yellow-400" />} />
          </div>
        </div>

        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-[2rem] flex flex-col h-[280px]">
             <h2 className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-4 px-2">Cycle vs RUL Trajectory</h2>
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataHistory} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRul" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="cycle" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 220]} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip unit="cycles" color="#3B82F6" />} cursor={{ stroke: '#ffffff20' }} />
                <ReferenceLine y={30} stroke="#F43F5E" strokeDasharray="3 3" strokeOpacity={0.8} />
                <Area type="monotone" dataKey="rul_prediction" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRul)" isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[240px]">
            <div className="glass-panel p-5 rounded-[2rem] flex flex-col">
              <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2 px-2">Cycle vs Temperature</h2>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataHistory} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis dataKey="cycle" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unit="°C" color="#f97316" />} />
                  <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="glass-panel p-5 rounded-[2rem] flex flex-col">
              <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2 px-2">Cycle vs Vibration</h2>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataHistory} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis dataKey="cycle" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 1.2]} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unit="g" color="#a855f7" />} />
                  <Line type="monotone" dataKey="vibration" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SensorCard({ label, value, unit, icon }) {
  return (
    <div className="glass-card rounded-[1.5rem] p-5 flex flex-col justify-between min-h-[120px] relative overflow-hidden">
      <div className="flex justify-between items-start z-10 relative">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="p-2 bg-white/5 rounded-xl border border-white/5 shadow-inner">{icon}</div>
      </div>
      <div className="mt-2 z-10 relative">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white">{value}</span>
          <span className="text-xs font-medium text-slate-500">{unit}</span>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, unit, color }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Cycle {label}</p>
        <p className="text-white flex items-center gap-2 text-sm font-medium">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></span>
          <span className="font-bold">{typeof val === 'number' ? val.toFixed(2) : val}</span> {unit}
        </p>
      </div>
    );
  }
  return null;
};

export default App;
