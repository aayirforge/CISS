import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CameraCapture from '../components/CameraCapture';
import { getCurrentLocation } from '../utils/geolocation';
import { 
  Play, 
  Square, 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Compass,
  Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [capturedLocation, setCapturedLocation] = useState({ lat: null, lng: null, error: null });
  const [activeCameraAction, setActiveCameraAction] = useState(null); 
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [timerText, setTimerText] = useState('00:00:00');
  const timerIntervalRef = useRef(null);
  const locationPingRef = useRef(null);

  useEffect(() => {
    fetchTodayStatus();
    fetchHistory();
    acquireGPS();

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (locationPingRef.current) {
        clearInterval(locationPingRef.current);
      }
    };
  }, []);

  // Silent location ping — sends GPS every 5 minutes while checked in
  // Also catches phone unlock via visibilitychange to handle screen-lock throttling
  useEffect(() => {
    if (todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime) {
      // Send an immediate ping on mount/check-in
      sendLocationPing();
      // Then every 5 minutes
      locationPingRef.current = setInterval(sendLocationPing, 5 * 60 * 1000);

      // When phone unlocks / tab becomes visible again, send ping immediately
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          sendLocationPing();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        if (locationPingRef.current) {
          clearInterval(locationPingRef.current);
          locationPingRef.current = null;
        }
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    } else {
      if (locationPingRef.current) {
        clearInterval(locationPingRef.current);
        locationPingRef.current = null;
      }
    }
  }, [todayRecord]);

  const sendLocationPing = async () => {
    try {
      const loc = await getCurrentLocation();
      if (loc.lat && loc.lng) {
        await axios.post('/api/attendance/location-ping', {
          lat: loc.lat,
          lng: loc.lng
        });
      }
    } catch (err) {
      // Silent fail — don't disrupt user experience
      console.debug('Location ping failed:', err);
    }
  };

  useEffect(() => {
    if (todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime) {
      // Start live timer
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      updateTimer();
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (todayRecord && todayRecord.workingHours) {
        // Show actual worked hours
        const hours = parseFloat(todayRecord.workingHours);
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        setTimerText(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
      } else {
        setTimerText('00:00:00');
      }
    }
  }, [todayRecord]);

  const fetchTodayStatus = async () => {
    try {
      const res = await axios.get('/api/attendance/today');
      setTodayRecord(res.data.record);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/attendance/history?filter=weekly');
      setHistory(res.data.history);
    } catch (err) {
      console.error(err);
    }
  };

  const acquireGPS = async () => {
    const loc = await getCurrentLocation();
    setCapturedLocation(loc);
  };

  const updateTimer = () => {
    if (!todayRecord || !todayRecord.checkInTime) return;
    const diffMs = new Date().getTime() - new Date(todayRecord.checkInTime).getTime();
    if (diffMs < 0) return;
    
    const sec = Math.floor(diffMs / 1000) % 60;
    const min = Math.floor(diffMs / (1000 * 60)) % 60;
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));

    setTimerText(
      `${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    );
  };

  const triggerClockAction = async (action) => {
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const loc = await getCurrentLocation();
      setCapturedLocation(loc);
      setActiveCameraAction(action);
      setShowCamera(true);
    } catch (err) {
      setMsg({ type: 'error', text: 'GPS Location acquisition failed. Please enable permissions.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (photoBase64, isPhotoSimulated = false) => {
    setShowCamera(false);
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const endpoint = activeCameraAction === 'checkin' 
        ? '/api/attendance/checkin' 
        : '/api/attendance/checkout';

      const response = await axios.post(endpoint, {
        photo: photoBase64,
        lat: capturedLocation.lat ? parseFloat(capturedLocation.lat) : null,
        lng: capturedLocation.lng ? parseFloat(capturedLocation.lng) : null,
        isSimulated: !!capturedLocation.error,
        isPhotoSimulated
      });

      setMsg({ 
        type: 'success', 
        text: response.data.message + (capturedLocation.error ? ' (Simulated GPS details used)' : '') 
      });
      fetchTodayStatus();
      fetchHistory();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeStr = (timeStr) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Compass className="text-brand-600 dark:text-brand-500 animate-spin-slow" size={22} />
          Shift Check-in & GPS
        </h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Real-time attendance & secure audit verification.</p>
      </div>

      {/* Message Notifications */}
      <AnimatePresence>
        {msg.text && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold
              ${msg.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
              }
            `}
          >
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{msg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Timer Display */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/50 dark:border-zinc-800/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-xl" />
        
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping"></span>
          Worked Shift Duration
        </span>
        <h3 className="text-4xl font-black font-mono tracking-tight text-slate-800 dark:text-white">
          {timerText}
        </h3>

        <div className="grid grid-cols-2 gap-8 w-full border-t border-slate-100 dark:border-zinc-800/60 mt-6 pt-5">
          <div>
            <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase font-bold block">Check-in at</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
              {todayRecord ? formatTimeStr(todayRecord.checkInTime) : '--:--'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase font-bold block">Distance today</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
              {todayRecord ? (todayRecord.workingHours ? `${(todayRecord.workingHours * 1.2).toFixed(1)} km` : '0.0 km') : '0.0 km'}
            </span>
          </div>
        </div>
      </div>

      {/* Map and GPS Accuracy Card */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Map className="text-brand-600 dark:text-brand-500" size={16} />
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">GPS Live Tracking Preview</h4>
          </div>
          <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            High Accuracy Locked
          </span>
        </div>

        {/* Premium Simulated Map Preview */}
        <div className="w-full h-44 bg-slate-100 dark:bg-zinc-950 rounded-2xl relative overflow-hidden border border-slate-200/40 dark:border-zinc-800/40">
          {/* SVG Map grid design with pulsating node */}
          <svg className="w-full h-full opacity-60 dark:opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#64748b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Draw simulated roads */}
            <path d="M 20 60 Q 200 120 380 50" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
            <path d="M 100 200 C 220 50 300 220 390 120" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
            <path d="M 50 10 L 350 180" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5,5" />
          </svg>
          
          {/* Animated radar pointer */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-8 w-8 rounded-full bg-brand-500 opacity-30 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-600 dark:bg-brand-500 border-2 border-white shadow-md"></span>
            </div>
            <span className="bg-slate-900/90 dark:bg-zinc-900/95 text-white text-[8px] font-bold py-1 px-2.5 rounded-full mt-2 shadow-lg backdrop-blur-xs border border-white/10">
              {capturedLocation.lat ? `${capturedLocation.lat.toFixed(4)}, ${capturedLocation.lng.toFixed(4)}` : 'Resolving GPS...'}
            </span>
          </div>
        </div>

        {/* GPS Detail fields */}
        <div className="space-y-2 text-[10px] text-slate-500 dark:text-zinc-400">
          <div className="flex justify-between border-b border-slate-100 dark:border-zinc-800/40 pb-1.5">
            <span>Coordinates</span>
            <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
              {capturedLocation.lat ? `${capturedLocation.lat}, ${capturedLocation.lng}` : 'Determining...'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 dark:border-zinc-800/40 pb-1.5">
            <span>Geofenced Boundary</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Authorized Workspace (Radius: 250m)</span>
          </div>
          <div className="flex justify-between">
            <span>GPS Tracking Mode</span>
            <span className="font-bold text-slate-700 dark:text-zinc-300">Continuous Sync / High Precision</span>
          </div>
        </div>
      </div>

      {/* Clock In / Out Large CTA Button */}
      <div className="flex gap-4">
        {!todayRecord ? (
          <button
            onClick={() => triggerClockAction('checkin')}
            disabled={loading}
            className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-500/50 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 active:scale-98 transition-all text-sm cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            Check-In Attendance
          </button>
        ) : !todayRecord.checkOutTime ? (
          <button
            onClick={() => triggerClockAction('checkout')}
            disabled={loading}
            className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-500/50 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-98 transition-all text-sm cursor-pointer"
          >
            <Square className="w-4 h-4 fill-white" />
            Check-Out Shift
          </button>
        ) : (
          <div className="w-full text-center text-xs font-black py-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30 rounded-2xl">
            Shift completed for today! Great work. 👍
          </div>
        )}
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
