import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Trash2 } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { RealisticDentition } from './Dentition3D';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';

export function EMR() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [toothNote, setToothNote] = useState('');
    const [toothCondition, setToothCondition] = useState('Healthy');
    const [toothSurfaces, setToothSurfaces] = useState<string[]>([]);
    const [toothChartData, setToothChartData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    const { showToast } = useToast();

    const conditionsList = [
        "Healthy", "Decayed", "Missing", "Filled", "Fractured", "Impacted", "Sensitive",
        "Crown placed", "RCT done", "Bridge abutment", "Implant", "Gingival recession", "Mobility", "Abscess"
    ];
    const surfaceOptions = ["M", "D", "O", "B", "L"];

    const isPosterior = (tooth: number) => {
        const lastDigit = tooth % 10;
        return lastDigit >= 4 && lastDigit <= 8;
    };

    const handleSearch = async (e: any) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            const { data } = await supabase
                .from('patients')
                .select('*')
                .ilike('name', `%${query}%`)
                .limit(5);
            setSearchResults(data || []);
        } else {
            setSearchResults([]);
        }
    };

    const selectPatient = (patient: any) => {
        setSelectedPatient(patient);
        setSearchQuery('');
        setSearchResults([]);
    };

    useEffect(() => {
        if (selectedPatient) {
            fetchPatientChartData();
        }
    }, [selectedPatient]);

    const fetchPatientChartData = async () => {
        const { data } = await supabase
            .from('patients')
            .select('tooth_chart_data')
            .eq('id', selectedPatient.id)
            .single();

        if (data?.tooth_chart_data) {
            setToothChartData(data.tooth_chart_data);
        } else {
            setToothChartData({});
        }
    };

    const handleToothSelect = (num: number) => {
        const current = num === selectedTooth ? null : num;
        setSelectedTooth(current);
        if (current) {
            const data = toothChartData[current] || {};
            setToothCondition(data.condition || 'Healthy');
            setToothSurfaces(data.surfaces || []);
            setToothNote(data.note || '');
        }
    };

    const toggleSurface = (surf: string) => {
        setToothSurfaces(prev => prev.includes(surf) ? prev.filter(s => s !== surf) : [...prev, surf]);
    };

    const handleSaveNote = async () => {
        if (!selectedTooth || !selectedPatient) return;
        setIsSaving(true);

        const updatedChart = {
            ...toothChartData,
            [selectedTooth]: {
                condition: toothCondition,
                surfaces: toothSurfaces,
                note: toothNote
            }
        };

        const { error } = await supabase
            .from('patients')
            .update({ tooth_chart_data: updatedChart })
            .eq('id', selectedPatient.id);

        if (error) {
            showToast('Error saving clinical notes', 'error');
            console.error(error);
        } else {
            setToothChartData(updatedChart);
            showToast(`Clinical note saved for Tooth ${selectedTooth}`, 'success');
            setSelectedTooth(null);
        }
        setIsSaving(false);
    };

    const clearAllChart = async () => {
        if (!selectedPatient) return;
        if (window.confirm('Are you sure you want to clear the entire dental chart?')) {
            const { error } = await supabase
                .from('patients')
                .update({ tooth_chart_data: {} })
                .eq('id', selectedPatient.id);

            if (!error) {
                setToothChartData({});
                showToast('Dental chart cleared', 'success');
            }
        }
    };

    return (
        <div className="bg-[#f0f4f9] text-slate-900 font-display min-h-screen pb-32 relative font-sans">
            <header className="sticky top-0 z-50 px-6 py-4 flex flex-col gap-4 bg-white/80 backdrop-blur-xl mb-2 border-b border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search patient by name or ID to load EMR..."
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/80 border border-slate-200 focus:ring-2 focus:ring-primary outline-none shadow-sm"
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                            {searchResults.map(p => (
                                <div key={p.id} onClick={() => selectPatient(p)} className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{p.name}</p>
                                        <p className="text-xs text-slate-500">{p.id}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedPatient && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedPatient(null)} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 active:scale-90 transition-transform">
                                <Plus size={20} className="rotate-45" />
                            </button>
                            <div>
                                <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Patient Record</p>
                                <h2 className="text-lg font-bold text-slate-800">{selectedPatient.name}</h2>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {!selectedPatient ? (
                <div className="px-5 pt-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                        <FileText size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Select a Patient</h3>
                    <p className="text-slate-500 text-sm max-w-xs">Search for a patient using the global search bar above to load their interactive Odontogram and EMR history.</p>
                </div>
            ) : (
                <main className="px-5 space-y-6 pt-2">
                    <section>
                        <div className="flex items-end justify-between mb-4 px-1">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Ultra-Realistic 3D Odontogram</h3>
                                <p className="text-xs text-slate-500 font-medium">Interactive Precision Mapping</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-1 shadow-2xl relative overflow-hidden h-[500px] border border-slate-200">
                            <React.Suspense fallback={
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-[2rem]">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading High-Fidelity 3D Assets...</p>
                                    </div>
                                </div>
                            }>
                                <Canvas shadows camera={{ position: [0, 8, 15], fov: 45 }} style={{ borderRadius: '2rem' }}>
                                    <color attach="background" args={['#f8fafc']} />
                                    <ambientLight intensity={0.6} />
                                    <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
                                    <Environment preset="studio" />
                                    <group position={[0, -1, 0]}>
                                        <RealisticDentition
                                            selectedTooth={selectedTooth}
                                            toothChartData={toothChartData}
                                            onSelectTooth={handleToothSelect}
                                        />
                                    </group>
                                    <OrbitControls enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} minDistance={10} maxDistance={30} rotateSpeed={0.6} enableDamping={true} />
                                </Canvas>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-200 text-xs font-bold text-slate-600">
                                    Drag to Rotate • Scroll to Zoom
                                </div>
                                <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1.5 rounded-lg border border-primary/20 shadow-md">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider">{selectedTooth ? `Tooth #${selectedTooth} Selected` : 'Select a tooth (1-32)'}</span>
                                </div>
                            </React.Suspense>
                        </div>

                        {selectedTooth && (
                            <div className="mt-4 bg-white rounded-2xl p-5 border border-primary/20 shadow-premium animate-slide-up">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <FileText size={20} />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800">Tooth #{selectedTooth} Details</h4>
                                    </div>
                                    <button onClick={() => setSelectedTooth(null)} className="text-slate-400 hover:text-slate-600">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Condition</label>
                                            <select
                                                value={toothCondition}
                                                onChange={(e) => setToothCondition(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none"
                                            >
                                                {conditionsList.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        {isPosterior(selectedTooth) && (
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">Surfaces</label>
                                                <div className="flex gap-1">
                                                    {surfaceOptions.map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => toggleSurface(s)}
                                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border ${toothSurfaces.includes(s) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <textarea
                                        value={toothNote}
                                        onChange={(e) => setToothNote(e.target.value)}
                                        placeholder="Add clinical finding..."
                                        className="w-full h-20 bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none"
                                    />
                                    <div className="flex justify-between items-center pt-2">
                                        <button onClick={clearAllChart} className="px-3 py-1.5 text-red-500 text-xs font-bold hover:bg-red-50 border border-red-200 rounded-lg flex items-center gap-1">
                                            Clear All
                                        </button>
                                        <button disabled={isSaving} onClick={handleSaveNote} className="px-5 py-2.5 bg-text-dark text-white text-sm font-bold rounded-xl shadow-lg flex items-center gap-2">
                                            {isSaving ? 'Saving...' : 'Save Notes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </main>
            )}
        </div>
    );
}
