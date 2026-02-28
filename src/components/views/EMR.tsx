import { Activity, Mic, ShieldAlert, FileText, Send, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '../Toast';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, RoundedBox, Html } from '@react-three/drei';
import { supabase } from '../../supabase';

// Helper to use Speech Recognition API
function useVoiceDictation(onResult: (text: string) => void, onError: (err: any) => void) {
    const [recording, setRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let currentText = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentText += event.results[i][0].transcript;
                }
                onResult(currentText);
            };

            recognition.onend = () => {
                if (recording) recognition.start();
            };

            recognition.onerror = (event: any) => {
                onError(event.error);
                setRecording(false);
            };

            recognitionRef.current = recognition;
        }
    }, [recording, onResult, onError]);

    const toggle = () => {
        if (!recording) {
            setRecording(true);
            if (recognitionRef.current) recognitionRef.current.start();
        } else {
            setRecording(false);
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    };

    return { recording, toggle };
}

function AIAssistant({ contextNotes, selectedTooth }: { contextNotes: any[], selectedTooth: number | null }) {
    const { showToast } = useToast();
    const [query, setQuery] = useState("");
    const [chat, setChat] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: 'Hello Doctor. I am your LLaMA-based Clinical Assistant. I can analyze case notes, recommend treatments, or answer medical queries. How can I help?' }
    ]);
    const { recording, toggle } = useVoiceDictation((t) => setQuery(t), (e) => showToast(`Voice Error: ${e}`, 'error'));

    // Trigger AI finding based on tooth selection
    useEffect(() => {
        if (selectedTooth) {
            const historyForTooth = contextNotes.filter(n => n.tooth === selectedTooth || n.notes?.includes(`Tooth ${selectedTooth}`));

            let aiMsg = `I see you selected Tooth #${selectedTooth}. `;
            if (historyForTooth.length > 0) {
                aiMsg += `This tooth has existing clinical history: "${historyForTooth[0].notes || historyForTooth[0].text}". Considering the notes, recommend evaluating for endodontic retreatment or composite restoration fracture.`;
            } else {
                aiMsg += `No prior history found. Ensure a periapical radiograph is taken if patient reports pain.`;
            }

            setChat(prev => [...prev, { role: 'ai', text: aiMsg }]);
        }
    }, [selectedTooth, contextNotes]);

    const handleSend = () => {
        if (!query.trim()) return;
        setChat(prev => [...prev, { role: 'user', text: query }]);
        const userQ = query.toLowerCase();

        setTimeout(() => {
            let reply = "Based on standard protocols, consider a comprehensive exam and full mouth series radiographs.";
            if (userQ.includes('recommend') || userQ.includes('what should i do')) {
                const combinedNotes = contextNotes.map(n => n.notes || n.text).join(' ');
                reply = `Analyzing Case Notes: "${combinedNotes.substring(0, 50)}..." -> Protocol suggests prophylactic scaling and fluoride application, followed by evaluating suspected carious lesions on posterior teeth.`;
            } else if (userQ.includes('penicillin') || userQ.includes('allergy')) {
                reply = "Warning: If the patient is allergic to Penicillin, standard alternatives for dental infections include Clindamycin 300mg QID or Azithromycin 500mg. Please verify patient records.";
            } else if (userQ.includes('rct') || userQ.includes('root canal')) {
                reply = "For irreversible pulpitis or necrotic pulp, Root Canal Therapy is indicated. Recommended steps: 1. Isolate tooth 2. Access prep 3. Extirpate pulp 4. BMP 5. Obturate with gutta percha.";
            }

            setChat(prev => [...prev, { role: 'ai', text: reply }]);
        }, 1000);
        setQuery("");
    };

    return (
        <div className="bg-surface border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg text-text-dark">AI Clinical Assistant</h3>
                        <p className="text-xs text-text-muted font-medium">Powered by MedLLaMA-3</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 custom-scrollbar">
                {chat.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-white ml-8 shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-700 mr-8'}`}>
                            {msg.role === 'ai' && <ShieldAlert size={14} className="inline mr-1 text-primary mb-0.5" />}
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 relative mt-auto">
                <button onClick={toggle} className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${recording ? 'bg-alert text-white animate-pulse' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}>
                    <Mic size={16} />
                </button>
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask standard of care, dictation, recommendations..."
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
                <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-full transition-colors">
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}

// 3D Rendering dependencies
import { Cylinder } from '@react-three/drei';

function Tooth3D({ position, active, hovered, setHovered, onClick, number, isLower, hasNote }: any) {
    const scale = active ? 1.2 : (hovered ? 1.1 : 1);
    const color = active ? '#3B82F6' : (hasNote ? '#F87171' : (hovered ? '#e2e8f0' : '#fcfcfc'));

    return (
        <group position={position} scale={scale} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }} onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <group rotation={[isLower ? Math.PI : 0, 0, 0]}>
                <RoundedBox args={[0.5, 0.6, 0.5]} radius={0.1} smoothness={4} position={[0, 0.3, 0]}>
                    <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
                </RoundedBox>
                <Cylinder args={[0.2, 0.05, 0.7, 16]} position={[0, -0.35, 0]}>
                    <meshStandardMaterial color={color} roughness={0.6} />
                </Cylinder>
            </group>
            {(active || hasNote) && (
                <Html position={[0, isLower ? -1.2 : 1.2, 0]} center zIndexRange={[100, 0]}>
                    <div className={`px-2 py-0.5 rounded shadow-premium text-[10px] whitespace-nowrap font-bold ${active ? 'bg-primary text-white animate-bounce' : 'bg-red-500 text-white'}`}>
                        #{number} {hasNote && !active ? '❗' : ''}
                    </div>
                </Html>
            )}
        </group>
    );
}

