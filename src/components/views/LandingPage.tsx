import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Landing3D from './Landing3D';
import {
    Activity, ArrowRight, ShieldCheck, Heart, Sparkles, ChevronRight,
    Smartphone, Download, Tablet, CheckCircle, Menu, X, Play,
    Clock, Users, BarChart2, Star, Quote
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LANDING PAGE COMPONENT
   Highly Animated, Ultra-Futuristic Light Theme
   ═══════════════════════════════════════════════════ */

export function LandingPage({ onStartLogin }: { onStartLogin: () => void }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-page text-main overflow-x-hidden relative" style={{ background: 'var(--bg-page)' }}>
            {/* Ambient Background Grid & Orbs */}
            <div className="mesh-gradient-bg" />
            <div className="corner-glow" />

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${scrolled ? 'backdrop-blur-md bg-white/70 shadow-sm border-b border-white/40' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center p-2 shadow-lg shadow-primary/20 flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--primary), #00C8FF)' }}>
                            <Activity className="text-white w-full h-full" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-black text-xl tracking-tight text-dark">Dentora</h1>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-muted">Clinic Manager</p>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('features')} className="text-sm font-bold text-muted hover:text-primary transition-colors">Features</button>
                        <button onClick={() => scrollToSection('simplification')} className="text-sm font-bold text-muted hover:text-primary transition-colors">Efficiency</button>
                        <button onClick={() => scrollToSection('pricing')} className="text-sm font-bold text-muted hover:text-primary transition-colors">Pricing</button>
                        <button onClick={() => scrollToSection('download')} className="text-sm font-bold text-muted hover:text-primary transition-colors">Mobile App</button>
                    </div>

                    {/* Action Button */}
                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={onStartLogin} className="px-5 py-2.5 rounded-xl font-bold text-sm text-primary bg-primary/10 hover:bg-primary/20 transition-all active:scale-95">
                            Login
                        </button>
                        <button onClick={onStartLogin} className="btn-primary" style={{ padding: '0.625rem 1.5rem', borderRadius: '0.875rem' }}>
                            Get Started
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden text-dark" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Dropdown */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 bg-white shadow-lg border-b p-6 flex flex-col gap-4 md:hidden"
                        >
                            <button onClick={() => scrollToSection('features')} className="text-left font-bold text-muted p-2">Features</button>
                            <button onClick={() => scrollToSection('simplification')} className="text-left font-bold text-muted p-2">Efficiency</button>
                            <button onClick={() => scrollToSection('pricing')} className="text-left font-bold text-muted p-2">Pricing</button>
                            <button onClick={() => scrollToSection('download')} className="text-left font-bold text-muted p-2">Mobile App</button>
                            <hr />
                            <button onClick={onStartLogin} className="btn-primary w-full text-center">Login / Sign Up</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* 1. HERO SECTION */}
            <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 overflow-hidden">
                <Landing3D />
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left content */}
                    <div className="lg:col-span-6 flex flex-col items-start gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                        >
                            <Sparkles className="text-primary w-4 h-4" />
                            <span className="text-xs font-bold text-primary tracking-wide">Next-Gen Dental Intelligence</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-dark leading-[1.1]"
                        >
                            Run Your Clinic <br />
                            <span className="text-gradient">With Just One Hand.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-base md:text-lg text-muted max-w-lg font-medium leading-relaxed"
                        >
                            Dentora simplifies everything. Whether you are a solo practitioner or a multi-doctor facility, do away with paper maps and manage patients, bills, and diagnostics through one effortless portal.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
                        >
                            <button onClick={onStartLogin} className="btn-primary flex items-center justify-center gap-2 text-base">
                                Start Free Trial <ChevronRight size={18} />
                            </button>
                            <button className="px-6 py-3.5 rounded-xl font-bold text-sm text-dark bg-white shadow-sm border hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-95">
                                <Play size={16} className="fill-current text-primary" /> Watch Demo
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-4 mt-2 pt-4 border-t border-slate-100"
                        >
                            <div className="flex -space-x-2.5">
                                {[12, 23, 34, 45].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                                        <img src={`https://i.pravatar.cc/80?u=${i}`} alt="user" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs font-black text-dark">Loved by practitioners</p>
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                                    <span className="text-[10px] ml-1.5 font-bold text-muted">4.9/5 (1k+ reviews)</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right visual - 3D Perspective Card effect */}
                    <div className="lg:col-span-6 flex justify-center relative perspective-[1000px]">
                        <motion.div
                            initial={{ opacity: 0, rotateY: 15, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, rotateY: 0, scale: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            whileHover={{ rotateY: -5, rotateX: 5, scale: 1.02 }}
                            className="relative w-full aspect-video md:aspect-[4/3] max-w-xl rounded-2xl shadow-2xl glass-2 overflow-hidden border border-white/40"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Dashboard Mockup Content */}
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-md p-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"><Activity className="text-white w-4 h-4" /></div>
                                        <span className="font-black text-sm text-dark">Dentora Cloud</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col">
                                        <span className="text-[10px] font-bold text-muted">Vitals Scan</span>
                                        <span className="text-lg font-black text-dark">98.5%</span>
                                        <div className="w-full h-1 bg-primary/20 rounded-full mt-2"><div className="w-4/5 h-full bg-primary rounded-full" /></div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col">
                                        <span className="text-[10px] font-bold text-muted">In Clinic</span>
                                        <span className="text-lg font-black text-dark">14 Patients</span>
                                        <span className="text-[9px] text-emerald-600 font-bold mt-1">▲ 12% today</span>
                                    </div>
                                </div>
                                <div className="flex-1 p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col gap-3">
                                    <span className="text-xs font-bold text-dark">Live Diagnostics (AI)</span>
                                    <div className="w-full h-full bg-slate-200/50 rounded-lg flex items-center justify-center p-4">
                                        {/* CSS 3D Tooth style from index.css */}
                                        <div className="w-16 h-16 rounded-full tooth-3d flex items-center justify-center cursor-pointer animate-bounce">
                                            <span className="text-[10px] font-black text-blue-600">3-D</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-primary/20 filter blur-2xl -z-10" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 2. THE ONE-MAN SIMPLIFICATION CONCEPT */}
            <section id="simplification" className="py-20 px-6 bg-slate-50/50 border-y border-slate-100 relative">
                <div className="absolute inset-0 bg-mesh-1" style={{ opacity: 0.2 }} />
                <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center p-3 text-primary shadow-inner">
                        <Users className="w-full h-full" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-dark tracking-tight leading-tight">
                        A Single Man Operation? <br />
                        <span className="text-gradient">No Staff, No Overhead required.</span>
                    </h2>
                    <p className="text-muted font-medium max-w-2xl leading-relaxed">
                        Say goodbye to desk queues and paperwork. Dentora uses automated patient kiosks, seamless AI SOAP notes, and automated billing allowing you to treat patients with maximum speed and minimum stress. **You are entirely self-sufficient.**
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full text-left">
                        {[
                            { icon: Clock, title: "Automated Kiosk", desc: "Patients register and pay on their own on a tablet, freeing you up completely." },
                            { icon: Sparkles, title: "AI Prescriptions", desc: "Just point, click, and tap. Auto EMR builds documentation while you consult." },
                            { icon: Activity, title: "Zero Data Entry", desc: "Syncs instantly with accounting. No manual spreadsheets or audit headaches." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-5 rounded-2xl bg-white shadow-sm border border-slate-100 flex flex-col gap-3 hover:shadow-md transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><item.icon size={20} /></div>
                                <h3 className="font-bold text-dark">{item.title}</h3>
                                <p className="text-xs text-muted leading-relaxed font-medium">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. CORE FEATURES BENTO SECTION */}
            <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16 flex flex-col items-center gap-4">
                    <span className="text-primary font-black uppercase text-xs tracking-widest">Intelligent Framework</span>
                    <h2 className="text-3xl md:text-5xl font-black text-dark tracking-tight">The Ecosystem designed for speed.</h2>
                    <p className="text-muted font-medium max-w-xl">Highly advanced tooling structured beautifully to be accessible within a click or gesture.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Feature 1: Main Highlight (6 cols) */}
                    <div className="md:col-span-12 lg:col-span-7 bento-card p-8 flex flex-col md:flex-row gap-8 items-center bg-white/40">
                        <div className="flex-1 flex flex-col gap-4 text-left">
                            <Star className="text-amber-500 w-8 h-8" />
                            <h3 className="text-2xl font-black text-dark tracking-tight">Advanced EMR Core</h3>
                            <p className="text-sm text-muted font-medium leading-relaxed">
                                Experience clinical efficiency that breathes elegance. Smart charting syncs tooth presets instantly with insurance and finance codes without delay overlays securely.
                            </p>
                            <ul className="flex flex-col gap-2 pt-2">
                                <li className="flex items-center gap-2 text-xs font-bold text-slate-700"><CheckCircle size={14} className="text-primary" /> Visual 3-D Charting Mapping</li>
                                <li className="flex items-center gap-2 text-xs font-bold text-slate-700"><CheckCircle size={14} className="text-primary" /> Live vitals warning overrides</li>
                                <li className="flex items-center gap-2 text-xs font-bold text-slate-700"><CheckCircle size={14} className="text-primary" /> One-click billing templates</li>
                            </ul>
                        </div>
                        <div className="flex-1 w-full bg-slate-100/80 rounded-2xl h-64 flex items-center justify-center p-4 border border-slate-200/50">
                            <div className="p-4 rounded-xl glass-2 aspect-square flex items-center justify-center bg-white w-2/3 shadow-2xl">
                                <Activity size={32} className="text-primary animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Smart Dash Grid (5 cols) */}
                    <div className="md:col-span-6 lg:col-span-5 bento-card p-8 flex flex-col gap-4 text-left justify-between bg-white/40">
                        <BarChart2 className="text-emerald-500 w-8 h-8" />
                        <div>
                            <h3 className="text-xl font-bold text-dark tracking-tight">Live Clinic Accounting</h3>
                            <p className="text-xs text-muted font-medium leading-relaxed mt-1">
                                No third-party tally integration needed. Realtime cash inflows, outstanding balances, and daily tallies at your fingertips.
                            </p>
                        </div>
                        <div className="h-24 bg-emerald-50 rounded-xl flex items-end gap-2 p-3 mt-4">
                            {[40, 60, 45, 80, 55, 90, 100].map((h, i) => (
                                <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} className="flex-1 bg-emerald-500 rounded-md" />
                            ))}
                        </div>
                    </div>

                    {/* Feature 3: Analytics (4 cols) */}
                    <div className="md:col-span-6 lg:col-span-4 bento-card p-6 flex flex-col gap-3 text-left bg-white/40">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500"><ShieldCheck size={20} /></div>
                        <h4 className="font-bold text-dark">Sterilization Tracker</h4>
                        <p className="text-xs text-muted font-medium">Auto-log autoclave cycles instantly to maintain ISO safety standard certificates.</p>
                    </div>

                    {/* Feature 4: TeleConsult (4 cols) */}
                    <div className="md:col-span-6 lg:col-span-4 bento-card p-6 flex flex-col gap-3 text-left bg-white/40">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500"><Smartphone size={20} /></div>
                        <h4 className="font-bold text-dark">TeleDental Suite</h4>
                        <p className="text-xs text-muted font-medium">Embedded HD structural calls for quick consultations or remote checkups.</p>
                    </div>

                    {/* Feature 5: Inventory (4 cols) */}
                    <div className="md:col-span-6 lg:col-span-4 bento-card p-6 flex flex-col gap-3 text-left bg-white/40">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"><Clock size={20} /></div>
                        <h4 className="font-bold text-dark">Smart Inventory</h4>
                        <p className="text-xs text-muted font-medium">Track supplier supplies correctly using scanning logs. Never run out of materials.</p>
                    </div>
                </div>
            </section>

            {/* 4. COMPETITOR SHOWCASE (BATTLEGROUND) */}
            <section className="py-20 px-6 bg-slate-50 border-t border-slate-100">
                <div className="max-w-4xl mx-auto flex flex-col items-center gap-10">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-dark tracking-tight">Why switch to Dentora?</h2>
                        <p className="text-muted text-sm font-medium mt-1">We don't do standard. We do hyper-fluid efficiency.</p>
                    </div>

                    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b">
                                    <th className="p-4 font-black text-sm text-dark">Capabilities</th>
                                    <th className="p-4 font-black text-sm text-center text-slate-400">Old EMRs</th>
                                    <th className="p-4 font-black text-sm text-center text-primary bg-primary/5">Dentora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { f: "Speed / Action clicks", old: "8-12 Taps", new: "1-2 gestures" },
                                    { f: "3D Visual Charting", old: "No / Static 2D", new: "Dynamic & Rotatable" },
                                    { f: "Patient Self-Checkin", old: "Manual Desk desk", new: "Fully Tokenized Kiosk" },
                                    { f: "Remote Assistance Mode", old: "Zero Capability", new: "HD Tele consultations" },
                                    { f: "Offline Mobile Sync", old: "Limited", new: "Instant Cloud Bridge" }
                                ].map((row, i) => (
                                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50">
                                        <td className="p-4 text-xs font-black text-slate-700">{row.f}</td>
                                        <td className="p-4 text-xs font-bold text-slate-400 text-center">{row.old}</td>
                                        <td className="p-4 text-xs font-black text-center text-primary bg-primary/2">{row.new}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 5. MULTI PLATFORM visual DOWNLOAD (ANDROID/IOS) */}
            <section id="download" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left: Device Frames */}
                    <div className="lg:col-span-6 flex justify-center perspective-[1000px]">
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            whileInView={{ scale: 1, y: 0 }}
                            className="relative flex items-end gap-4"
                        >
                            {/* Smartphone frame */}
                            <div className="w-56 aspect-[9/19.5] rounded-[2.5rem] bg-slate-900 p-2.5 shadow-2x border border-slate-800 flex-shrink-0 relative overflow-hidden">
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-black z-10" />
                                <div className="w-full h-full rounded-[2rem] bg-white overflow-hidden flex flex-col">
                                    <img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover" alt="Mobile UI mockup" />
                                </div>
                            </div>

                            {/* Tablet / Desktop offset behind */}
                            <div className="w-80 aspect-[4/3] rounded-2xl bg-slate-100/80 p-1 hidden md:flex shadow-xl border border-white/50 absolute left-24 -bottom-4 -z-10 rotate-3 p-1">
                                <div className="w-full h-full rounded-xl bg-white overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1576091160399-212fe6220486?q=80&w=400&auto=format&fit=crop" className="w-full h-5/6 object-cover" alt="Dashboard device mockup" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: text download section */}
                    <div className="lg:col-span-6 flex flex-col gap-6 text-left">
                        <span className="text-secondary font-black uppercase text-xs">Seamless Cloud Bridge</span>
                        <h2 className="text-3xl lg:text-4xl font-black text-dark leading-tight tracking-tight">
                            Manage from your Desktop, <span className="text-gradient">Consult from your Pillow.</span>
                        </h2>
                        <p className="text-sm text-muted font-medium leading-relaxed">
                            Syncing seamlessly across Android, iOS, Windows and macOS, Dentora provides full capabilities without speed latency lag. Track consultations or prescriptions correctly when travelling overlays securely setups correctly securely.
                        </p>

                        <div className="flex flex-col gap-3 pt-2">
                            <div className="flex items-center gap-3 text-xs font-bold text-dark"><CheckCircle size={16} className="text-emerald-500" /> End-to-end securely offline vaults setups</div>
                            <div className="flex items-center gap-3 text-xs font-bold text-dark"><CheckCircle size={16} className="text-emerald-500" /> Push notification reminders alerts framing</div>
                            <div className="flex items-center gap-3 text-xs font-bold text-dark"><CheckCircle size={16} className="text-emerald-500" /> Single License setups unlimited seats framing</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <button className="flex items-center gap-3 bg-dark text-white px-5 py-3 rounded-2xl hover:bg-slate-800 transition-all shadow-md active:scale-95">
                                <Download size={20} />
                                <div className="flex flex-col text-left">
                                    <span className="text-[10px] font-bold text-white/60">Download on</span>
                                    <span className="text-sm font-black -mt-0.5">App Store</span>
                                </div>
                            </button>
                            <button className="flex items-center gap-3 bg-dark text-white px-5 py-3 rounded-2xl hover:bg-slate-800 transition-all shadow-md active:scale-95">
                                <Play size={20} className="fill-white" />
                                <div className="flex flex-col text-left">
                                    <span className="text-[10px] font-bold text-white/60">GET IT ON</span>
                                    <span className="text-sm font-black -mt-0.5">Google Play</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. PRICING SECTION */}
            <section id="pricing" className="py-24 px-6 bg-slate-50/50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="mb-14">
                        <span className="text-primary font-black uppercase text-xs">Transparent Packages</span>
                        <h2 className="text-3xl md:text-5xl font-black text-dark tracking-tight mt-1">Pricing built for scale.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { name: "Starter", price: "Free", desc: "Perfect for single solo practice getting started.", features: ["Up to 100 Patients", "Basic 2D clinical mapping", "Kiosk selfcheck enabled", "Email tickets basic support"] },
                            { name: "Professional", price: "$49", desc: "Ideal with robust needs daily scaling operations.", features: ["Unlimited Patients setup", "Visual 3-D tooth presets framing", "Instant direct finance setups overrides", "Accountings synced directly vaults", "24/7 Priority desks assistants"], popular: true },
                            { name: "Enterprise", price: "Custom", desc: "Multi branch operations clinics hospitals support.", features: ["Audit trails logins syncs setups", "Unlimited Staff accounts framing securely", "White label subdomain assets setups", "Custom migrations setups support fully"] }
                        ].map((pkg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-8 rounded-2xl overflow-hidden flex flex-col justify-between text-left relative ${pkg.popular ? 'bg-white border-2 border-primary shadow-xl' : 'bg-white/80 border border-slate-200/50 shadow-sm'}`}
                            >
                                {pkg.popular && (
                                    <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-full px-2 tracking-wide">POPULAR</div>
                                )}
                                <div>
                                    <span className="font-black text-lg text-dark">{pkg.name}</span>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-3xl font-black text-dark">{pkg.price}</span>
                                        {pkg.price !== 'Free' && pkg.price !== 'Custom' && <span className="text-xs font-bold text-muted">/month</span>}
                                    </div>
                                    <p className="text-xs text-muted font-medium mt-1.5 leading-relaxed">{pkg.desc}</p>
                                    <hr className="my-5 border-slate-100" />
                                    <ul className="flex flex-col gap-3">
                                        {pkg.features.map((f, fi) => (
                                            <li key={fi} className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                                                <CheckCircle size={14} className="text-primary flex-shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button onClick={onStartLogin} className={`w-full mt-8 py-3 rounded-xl font-bold text-sm text-center transition-all ${pkg.popular ? 'bg-primary text-white shadow-md hover:bg-primary-hover' : 'bg-slate-100 text-dark hover:bg-slate-200'}`}>
                                    Get Started
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. FOOTER */}
            <footer className="py-16 px-6 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center p-1.5 shadow-md shadow-primary/20 flex-shrink-0"><Activity className="text-white w-full h-full" /></div>
                            <span className="font-black text-lg text-dark">Dentora</span>
                        </div>
                        <p className="text-xs text-muted font-medium leading-relaxed">
                            A highly intelligent Dental EMR mapped securely and gracefully for modern operational needs. Backed fully securely setups nodes overlays maps securely.
                        </p>
                    </div>

                    <div>
                        <span className="font-black text-xs text-dark uppercase tracking-wider">Product</span>
                        <ul className="flex flex-col gap-2 mt-4 text-xs font-medium text-muted">
                            <li className="hover:text-primary cursor-pointer transition-colors">Features</li>
                            <li className="hover:text-primary cursor-pointer transition-colors">Security</li>
                            <li className="hover:text-primary cursor-pointer transition-colors">Release Notes</li>
                        </ul>
                    </div>

                    <div>
                        <span className="font-black text-xs text-dark uppercase tracking-wider">Legal</span>
                        <ul className="flex flex-col gap-2 mt-4 text-xs font-medium text-muted">
                            <li className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</li>
                            <li className="hover:text-primary cursor-pointer transition-colors">Terms of Service</li>
                            <li className="hover:text-primary cursor-pointer transition-colors">Compliance certifications</li>
                        </ul>
                    </div>

                    <div>
                        <span className="font-black text-xs text-dark uppercase tracking-wider">Stay safe</span>
                        <p className="text-xs text-muted font-medium mt-4 leading-relaxed">License activated. All database syncing securely configured framed overlays tightly backups setups correctly securely.</p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto border-t border-slate-100 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
                    <span className="text-[11px] text-muted font-bold">© 2026 Dentora Inc. All rights reserved.</span>
                    <div className="flex items-center gap-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-600 font-black">All Systems Operational</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
