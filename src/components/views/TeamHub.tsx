import { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Users, Clock, CheckCircle, XCircle, Download, QrCode, 
    Coffee, Play, FileText, Table, Calendar, ChevronRight,
    Search, Filter, UserCog, History, TrendingUp, AlertCircle, MapPin
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as faceapi from 'face-api.js';
import { Modal } from '../../components/Modal';

const ROLES = ['All', 'Doctor', 'Practice Manager', 'Nurse', 'Receptionist', 'Hygienist'];

export function TeamHub({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [view, setView] = useState<'roster' | 'history'>('roster');
    const [staff, setStaff] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [today] = useState(new Date().toISOString().split('T')[0]);
    const [selectedRole, setSelectedRole] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showQR, setShowQR] = useState(false);
    const [showStaffDetails, setShowStaffDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [clockingId, setClockingId] = useState<number | null>(null);
    const [stats, setStats] = useState<any>({ total_days: 0, total_hours: 0, total_leaves: 0 });
    const [branches, setBranches] = useState<any[]>([]);
    const [activeStaff, setActiveStaff] = useState<any>(null);

    useEffect(() => {
        const fetchActiveStaff = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (user && userRole === 'staff') {
                  const { data } = await supabase.from('staff').select('*').eq('id', user.id).maybeSingle();
                  if (data) setActiveStaff(data);
             }
        };
        if (userRole === 'staff') fetchActiveStaff();
    }, [userRole]);
    
    // Face-api States
    const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [scanningStaff, setScanningStaff] = useState<any>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [livenessTask, setLivenessTask] = useState<'none' | 'blink'>('none');
    const [hasBlinked, setHasBlinked] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const getEAR = (eye: any[]) => {
        const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        return (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * dist(eye[0], eye[3]));
    };

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setIsFaceApiLoaded(true);
            } catch (err) {
                console.error('Failed to load Face Recognition models:', err);
            }
        };
        loadModels();
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        const { data } = await supabase.from('branches').select('*');
        if (data) setBranches(data);
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // radius in metres
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // metres
    };

    const startCamera = async () => {
        if (!videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
            videoRef.current.srcObject = stream;
        } catch (err) {
            showToast('Unable to access camera: ' + (err as Error).message, 'error');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    useEffect(() => {
        if (isScanning && scanningStaff) {
            setIsVerified(false);
            setHasBlinked(false);
            setLivenessTask('none');
            startCamera();
            const interval = setInterval(handleFaceScan, 300); // Faster sampling
            return () => {
                clearInterval(interval);
                stopCamera();
            };
        }
    }, [isScanning, scanningStaff]);

    const handleFaceScan = async () => {
        if (!videoRef.current || !scanningStaff?.face_descriptor || isVerified) return;

        const detections = await faceapi.detectSingleFace(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detections) {
            const { landmarks, descriptor } = detections;
            const box = detections.detection.box;
            
            // 1. Distance Check (Face size relative to 320x240)
            if (box.width < 100) {
                setScanMessage('Come closer to camera');
                return;
            }
            if (box.width > 220) {
                setScanMessage('Too close. Move back.');
                return;
            }

            // 2. Lighting/Confidence Check
            if (detections.detection.score < 0.6) {
                setScanMessage('Low light or unclear view');
                return;
            }

            // 3. Face Match Check
            const matchScore = faceapi.euclideanDistance(descriptor, scanningStaff.face_descriptor);
            if (matchScore > 0.45) {
                // User requirement: Say clearly it's not the right person for this profile
                setScanMessage('ACCESS DENIED: Face mismatch. You are not the authorized user.');
                return;
            }

            // 4. Liveness Task (Blink Detection)
            if (livenessTask === 'none') {
                setLivenessTask('blink');
                setScanMessage('Liveness Check: Blink your eyes');
                return;
            }

            if (livenessTask === 'blink' && !hasBlinked) {
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();
                const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2;
                
                // EAR < 0.22 usually means eyes are closed/blinking
                if (ear < 0.22) {
                    setHasBlinked(true);
                    setScanMessage('Blink detected! Verifying...');
                } else {
                    setScanMessage('Please blink naturally');
                }
                return;
            }

            // 5. Final Success
            if (hasBlinked) {
                setIsVerified(true);
                setScanMessage('Verification Successful!');
                setTimeout(() => {
                    executeCheckIn(scanningStaff, true, matchScore);
                    setIsScanning(false);
                    setScanningStaff(null);
                }, 1500);
            }
        } else {
            setScanMessage('Detecting face geometry...');
            setLivenessTask('none');
            setHasBlinked(false);
        }
    };

    const executeCheckIn = async (staff: any, faceVerified: boolean, matchScore: number) => {
        setClockingId(staff.id);
        const activeLog = getStaffLog(staff.id);

        if (activeLog && activeLog.status === 'Checked-in' && !activeLog.clock_out) {
            // ── Check Out Action ──
            const clockOutTime = new Date();
            const clockInTime = new Date(activeLog.clock_in);
            const workingHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

            const { error } = await supabase.from('attendance_logs').update({
                clock_out: clockOutTime.toISOString(),
                status: 'Checked-out',
                working_hours: parseFloat(workingHours.toFixed(2)),
                face_verified: faceVerified,
                face_match_score: parseFloat(matchScore.toFixed(4))
            }).eq('id', activeLog.id);

            if (!error) {
                showToast(`Shift ended successfully. Hours: ${workingHours.toFixed(1)}h`, 'success');
                fetchLogs();
            } else {
                showToast('Check-out failed', 'error');
            }
            setClockingId(null);
            return;
        }

        // ── Check In Action ──
        const { error } = await supabase.from('attendance_logs').insert({
            staff_id: staff.id,
            clock_in: new Date().toISOString(),
            date: today,
            status: 'Checked-in',
            method: 'Face-api.js',
            face_verified: faceVerified,
            face_match_score: parseFloat(matchScore.toFixed(4)),
            location_verified: true
        });

        if (!error) {
            showToast('Shift started successfully (Geo-fenced)', 'success');
            fetchLogs();
        } else {
            showToast('Check-in failed', 'error');
        }
        setClockingId(null);
    };

    useEffect(() => {
        fetchStaff();
        fetchLogs();
        if (view === 'history' || userRole === 'staff') fetchHistory();

        const channel = supabase.channel('attendance-live-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
                fetchLogs();
                if (view === 'history' || userRole === 'staff') fetchHistory();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [view, userRole]);

    useEffect(() => {
        if (showStaffDetails) {
            fetchStaffStats(showStaffDetails.id);
        }
    }, [showStaffDetails]);

    const fetchStaffStats = async (staffId: string | number) => {
        const { data: logsData } = await supabase
            .from('attendance_logs')
            .select('working_hours')
            .eq('staff_id', staffId)
            .not('clock_out', 'is', null);

        const { count: leaveCount } = await supabase
            .from('staff_leaves')
            .select('*', { count: 'exact' })
            .eq('staff_id', staffId);

        const totalHours = logsData?.reduce((acc, curr) => acc + Number(curr.working_hours || 0), 0) || 0;
        setStats({
            total_days: logsData?.length || 0,
            total_hours: totalHours.toFixed(1),
            total_leaves: leaveCount || 0
        });
    };

    const fetchStaff = async () => {
        const { data } = await supabase.from('staff').select('*').order('name');
        if (data) setStaff(data);
    };

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('attendance_logs')
            .select('*, staff(name, role, staff_external_id)')
            .eq('date', today)
            .order('clock_in', { ascending: false });
        if (data) setLogs(data);
    };

    const fetchHistory = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('attendance_logs')
            .select('*, staff(name, role, staff_external_id)')
            .order('date', { ascending: false })
            .limit(100);
        if (data) setHistory(data);
        setLoading(false);
    };

    const getStaffLog = (staffId: number) => logs.find(l => l.staff_id === staffId);

    const handleCheckIn = async (staff: any) => {
        if (!isFaceApiLoaded) return showToast('Initializing face scanning metrics, wait...', 'warning');
        setClockingId(staff.id);

        if (!navigator.geolocation) {
            showToast('Browser lacks GPS nodes', 'error');
            setClockingId(null);
            return;
        }

        setScanMessage('Verifying GPS Coordinates...');
        showToast('Acquiring location permission...', 'info');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const currentLat = position.coords.latitude;
                const currentLng = position.coords.longitude;

                let targetLat = 0, targetLng = 0, targetRadius = 100;
                let locationName = "the branch";

                if (staff.assigned_location_type === 'custom') {
                    targetLat = parseFloat(staff.custom_latitude);
                    targetLng = parseFloat(staff.custom_longitude);
                    targetRadius = staff.custom_radius || 100;
                    locationName = "your assigned custom location";
                } else if (staff.assigned_location_type === 'branch') {
                    const branch = branches.find(b => b.id === staff.assigned_location_id);
                    if (branch) {
                        targetLat = branch.latitude;
                        targetLng = branch.longitude;
                        targetRadius = branch.radius || 100;
                        locationName = branch.name;
                    }
                } else {
                    const defaultBranch = branches.find(b => b.is_default);
                    if (defaultBranch) {
                        targetLat = defaultBranch.latitude;
                        targetLng = defaultBranch.longitude;
                        targetRadius = defaultBranch.radius || 100;
                        locationName = defaultBranch.name;
                    }
                }

                if (!targetLat || !targetLng) {
                    showToast('Admin has not configured valid GPS references', 'error');
                    setClockingId(null);
                    return;
                }

                const distance = calculateDistance(currentLat, currentLng, targetLat, targetLng);
                const isWithinRange = distance <= targetRadius;

                if (!isWithinRange) {
                    // Specific message requested by user: "நீங்க இந்த லொகேஷன்ல இல்ல.. லொகேஷன் வந்துட்டு அட்டனன்ஸ் போடுங்க"
                    const errorMsg = `ACCESS DENIED: You are not at ${locationName}. Please arrive at the designated location to punch attendance. (Dist: ${distance.toFixed(0)}m)`;
                    showToast(errorMsg, 'error');
                    setClockingId(null);
                    return;
                }

                if (!staff.face_descriptor) {
                    showToast('No enrolled face descriptor. Reverting to manual check-in.', 'warning');
                    executeCheckIn(staff, false, 0);
                    return;
                }

                setScanningStaff(staff);
                setIsScanning(true);
                setScanMessage('GPS Verified. Initializing face scan...');
                setClockingId(null);
            },
            (err) => {
                const errorMap: Record<number, string> = {
                    1: "Location permission denied. Please enable GPS access in browser settings.",
                    2: "Position unavailable. Check your internet/GPS connection.",
                    3: "Request timed out while acquiring GPS signal."
                };
                showToast('Geo-coordinates failed: ' + (errorMap[err.code] || err.message), 'error');
                setClockingId(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleCheckOut = async (logId: string, staffId: number) => {
        setClockingId(staffId);
        const now = new Date();
        const { error } = await supabase.from('attendance_logs')
            .update({ 
                clock_out: now.toISOString(),
                status: 'Checked-out'
            })
            .eq('id', logId);
        
        if (!error) {
            showToast('Shift ended and recorded', 'success');
            fetchLogs();
        }
        setClockingId(null);
    };

    const handleToggleBreak = async (log: any) => {
        setClockingId(log.staff_id);
        const now = new Date().toISOString();
        const isOnBreak = log.status === 'On Break';
        
        let update: any = {};
        if (!isOnBreak) {
            update = { status: 'On Break', break_start: now };
        } else {
            const start = new Date(log.break_start).getTime();
            const end = new Date(now).getTime();
            const additionalMinutes = Math.round((end - start) / 60000);
            update = { 
                status: 'Checked-in', 
                break_end: now,
                total_break_minutes: (log.total_break_minutes || 0) + additionalMinutes
            };
        }

        const { error } = await supabase.from('attendance_logs')
            .update(update)
            .eq('id', log.id);

        if (!error) {
            showToast(isOnBreak ? 'Break ended' : 'On break', 'info');
            fetchLogs();
        }
        setClockingId(null);
    };

    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchesRole = selectedRole === 'All' || s.role === selectedRole;
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                (s.staff_external_id || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesRole && matchesSearch;
        });
    }, [staff, selectedRole, searchQuery]);

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Staff Attendance Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = (view === 'history' ? history : logs).map(l => [
            l.staff?.name || 'Unknown',
            l.staff?.staff_external_id || '-',
            l.date,
            l.clock_in ? new Date(l.clock_in).toLocaleTimeString() : '-',
            l.clock_out ? new Date(l.clock_out).toLocaleTimeString() : 'Active',
            `${l.total_break_minutes || 0}m`,
            l.working_hours ? `${l.working_hours}h` : '-'
        ]);

        autoTable(doc, {
            startY: 35,
            head: [['Staff Name', 'ID', 'Date', 'Check-in', 'Check-out', 'Break', 'Total Hours']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: '#135bec', textColor: 255 }
        });

        doc.save(`Attendance_Report_${today}.pdf`);
        showToast('PDF Report Downloaded', 'success');
    };

    const exportToExcel = () => {
        const headers = ['Staff Name', 'Staff ID', 'Date', 'Check-in', 'Check-out', 'Break Minutes', 'Total Working Hours', 'Status'];
        const dataRows = (view === 'history' ? history : logs).map(l => [
            l.staff?.name,
            l.staff?.staff_external_id,
            l.date,
            l.clock_in ? new Date(l.clock_in).toISOString() : '',
            l.clock_out ? new Date(l.clock_out).toISOString() : '',
            l.total_break_minutes || 0,
            l.working_hours || 0,
            l.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + dataRows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Attendance_Export_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        showToast('CSV Exported for Excel', 'success');
    };

    if (userRole === 'staff' && activeStaff) {
        const log = getStaffLog(activeStaff.id);
        const staffHistory = history.filter(h => h.staff_id === activeStaff.id);
        
        return (
            <div className="animate-slide-up space-y-6 pb-20 max-w-lg mx-auto p-4">
                <div className="text-center py-12 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-3xl">
                    <h3 className="text-xl font-black mb-1">Punch Attendance</h3>
                    <p className="text-[10px] text-slate-400 font-bold mb-8 uppercase tracking-wider">Coordinates Location + Face Scan</p>
                    
                     <button 
                          onClick={() => handleCheckIn(activeStaff)}
                          disabled={clockingId === activeStaff.id}
                          className={`w-36 h-36 rounded-full flex flex-col items-center justify-center gap-2 border-4 text-white font-black text-[12px] uppercase shadow-2xl transition-all mx-auto duration-500 hover:scale-105 active:scale-95 disabled:opacity-50 ${
                              log && !log.clock_out ? 'bg-rose-500 border-rose-400 shadow-rose-500/40' : 'bg-emerald-500 border-emerald-400 shadow-emerald-500/40'
                          }`}
                     >
                         {log && !log.clock_out ? <XCircle size={36} /> : <CheckCircle size={36} />}
                         <span>{log && !log.clock_out ? 'Check Out' : 'Check In'}</span>
                    </button>
                    {log && !log.clock_out && (
                        <p className="text-[11px] font-bold text-slate-500 mt-5 flex items-center justify-center gap-1.5"><Clock size={12} /> Shift started at {new Date(log.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    )}
                </div>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6">
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-main)' }}><History size={18} /> Attendance History</h3>
                    <div className="space-y-3">
                         {staffHistory.length === 0 && (
                             <p className="text-center text-xs text-slate-400 py-12 font-medium">No attending records found setup.</p>
                         )}
                         {staffHistory.map((h, i) => (
                             <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/3 rounded-2xl border border-slate-100 dark:border-white/5">
                                 <div>
                                     <p className="text-xs font-black">{h.date}</p>
                                     <p className="text-[10px] text-slate-400 font-medium mt-1">{new Date(h.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {h.clock_out ? new Date(h.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Active'}</p>
                                 </div>
                                 {h.working_hours ? (
                                     <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">{h.working_hours}h</span>
                                 ) : (
                                     <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">Active</span>
                                 )}
                             </div>
                         ))}
                    </div>
                </div>


            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Team Management</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">
                            <Users size={10} /> {staff.length} Members
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-primary/20">
                            <Clock size={10} /> Active Now: {logs.filter(l => l.status === 'Checked-in').length}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setView(view === 'roster' ? 'history' : 'roster')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all border shadow-sm ${view === 'history' ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}>
                        {view === 'history' ? <Users size={16} /> : <History size={16} />}
                        {view === 'history' ? 'Live Roster' : 'Attendance History'}
                    </button>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                        <button onClick={exportToPDF} title="Export PDF" className="p-2.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-rose-500"><FileText size={18} /></button>
                        <button onClick={exportToExcel} title="Export Excel" className="p-2.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-emerald-500"><Table size={18} /></button>
                    </div>
                </div>
            </div>

            {/* View Navigation & Filters */}
            {view === 'roster' && (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        {ROLES.map(role => (
                            <button key={role} onClick={() => setSelectedRole(role)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${selectedRole === role ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10 hover:border-primary/50'}`}>
                                {role}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <input 
                            type="text" placeholder="Search staff or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-10 py-3 text-sm font-medium outline-none focus:border-primary active:scale-[0.98] transition-all"
                        />
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>
            )}

            {/* Main Roster View */}
            {view === 'roster' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredStaff.map(s => {
                        const log = getStaffLog(s.id);
                        const status = log?.status || 'Offline';
                        const isClockedIn = status === 'Checked-in';
                        const isOnBreak = status === 'On Break';
                        const isOut = status === 'Checked-out';
                        const isBusy = isClockedIn || isOnBreak;

                        return (
                            <div key={s.id} 
                                className={`p-6 rounded-[2.5rem] border flex flex-col justify-between gap-6 transition-all duration-300 relative group overflow-hidden ${isBusy ? 'border-primary/20 shadow-xl shadow-primary/5' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-white/10'}`}
                                style={isBusy ? { background: isDark ? 'rgba(19,91,236,0.05)' : 'rgba(19,91,236,0.02)' } : {}}>
                                
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl transition-all shadow-inner ${isBusy ? 'bg-primary text-white rotate-3 scale-105' : 'bg-slate-100 dark:bg-white/5 text-primary'}`}>
                                            {s.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base flex items-center gap-2">
                                                {s.name}
                                                <button onClick={() => { setSelectedStaff(s); setShowQR(true); }} className="text-slate-300 hover:text-primary transition-all"><QrCode size={14} /></button>
                                            </h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.role} • {s.staff_external_id || `#${s.id}`}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : isOnBreak ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                                                <span className={`text-[10px] font-bold ${isClockedIn ? 'text-emerald-500' : isOnBreak ? 'text-amber-500' : 'text-slate-400'}`}>{status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowStaffDetails(s)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"><ChevronRight size={18} /></button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {!isBusy ? (
                                        <button onClick={() => handleCheckIn(s.id)} disabled={clockingId === s.id}
                                            className="col-span-2 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                            {clockingId === s.id ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Play size={14} fill="currentColor" />}
                                            Start Shift
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => handleToggleBreak(log)} disabled={clockingId === s.id}
                                                className={`py-4 rounded-2xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border ${isOnBreak ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-white/5 text-amber-600 border-amber-200 dark:border-amber-500/20'}`}>
                                                <Coffee size={14} />
                                                {isOnBreak ? 'End Break' : 'Break'}
                                            </button>
                                            <button onClick={() => handleCheckOut(log.id, s.id)} disabled={clockingId === s.id || isOnBreak}
                                                className="py-4 bg-rose-500 text-white rounded-2xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50">
                                                <XCircle size={14} />
                                                End Shift
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* History View Table */}
            {view === 'history' && (
                <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Detailed Attendance Log</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 italic">Showing last 100 entries</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Shift Window</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Breaks</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Work Hours</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 animate-pulse">Synchronizing records...</td></tr>
                                ) : history.map(l => (
                                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">{l.staff?.name?.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-bold">{l.staff?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500">{l.staff?.role} • {l.staff?.staff_external_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium">{new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold flex items-center gap-2">
                                                {l.clock_in ? new Date(l.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                                                <ChevronRight size={12} className="text-slate-300" />
                                                {l.clock_out ? new Date(l.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">{l.total_break_minutes || 0}m</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-primary">
                                            {l.working_hours ? `${l.working_hours} h` : '--'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${l.status === 'Checked-in' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {l.location_verified ? (
                                                <span className="text-emerald-500 flex items-center gap-1 text-[10px] font-bold"><MapPin size={10} /> Verified</span>
                                            ) : (
                                                <span className="text-slate-400 text-[10px] font-bold">Manual</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {l.face_verified ? (
                                                <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-1"><CheckCircle size={10} /> Match {typeof l.face_match_score === 'number' ? ((1 - l.face_match_score) * 100).toFixed(0) : '100'}%</span>
                                            ) : (
                                                <span className="text-slate-400 text-[10px] font-bold">Unverified</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Attendance Analytics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Present</p>
                    <div className="flex items-end justify-between">
                        <h5 className="text-4xl font-sans font-black text-emerald-600">{logs.length}</h5>
                        <TrendingUp size={24} className="text-emerald-500/30" />
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Absent</p>
                    <div className="flex items-end justify-between">
                        <h5 className="text-4xl font-sans font-black text-rose-600">{Math.max(0, staff.length - logs.length)}</h5>
                        <AlertCircle size={24} className="text-rose-500/30" />
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Avg. Shift</p>
                    <div className="flex items-end justify-between">
                        <h5 className="text-4xl font-sans font-black text-primary">8.5h</h5>
                        <Clock size={24} className="text-primary/30" />
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Total Ops</p>
                    <div className="flex items-end justify-between">
                        <h5 className="text-4xl font-sans font-black text-amber-600">{staff.filter(s => s.role === 'Doctor').length}</h5>
                        <UserCog size={24} className="text-amber-500/30" />
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQR && selectedStaff && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowQR(false)}>
                    <div className={`p-10 rounded-[3rem] border shadow-2xl text-center max-w-sm w-full animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                            <Users size={40} />
                        </div>
                        <h3 className="font-bold text-xl mb-1">{selectedStaff.name}</h3>
                        <p className={`text-xs font-bold mb-8 uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedStaff.role}</p>
                        
                        <div className="bg-white p-6 rounded-[2rem] inline-block shadow-premium border-4 border-primary/20">
                            <QRCodeSVG value={`DENTORA-ID:${selectedStaff.staff_external_id}`} size={180} />
                        </div>
                        
                        <div className="mt-8 space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unique Digital ID</p>
                             <h4 className="text-lg font-black text-primary font-mono">{selectedStaff.staff_external_id}</h4>
                        </div>

                        <div className="flex gap-3 mt-10">
                            <button onClick={async () => {
                                const svg = document.querySelector('.qr-container svg') as SVGGraphicsElement;
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement("canvas");
                                    const svgSize = svg.getBoundingClientRect();
                                    canvas.width = 500;
                                    canvas.height = 500;
                                    const ctx = canvas.getContext("2d");
                                    const img = new Image();
                                    img.onload = () => {
                                        ctx?.drawImage(img, 0, 0, 500, 500);
                                        const pngFile = canvas.toDataURL("image/png");
                                        const downloadLink = document.createElement("a");
                                        downloadLink.download = `QR_${selectedStaff.name.replace(/\s+/g, '_')}.png`;
                                        downloadLink.href = `${pngFile}`;
                                        downloadLink.click();
                                    };
                                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                }
                            }} className="flex-1 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                                <Download size={14} /> Save QR
                            </button>
                            <button onClick={() => setShowQR(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all">Dismiss</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Detailed View Modal */}
            {showStaffDetails && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setShowStaffDetails(null)}>
                    <div className={`p-10 rounded-[3.5rem] border shadow-2xl max-w-2xl w-full animate-slide-up overflow-hidden ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-primary text-white flex items-center justify-center font-bold text-3xl">
                                    {showStaffDetails.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">{showStaffDetails.name}</h3>
                                    <p className="text-sm font-bold text-primary">{showStaffDetails.role}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Hired on: {new Date(showStaffDetails.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Index</p>
                                <p className="text-lg font-mono font-black text-primary">{showStaffDetails.staff_external_id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-10">
                            <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-3xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Days</p>
                                <p className="text-xl font-black">{stats.total_days}</p>
                            </div>
                            <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-3xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Hours</p>
                                <p className="text-xl font-black">{stats.total_hours}</p>
                            </div>
                            <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-3xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">On Leaves</p>
                                <p className="text-xl font-black text-rose-500">{stats.total_leaves}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Professional Stats</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/3 rounded-2xl border border-black/5">
                                    <span className="text-xs font-bold text-slate-500">Attendance Rate</span>
                                    <span className="text-sm font-black text-emerald-500 text-right">98%</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/3 rounded-2xl border border-black/5">
                                    <span className="text-xs font-bold text-slate-500">Punctuality Score</span>
                                    <span className="text-sm font-black text-primary text-right">A+ (9.4/10)</span>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setShowStaffDetails(null)} className="mt-10 w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover shadow-xl shadow-primary/30 transition-all">Close Profile View</button>
                    </div>
                </div>
            )}
            {isScanning && scanningStaff && (
                <Modal
                    isOpen={isScanning}
                    onClose={() => { setIsScanning(false); setScanningStaff(null); }}
                    title="AI Face Verification"
                >
                    <div className="space-y-6 p-6 flex flex-col items-center">
                        <div className={`relative w-72 h-72 rounded-[3.5rem] overflow-hidden border-8 transition-all duration-500 shadow-2xl bg-black flex items-center justify-center ${isVerified ? 'border-emerald-500 scale-105 shadow-emerald-500/20' : 'border-primary'}`}>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]" 
                            />
                            {!isVerified && (
                                <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-[2.5rem] m-8 animate-pulse pointer-events-none flex items-center justify-center">
                                    <div className="w-48 h-48 border-2 border-primary/20 rounded-full animate-ping" />
                                </div>
                            )}
                            {isVerified && (
                                <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-700">
                                    <div className="bg-white rounded-full p-4 shadow-xl animate-bounce">
                                        <CheckCircle className="text-emerald-500" size={48} />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center space-y-2 w-full">
                            <div className={`text-xs font-black uppercase tracking-[0.2em] py-2 px-4 rounded-full inline-block ${isVerified ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'}`}>
                                {isVerified ? 'Session Authenticated' : 'Live Scanner Active'}
                            </div>
                            <h4 className={`text-lg font-bold transition-colors ${isVerified ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {scanMessage}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {isVerified ? 'Identity Match confirmed' : 'AI Node: Processing Landmarks...'}
                            </p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