function InteractiveOdontogram({ selectedTooth, setSelectedTooth, toothNotes, saveToothNote }: any) {
    // removed unused showToast for odondogram
    const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
    const [localNote, setLocalNote] = useState("");

    // Universal Numbering System 1-32
    const upperTeeth = Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 15) * Math.PI;
        const x = Math.cos(angle) * 2.5;
        const z = -Math.sin(angle) * 1.5;
        return { id: 16 - i, position: [x, 0.8, z] as [number, number, number], isLower: false }; // 1 to 16
    });

    const lowerTeeth = Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 15) * Math.PI;
        const x = Math.cos(angle) * 2.3;
        const z = -Math.sin(angle) * 1.3 - 0.2;
        return { id: 17 + i, position: [x, -0.8, z] as [number, number, number], isLower: true }; // 17 to 32
    });

    const teethNodes = [...upperTeeth, ...lowerTeeth];

    useEffect(() => {
        if (selectedTooth) {
            const extNote = toothNotes.find((n: any) => n.tooth === selectedTooth);
            setLocalNote(extNote ? extNote.notes : "");
        }
    }, [selectedTooth, toothNotes]);

    const handleSaveNote = () => {
        if (selectedTooth) {
            saveToothNote(selectedTooth, localNote);
        }
    };

    return (
        <div className="bg-[#1a1c23] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full relative group min-h-[400px]">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
                <h3 className="font-display font-bold text-lg text-white tracking-widest uppercase shadow-sm">3D Odontogram (Universal)</h3>
            </div>

            <div className="flex-1 w-full relative">
                <Canvas camera={{ position: [0, 4, 8], fov: 45 }} className="w-full h-full relative z-10">
                    <ambientLight intensity={0.6} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                    <Environment preset="city" />

                    <group position={[0, -0.5, 0]}>
                        {teethNodes.map((t) => (
                            <Tooth3D
                                key={t.id}
                                number={t.id}
                                position={t.position}
                                active={selectedTooth === t.id}
                                hovered={hoveredTooth === t.id}
                                setHovered={(val: boolean) => setHoveredTooth(val ? t.id : null)}
                                onClick={() => setSelectedTooth(t.id)}
                                isLower={t.isLower}
                                hasNote={toothNotes.some((n: any) => n.tooth === t.id)}
                            />
                        ))}
                    </group>
                    <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
                </Canvas>
            </div>

            <div className="bg-[#242831] p-4 flex gap-4 items-center border-t border-slate-700/50">
                {selectedTooth ? (
                    <div className="flex-1 animate-slide-up bg-slate-800 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold text-sm">Tooth #{selectedTooth} Selected</span>
                            <button onClick={handleSaveNote} className="text-xs flex items-center gap-1 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded font-bold transition-colors">
                                <Check size={12} /> Save Note
                            </button>
                        </div>
                        <textarea
                            value={localNote}
                            onChange={(e) => setLocalNote(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-300 outline-none focus:border-primary resize-none h-16"
                            placeholder="Add clinical observation for this tooth e.g. Caries on distal surface."
                        ></textarea>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 font-medium italic w-full text-center py-4">Click any tooth on the 3D model to add specific clinical notes.</p>
                )}
            </div>
        </div>
    );
}

// Emr Component Integration
export function EMR() {
    const { showToast } = useToast();
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [newGeneralNote, setNewGeneralNote] = useState("");
    const patientId = "PT-10001"; // Target specific patient context if needed
    const { recording, toggle } = useVoiceDictation((t) => setNewGeneralNote(t), (e) => showToast(e, 'error'));

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        const { data } = await supabase.from('case_notes').select('*').limit(50);
        if (data) setNotes(data);
    };

    const saveToothNote = async (toothNum: number, noteText: string) => {
        if (!noteText.trim()) return;
        await supabase.from('case_notes').insert({
            patient_id: patientId,
            notes: `Tooth #${toothNum}: ${noteText}`,
            pending_treatments: ''
        });
        showToast(`Saved note for Tooth #${toothNum}`, 'success');
        fetchNotes();
    };

    const addGeneralNote = async () => {
        if (!newGeneralNote.trim()) return;
        await supabase.from('case_notes').insert({
            patient_id: patientId,
            notes: newGeneralNote,
            pending_treatments: ''
        });
        setNewGeneralNote("");
        showToast("General clinical note added to timeline.", "success");
        fetchNotes();
    };

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
                <div className="flex items-center gap-6">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150" alt="Patient" className="w-16 h-16 rounded-full object-cover shadow-sm bg-slate-100" />
                    <div>
                        <h2 className="text-2xl font-display font-bold text-text-dark tracking-tight">Active EMR Console</h2>
                        <div className="text-sm font-medium text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Use Global Search above to switch patients.</span>
                        </div>
                    </div>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <button onClick={() => showToast('Connecting to secure Teledentistry room...')} className="w-full md:w-auto px-5 py-2.5 bg-primary hover:bg-primary-hover transition-colors text-white text-sm font-bold rounded-lg shadow-premium">Start Teledentistry Sync</button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-h-[500px]">
                <AIAssistant contextNotes={notes} selectedTooth={selectedTooth} />
                <InteractiveOdontogram selectedTooth={selectedTooth} setSelectedTooth={setSelectedTooth} toothNotes={notes} saveToothNote={saveToothNote} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h3 className="font-display font-bold text-lg text-text-dark">Global Case Timeline (Saved)</h3>
                        <div className="flex w-full sm:w-auto gap-2 relative">
                            <button onClick={toggle} className={`absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-primary ${recording ? 'text-alert animate-pulse' : ''}`}>
                                <Mic size={14} />
                            </button>
                            <input
                                type="text"
                                placeholder="Add general case note..."
                                value={newGeneralNote}
                                onChange={(e) => setNewGeneralNote(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addGeneralNote()}
                                className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:border-primary flex-1 min-w-[250px]"
                            />
                            <button onClick={addGeneralNote} className="bg-slate-100 hover:bg-slate-200 border-slate-200 border text-slate-700 font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">Save</button>
                        </div>
                    </div>

                    <div className="border-l-2 border-slate-200 ml-4 space-y-6 pb-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {notes.length === 0 ? <p className="text-slate-500 italic pl-6 py-4">No case notes found yet. Describe the complaint or click a 3D tooth to start.</p> : notes.slice().reverse().map((ev: any, i) => (
                            <div key={ev.id} className={`relative pl-8 transition-opacity ${i > 0 ? 'opacity-70 group hover:opacity-100' : ''}`}>
                                <div className={`absolute w-3 h-3 rounded-full border-2 border-white left-[-8px] shadow-sm ${i === 0 ? 'bg-primary' : 'bg-slate-400 group-hover:bg-slate-500'}`}></div>
                                <p className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider">{new Date(ev.created_at).toLocaleString()}</p>
                                <div className={`p-4 rounded-xl border ${i === 0 ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-slate-50 border-slate-100 shadow-sm transition-colors group-hover:border-slate-300'}`}>
                                    <p className={`text-sm leading-relaxed ${i === 0 ? 'text-text-dark font-medium' : 'text-slate-600 font-medium'}`}>{ev.notes}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-display font-bold text-lg text-text-dark mb-4">Smart Actions</h3>
                        <div className="space-y-3">
                            <button onClick={() => showToast('Generated valid e-Prescription PDF', 'success')} className="w-full flex justify-between items-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors group text-sm font-bold text-slate-700">
                                <span className="flex items-center gap-2"><FileText size={16} className="text-blue-500" /> Generate E-Prescription</span>
                            </button>
                            <button onClick={() => showToast('Automated Recall Added for 6 months', 'success')} className="w-full flex justify-between items-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors group text-sm font-bold text-slate-700">
                                <span className="flex items-center gap-2"><Activity size={16} className="text-green-500" /> Set Automated Recall</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
