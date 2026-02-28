import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { RealisticDentition } from './Dentition3D';

export function EMR() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [toothNote, setToothNote] = useState('');
    const [toothRecords, setToothRecords] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Mock search function
    const handleSearch = (e: any) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            // Mock patient results
            setSearchResults([
                { id: 'PT-10001', name: 'Sarah Jenkins', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRAQoCaIyGyp0i3ux3o11BsZYPhk3AWJOJ4sEojISYG8rj9w6vI9rhQB76JQOvqzPhX6IXho4s4joEuYAHX8N5pgkC5bieZFDfqZLXIrv4FWG1MeXEivJMdxkuXUSy6seMjtuvw1c-6Ka6EzC4NCDyVUQY_Ikj9BDV_t4XmSMWEkn5Q7U2JOQL-HtEg6BApDcyaiFn5p1GcpvgeMO7bN1KnkUE2v6I7ECYiV2IOCon-_n2AmQK9pXgnCZH2blnAYpT7POG6uvslXTm' },
                { id: 'PT-10002', name: 'Marcus Wright', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBefO1nSPs19pvvakJgyaUTP9QSfE8owsUzRoU7siHB0qP9n_v-caDlyD89D88pLtu8iLZHiPHixH32rY5qkjLGujxViv7GSKTB0M1mrZZJNnrXYfpc2amncY0aP6q-BNcSVCnPxiK3y8z1DGxAyKkolTkWRR7iHMAbG3Dg0vND5CZB7RNMNew0Rjov-Pok5sQZBsKD7YlWakE5OEbN2Z-U2vNNzUR3ezJ0EEGYJmGllHd52kj0SOdx6z10rfZ61wxr6O6LV78d1n6B' }
            ].filter(p => p.name.toLowerCase().includes(query.toLowerCase())));
        } else {
            setSearchResults([]);
        }
    };

    const selectPatient = (patient: any) => {
        setSelectedPatient(patient);
        setSearchQuery('');
        setSearchResults([]);
        // Mock loading tooth records
        const cached = localStorage.getItem(`toothRecords_${patient.id}`);
        if (cached) setToothRecords(JSON.parse(cached));
        else setToothRecords([]);
    };

    const handleSaveNote = () => {
        if (!selectedPatient || !selectedTooth || !toothNote) return;
        setIsSaving(true);
        setTimeout(() => {
            const newRecord = {
                id: Date.now().toString(),
                patient_id: selectedPatient.id,
                tooth_number: selectedTooth,
                note_text: toothNote,
                color_indicator: 'has_note',
                record_date: new Date().toISOString()
            };
            const updated = [...toothRecords, newRecord];
            setToothRecords(updated);
            localStorage.setItem(`toothRecords_${selectedPatient.id}`, JSON.stringify(updated));
            setToothNote('');
            setIsSaving(false);
            setSelectedTooth(null);
        }, 500);
    };



    return (
        <div className="bg-[#f0f4f9] text-slate-900 font-display min-h-screen pb-32 relative font-sans">

            <header className="sticky top-0 z-50 px-6 py-4 flex flex-col gap-4 glass-panel mb-2">
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
                                    <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
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
                            <button onClick={() => setSelectedPatient(null)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 active:scale-90 transition-transform">
                                <span className="material-symbols-outlined text-xl">chevron_left</span>
                            </button>
                            <div>
                                <p className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">Patient Record</p>
                                <h2 className="text-lg font-bold text-slate-800">{selectedPatient.name}</h2>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="w-11 h-11 rounded-2xl border-2 border-white overflow-hidden shadow-lg ring-1 ring-black/5">
                                <img alt={selectedPatient.name} className="w-full h-full object-cover" src={selectedPatient.photo} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                        </div>
                    </div>
                )}
            </header>

            {!selectedPatient ? (
                <div className="px-5 pt-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                        <span className="material-symbols-outlined text-4xl">patient_list</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Select a Patient</h3>
                    <p className="text-slate-500 text-sm max-w-xs">Search for a patient using the global search bar above to load their interactive Odontogram, EMR, and timeline history.</p>
                </div>
            ) : (
                <main className="px-5 space-y-6 pt-2">
                    <section>
                        <div className="flex items-end justify-between mb-4 px-1">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Ultra-Realistic 3D Odontogram</h3>
                                <p className="text-xs text-slate-500 font-medium">Interactive Precision Mapping</p>
                            </div>
                            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-premium">
                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-bold text-primary tracking-wide">WebGL SCAN ENGINE</span>
                            </div>
                        </div>

                        <div className="glass-panel rounded-[2rem] p-1 shadow-2xl relative overflow-hidden h-[500px] border border-slate-200">
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

                                    {/* Clinical Studio Lighting */}
                                    <ambientLight intensity={0.6} />
                                    <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
                                    <spotLight position={[-10, 20, -10]} angle={0.2} penumbra={0.5} intensity={0.8} />
                                    <directionalLight position={[0, -10, 0]} intensity={0.2} />

                                    <Environment preset="studio" />

                                    <group position={[0, -1, 0]}>
                                        <RealisticDentition
                                            selectedTooth={selectedTooth}
                                            onSelectTooth={(num) => setSelectedTooth(num === selectedTooth ? null : num)}
                                        />
                                        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={20} blur={2.5} far={10} />
                                    </group>

                                    <OrbitControls
                                        enablePan={false}
                                        minPolarAngle={Math.PI / 4}
                                        maxPolarAngle={Math.PI / 1.5}
                                        minDistance={10}
                                        maxDistance={30}
                                        rotateSpeed={0.6}
                                        enableDamping={true}
                                    />
                                </Canvas>

                                {/* Overlay UI elements for the Canvas */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">360</span>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Drag to Rotate • Scroll to Zoom</span>
                                </div>
                                <div className="absolute top-4 left-4 bg-primary/10 backdrop-blur text-primary px-3 py-1.5 rounded-lg border border-primary/20">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider">{selectedTooth ? `Tooth #${selectedTooth} Selected` : 'Select a tooth (1-32)'}</span>
                                </div>
                            </React.Suspense>
                        </div>

                        {selectedTooth && (
                            <div className="mt-4 glass-panel rounded-2xl p-5 border border-primary/20 animate-slide-up">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">Tooth {selectedTooth} Note</h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <textarea
                                        value={toothNote}
                                        onChange={(e) => setToothNote(e.target.value)}
                                        placeholder="Add clinical finding or treatment plan for this tooth..."
                                        className="w-full h-24 bg-white/60 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <div className="flex justify-end">
                                        <button disabled={isSaving || !toothNote} onClick={handleSaveNote} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 hover:bg-primary-hover">
                                            {isSaving ? 'Saving...' : 'Save Note'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {toothRecords.length > 0 && !selectedTooth && (
                            <div className="mt-4 glass-panel rounded-2xl p-5 border-t-white/80">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-amber-600 text-xl">notes</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">Recent Findings</h4>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {toothRecords.slice(-3).reverse().map(record => (
                                        <div key={record.id} className="bg-white/60 border border-white/80 rounded-xl p-3 shadow-inner">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">T-{record.tooth_number}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(record.record_date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed italic">"{record.note_text}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                </main>
            )}

            <style>{`
                .glass-panel {
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 0 8px 32px 0 rgba(31,38,135,0.07);
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                }
            `}</style>
        </div>
    );
}
