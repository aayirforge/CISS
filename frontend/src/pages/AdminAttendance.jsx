import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Search, MapPin, Eye, X, Navigation, Radio, Users, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAttendance() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Live location state
  const [liveLocations, setLiveLocations] = useState([]);
  const [selectedLiveUser, setSelectedLiveUser] = useState(null);
  const [showLivePanel, setShowLivePanel] = useState(false);
  const liveIntervalRef = useRef(null);

  useEffect(() => {
    fetchLogs();
  }, [date, deptFilter]);

  // Auto-refresh live locations every 30 seconds
  useEffect(() => {
    fetchLiveLocations();
    liveIntervalRef.current = setInterval(fetchLiveLocations, 30000);
    return () => { if (liveIntervalRef.current) clearInterval(liveIntervalRef.current); };
  }, []);

  const fetchLogs = async () => {
    try {
      let url = `/api/attendance/logs?date=${date}`;
      if (deptFilter) url += `&department=${deptFilter}`;
      const res = await axios.get(url);
      setLogs(res.data.logs);
    } catch (err) { console.error(err); }
  };

  const fetchLiveLocations = async () => {
    try {
      const res = await axios.get('/api/attendance/live-locations');
      setLiveLocations(res.data.liveLocations || []);
    } catch (err) { console.error(err); }
  };

  const filteredLogs = logs.filter(log =>
    log.user?.fullName.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const formatTimeStr = (timeStr) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeSince = (dateStr) => {
    if (!dateStr) return 'N/A';
    const diffMs = new Date() - new Date(dateStr);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const isPingFresh = (dateStr) => {
    if (!dateStr) return false;
    return (new Date() - new Date(dateStr)) < 10 * 60 * 1000; // < 10 min
  };

  const handleTrackLive = (log) => {
    const live = liveLocations.find(l => l.userId === log.userId);
    if (live) {
      setSelectedLiveUser(live);
      setSelectedRoute(null);
      setShowLivePanel(true);
    } else {
      setSelectedRoute(log);
      setSelectedLiveUser(null);
      setShowLivePanel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Attendance Monitoring</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Real-time check-in coordinates, verify facial scans, and audit routes history</p>
        </div>
        {/* Live Tracking Toggle */}
        <button
          onClick={() => { setShowLivePanel(!showLivePanel); if (!showLivePanel) { setSelectedRoute(null); fetchLiveLocations(); } }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            showLivePanel
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 text-slate-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
          }`}
        >
          <Radio size={14} className={showLivePanel ? 'animate-pulse' : ''} />
          Live Tracking ({liveLocations.length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Search size={14} /></span>
            <input type="text" placeholder="Search name or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none" />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs px-3 py-2 text-slate-700 dark:text-zinc-300">
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Accounts">Accounts</option>
            <option value="Sales">Sales</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs px-3 py-2 text-slate-700 dark:text-zinc-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Logs Table Card */}
        <div className="lg:col-span-3 glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50">
          <h3 className="font-bold text-slate-850 dark:text-zinc-250 mb-4 text-xs">Shift Details</h3>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-zinc-850 text-slate-400 dark:text-zinc-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-2">Employee</th>
                  <th className="py-3 px-2">Check In</th>
                  <th className="py-3 px-2">Check Out</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Photos</th>
                  <th className="py-3 px-2 text-right">Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40">
                {filteredLogs.map((log) => {
                  const isActive = !log.checkOutTime;
                  const hasLive = liveLocations.some(l => l.userId === log.userId);
                  return (
                    <tr key={log.id} className="text-slate-700 dark:text-zinc-300">
                      <td className="py-3.5 px-2">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-zinc-150">{log.user?.fullName}</span>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 block mt-0.5">{log.user?.employeeId} | {log.user?.department}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-zinc-200">{formatTimeStr(log.checkInTime)}</div>
                          <div className="text-[8px] text-slate-400 dark:text-zinc-500 truncate max-w-[100px]" title={log.checkInLat ? `${log.checkInLat}, ${log.checkInLng}` : (log.checkInAddress || 'N/A')}>{log.checkInLat ? `${log.checkInLat}, ${log.checkInLng}` : (log.checkInAddress || 'N/A')}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        {log.checkOutTime ? (
                          <div>
                            <div className="font-bold text-slate-800 dark:text-zinc-200">{formatTimeStr(log.checkOutTime)}</div>
                            <div className="text-[8px] text-slate-400 dark:text-zinc-500 truncate max-w-[100px]" title={log.checkOutLat ? `${log.checkOutLat}, ${log.checkOutLng}` : (log.checkOutAddress || 'N/A')}>{log.checkOutLat ? `${log.checkOutLat}, ${log.checkOutLng}` : (log.checkOutAddress || 'N/A')}</div>
                          </div>
                        ) : <span className="text-slate-400 dark:text-zinc-555">--:--</span>}
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase
                            ${log.status === 'Present' && 'bg-emerald-500/10 text-emerald-600'}
                            ${log.status === 'Late' && 'bg-amber-500/10 text-amber-600'}
                            ${log.status === 'Half Day' && 'bg-rose-500/10 text-rose-600'}
                            ${log.status === 'Overtime' && 'bg-blue-500/10 text-blue-600'}
                          `}>{log.status}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-bold uppercase tracking-wide flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              On Shift
                            </span>
                          )}
                          {log.isOutOfBounds && (
                            log.user?.department === 'Sales' || log.user?.department === 'Operations' || log.user?.designation?.toLowerCase().includes('field') ? (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[8px] font-bold uppercase tracking-wide">Field Duty</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 text-[8px] font-bold uppercase tracking-wide">Off-Site</span>
                            )
                          )}
                          {(log.checkInSimulated || log.checkOutSimulated) && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 text-[8px] font-bold uppercase tracking-wide">Simulated</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex gap-1">
                          {log.checkInPhoto && (
                            <button onClick={() => setSelectedPhoto(log.checkInPhoto)}
                              className="px-2 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-lg text-[9px] font-bold cursor-pointer">In</button>
                          )}
                          {log.checkOutPhoto && (
                            <button onClick={() => setSelectedPhoto(log.checkOutPhoto)}
                              className="px-2 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-lg text-[9px] font-bold cursor-pointer">Out</button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {isActive && hasLive ? (
                          <button onClick={() => handleTrackLive(log)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 cursor-pointer text-[9px] font-bold">
                            <Radio size={11} className="animate-pulse" /> Live
                          </button>
                        ) : (
                          <button onClick={() => { setSelectedRoute(log); setSelectedLiveUser(null); setShowLivePanel(false); }}
                            className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 dark:hover:bg-brand-950/40 text-brand-600 dark:text-brand-400 inline-flex items-center cursor-pointer">
                            <Navigation size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan="6" className="py-6 text-center text-slate-400 dark:text-zinc-500">No logs found for this filter criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar — Live Location Panel OR Route Panel */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-fit">

          {showLivePanel ? (
            /* ========== LIVE LOCATION TRACKING PANEL ========== */
            <>
              <h3 className="font-bold text-slate-800 dark:text-zinc-200 mb-3 text-xs flex items-center gap-1.5">
                <Radio size={16} className="text-emerald-500 animate-pulse" />
                Live Employee Tracker
                <span className="ml-auto text-[8px] font-bold text-slate-400 dark:text-zinc-500">Auto-refresh 30s</span>
              </h3>

              {/* Active employees list */}
              <div className="max-h-[280px] overflow-y-auto space-y-2 mb-3 pr-1" style={{ scrollbarWidth: 'thin' }}>
                {liveLocations.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-slate-400 dark:text-zinc-500 text-xs px-4">
                    <div>
                      <Users size={28} className="mx-auto mb-2 opacity-40" />
                      <p className="font-bold">No Active Shifts</p>
                      <p className="text-[10px] mt-1">Employees will appear here after check-in</p>
                    </div>
                  </div>
                ) : (
                  liveLocations.map((loc) => {
                    const fresh = isPingFresh(loc.lastPingAt);
                    const isSelected = selectedLiveUser?.userId === loc.userId;
                    return (
                      <motion.button key={loc.userId} layout
                        onClick={() => setSelectedLiveUser(loc)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200/30 dark:border-zinc-700/30 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-black text-slate-800 dark:text-zinc-200">{loc.fullName}</div>
                            <div className="text-[8px] text-slate-400 dark:text-zinc-500">{loc.employeeId} • {loc.department}</div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={`w-2 h-2 rounded-full ${fresh ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span className={`text-[7px] font-bold ${fresh ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {getTimeSince(loc.lastPingAt)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                          <MapPin size={10} />
                          {loc.currentLat?.toFixed(5)}, {loc.currentLng?.toFixed(5)}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Selected user map view */}
              {selectedLiveUser ? (
                <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-25" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-white">{selectedLiveUser.fullName}</span>
                      <span className="text-[8px] font-bold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> TRACKING
                      </span>
                    </div>
                    {/* Mini map visualization */}
                    <div className="w-full h-80 bg-slate-900 border border-slate-800/60 rounded-xl relative flex items-center justify-center">
                      {/* Check-in pin */}
                      <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
                        <div className="w-2.5 h-2.5 bg-emerald-600 border border-white rounded-full flex items-center justify-center text-[5px] text-white font-bold">In</div>
                        <span className="text-[6px] text-emerald-400 font-bold mt-0.5">Check In</span>
                      </div>
                      {/* Dashed line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line x1="25%" y1="25%" x2="70%" y2="65%" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4" opacity="0.6" />
                      </svg>
                      {/* Current live position */}
                      <div className="absolute bottom-1/4 right-[20%] flex flex-col items-center">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-ping absolute opacity-40" />
                        <div className="w-3 h-3 bg-cyan-500 border-2 border-white rounded-full relative z-10" />
                        <span className="text-[6px] text-cyan-400 font-bold mt-0.5">Now</span>
                      </div>
                    </div>
                    {/* Coordinate details */}
                    <div className="mt-2.5 space-y-1 text-[11px] text-slate-400 font-mono bg-slate-900/50 p-2 border border-slate-800/40 rounded-xl">
                      <div><strong className="text-slate-300">Check-in:</strong> {selectedLiveUser.checkInLat?.toFixed(5)}, {selectedLiveUser.checkInLng?.toFixed(5)} @ {formatTimeStr(selectedLiveUser.checkInTime)}</div>
                      <div><strong className="text-cyan-400 font-bold">Current:</strong> {selectedLiveUser.currentLat?.toFixed(5)}, {selectedLiveUser.currentLng?.toFixed(5)} • {getTimeSince(selectedLiveUser.lastPingAt)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-zinc-800/50 rounded-2xl p-4 text-center text-[10px] text-slate-400 dark:text-zinc-500">
                  Select an employee above to view their live location
                </div>
              )}
            </>
          ) : (
            /* ========== ORIGINAL ROUTE PANEL ========== */
            <>
              <h3 className="font-bold text-slate-800 dark:text-zinc-200 mb-4 text-xs flex items-center gap-1.5">
                <MapPin size={16} className="text-brand-600 dark:text-brand-500" />
                GPS Route Map
              </h3>
              <div className="flex-1 bg-slate-950 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-25" />
                {selectedRoute ? (
                  <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                    <div className="text-white">
                      <h4 className="font-bold text-xs">{selectedRoute.user?.fullName}</h4>
                      <p className="text-[8px] text-slate-400">Date: {selectedRoute.date}</p>
                    </div>
                    <div className="w-full h-80 bg-slate-900 border border-slate-800/60 rounded-xl relative flex items-center justify-center">
                      <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
                        <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping absolute" />
                        <div className="w-3.5 h-3.5 bg-emerald-600 border border-white rounded-full relative z-10 flex items-center justify-center text-[7px] text-white font-bold">In</div>
                        <span className="text-[8px] text-emerald-400 font-bold mt-1">Check In</span>
                      </div>
                      {selectedRoute.checkOutTime && (
                        <>
                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <line x1="25%" y1="25%" x2="75%" y2="75%" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="5" />
                          </svg>
                          <div className="absolute bottom-1/4 right-1/4 flex flex-col items-center">
                            <div className="w-3.5 h-3.5 bg-rose-600 border border-white rounded-full relative z-10 flex items-center justify-center text-[7px] text-white font-bold">Out</div>
                            <span className="text-[8px] text-rose-400 font-bold mt-1">Check Out</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-400 bg-slate-900/70 p-2.5 border border-slate-800 rounded-xl font-mono">
                      <div><strong>Check-in:</strong> {selectedRoute.checkInLat || '28.6139'}, {selectedRoute.checkInLng || '77.2090'}</div>
                      {selectedRoute.checkOutTime && (
                        <div><strong>Check-out:</strong> {selectedRoute.checkOutLat || '28.6210'}, {selectedRoute.checkOutLng || '77.2185'}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 m-auto text-center text-slate-500 text-xs max-w-[180px]">
                    Click the navigation button on any attendance row to plot GPS route tracking.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 cursor-pointer" onClick={() => setSelectedPhoto(null)}>
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Verification Scan" className="w-full object-cover aspect-square" />
            <div className="p-4 flex justify-between items-center text-xs">
              <span className="text-slate-400 dark:text-zinc-500">Captured Face Verification Scan</span>
              <button onClick={() => setSelectedPhoto(null)} className="px-3.5 py-1.5 bg-slate-50 dark:bg-zinc-800 rounded-xl font-bold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
