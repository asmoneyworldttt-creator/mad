import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { Bell, Sun, Moon, Search } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Auth } from './components/ai/Auth';
import { MasterAuth } from './components/ai/MasterAuth';
import { CommandPalette } from './components/CommandPalette';
import { SkeletonList } from './components/SkeletonLoader';
import type { Session } from '@supabase/supabase-js';

// ── Lazy-loaded views (Phase 6: code splitting) ──
const Dashboard = lazy(() => import('./components/views/Dashboard').then(m => ({ default: m.Dashboard })));
const EMR = lazy(() => import('./components/views/EMR').then(m => ({ default: m.EMR })));
const Appointments = lazy(() => import('./components/views/Appointments').then(m => ({ default: m.Appointments })));
const Patients = lazy(() => import('./components/views/Patients').then(m => ({ default: m.Patients })));
const PatientOverview = lazy(() => import('./components/views/PatientOverview').then(m => ({ default: m.PatientOverview })));
const Prescriptions = lazy(() => import('./components/views/Prescriptions').then(m => ({ default: m.Prescriptions })));
const Settings = lazy(() => import('./components/views/Settings').then(m => ({ default: m.Settings })));
const Profile = lazy(() => import('./components/views/Profile').then(m => ({ default: m.Profile })));
const Earnings = lazy(() => import('./components/views/Earnings').then(m => ({ default: m.Earnings })));
const QuickBills = lazy(() => import('./components/views/QuickBills').then(m => ({ default: m.QuickBills })));
const LabWork = lazy(() => import('./components/views/LabWork').then(m => ({ default: m.LabWork })));
const Accounts = lazy(() => import('./components/views/Accounts').then(m => ({ default: m.Accounts })));
const Inventory = lazy(() => import('./components/views/Inventory').then(m => ({ default: m.Inventory })));
const Reports = lazy(() => import('./components/views/Reports').then(m => ({ default: m.Reports })));
const GlobalAIAssistant = lazy(() => import('./components/ai/GlobalAIAssistant').then(m => ({ default: m.GlobalAIAssistant })));
const NotificationModal = lazy(() => import('./components/views/NotificationModal').then(m => ({ default: m.NotificationModal })));
const PatientRegistrationModal = lazy(() => import('./components/views/PatientRegistrationModal').then(m => ({ default: m.PatientRegistrationModal })));
const Tasks = lazy(() => import('./components/views/Tasks').then(m => ({ default: m.Tasks })));
const TeamHub = lazy(() => import('./components/views/TeamHub').then(m => ({ default: m.TeamHub })));
const InstallmentPlans = lazy(() => import('./components/views/InstallmentPlans').then(m => ({ default: m.InstallmentPlans })));
const ConsentForms = lazy(() => import('./components/views/ConsentForms').then(m => ({ default: m.ConsentForms })));
const SterilizationTracker = lazy(() => import('./components/views/SterilizationTracker').then(m => ({ default: m.SterilizationTracker })));
const KioskMode = lazy(() => import('./components/views/KioskMode').then(m => ({ default: m.KioskMode })));
const ResourceCalendar = lazy(() => import('./components/views/ResourceCalendar').then(m => ({ default: m.ResourceCalendar })));
const LoyaltyHub = lazy(() => import('./components/views/LoyaltyHub').then(m => ({ default: m.LoyaltyHub })));
const TreatmentPlans = lazy(() => import('./components/views/TreatmentPlans').then(m => ({ default: m.TreatmentPlans })));
const ReminderCenter = lazy(() => import('./components/views/ReminderCenter').then(m => ({ default: m.ReminderCenter })));
const MasterPanel = lazy(() => import('./components/views/MasterPanel').then(m => ({ default: m.MasterPanel })));
const AdminPanel = lazy(() => import('./components/views/AdminPanel').then(m => ({ default: m.AdminPanel })));
const DoctorPanel = lazy(() => import('./components/views/DoctorPanel').then(m => ({ default: m.DoctorPanel })));
const PatientPortal = lazy(() => import('./components/views/PatientPortal').then(m => ({ default: m.PatientPortal })));
const DoctorCalendar = lazy(() => import('./components/views/DoctorCalendar').then(m => ({ default: m.DoctorCalendar })));
const EquipmentLog = lazy(() => import('./components/views/EquipmentLog').then(m => ({ default: m.EquipmentLog })));
const SupplierManagement = lazy(() => import('./components/views/SupplierManagement').then(m => ({ default: m.SupplierManagement })));
const TeleDentistry = lazy(() => import('./components/views/TeleDentistry').then(m => ({ default: m.TeleDentistry })));
const OperatoryStatus = lazy(() => import('./components/views/OperatoryStatus').then(m => ({ default: m.OperatoryStatus })));
const PerioCharting = lazy(() => import('./components/views/PerioCharting').then(m => ({ default: m.PerioCharting })));
const RecallEngine = lazy(() => import('./components/views/RecallEngine').then(m => ({ default: m.RecallEngine })));
const WaitlistEngine = lazy(() => import('./components/views/WaitlistEngine').then(m => ({ default: m.WaitlistEngine })));
const LockOutScreen = lazy(() => import('./components/views/LockOutScreen').then(m => ({ default: m.LockOutScreen })));
const ClinicalNotes = lazy(() => import('./components/views/ClinicalNotes').then(m => ({ default: m.ClinicalNotes })));
const VitalSignsPanel = lazy(() => import('./components/views/VitalSignsPanel').then(m => ({ default: m.VitalSignsPanel })));
const DentalRiskScore = lazy(() => import('./components/views/DentalRiskScore').then(m => ({ default: m.DentalRiskScore })));
const PhotoGallery = lazy(() => import('./components/views/PhotoGallery').then(m => ({ default: m.PhotoGallery })));
const VoiceCharting = lazy(() => import('./components/views/VoiceCharting').then(m => ({ default: m.VoiceCharting })));

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('dentora_theme') as 'light' | 'dark') || 'light';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalPatient, setGlobalPatient] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('patient');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [permissions, setPermissions] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);

  useEffect(() => {
    const fetchStaffData = async () => {
        if (session?.user && userRole === 'staff') {
            const { data } = await supabase.from('staff').select('*').eq('id', session.user.id).maybeSingle();
            if (data) {
                setPermissions(data.permissions);
                setStaffData(data);
            }
        } else {
            setPermissions(null);
            setStaffData(null);
        }
    };
    fetchStaffData();
  }, [session, userRole]);

  useEffect(() => {
    localStorage.setItem('dentora_theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(Capacitor.isNativePlatform() || window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [clinicStatus, setClinicStatus] = useState<'active' | 'deactivated' | 'blocked' | 'deleted' | 'unknown'>('active');
  const [clinicName, setClinicName] = useState('');

  const checkClinicStatus = async (user: any) => {
    try {
      if (!user) return;
      
      const clinicId = null;
      let clinicData = null;

      // 1. Try to find clinic where user is owner
      const { data: ownedClinic } = await supabase
        .from('clinics')
        .select('id, name, status, owner_id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownedClinic) {
        clinicData = ownedClinic;
      } else {
        // 2. Try to find clinic via staff table
        const { data: staffMember } = await supabase
            .from('staff')
            .select('clinic_id')
            .eq('id', user.id)
            .maybeSingle();
        
        if (staffMember?.clinic_id) {
            const { data: linkedClinic } = await supabase
                .from('clinics')
                .select('id, name, status, owner_id')
                .eq('id', staffMember.clinic_id)
                .maybeSingle();
            clinicData = linkedClinic;
        }
      }

      if (clinicData) {
        setClinicName(clinicData.name);
        setClinicStatus(clinicData.status as any);

        // Check subscription for expiration (28-day policy)
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('clinic_id', clinicData.id)
          .maybeSingle();

        if (sub && sub.status === 'active' && sub.validity_end) {
          const end = new Date(sub.validity_end);
          const now = new Date();
          const diff = end.getTime() - now.getTime();
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

          // Lock if expired
          if (daysLeft <= 0) {
            setClinicStatus('deactivated');
            // Update DB status if it was active but expired
            await supabase.from('clinics').update({ status: 'deactivated' }).eq('id', clinicData.id);
          } else if (daysLeft <= 3) {
             // 28-day monthly reminder (last 3 days)
             const evt = new CustomEvent('dentora:toast', { 
               detail: { msg: `⚠️ Package expiring in ${daysLeft} days. Renew to avoid lockout.`, type: 'error' } 
             });
             window.dispatchEvent(evt);
          }
        }
      }
    } catch (err) {
      console.error('Core status check failed:', err);
    }
  };

  // Authentication Sync
  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth sync error:', error);
        supabase.auth.signOut().catch(() => localStorage.clear());
        setSession(null);
        setIsAuthLoading(false);
        return;
      }

      setSession(session);
      if (session?.user) {
        if (session.user.user_metadata?.role) {
          setUserRole(session.user.user_metadata.role);
          if (session.user.user_metadata.role !== 'master') {
            checkClinicStatus(session.user);
          }
        }
      }
      setIsAuthLoading(false);
    }).catch(err => {
      console.error('Fatal auth error:', err);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserRole('patient');
        setClinicStatus('active');
      } else {
        setSession(session);
        if (session?.user) {
          if (session.user.user_metadata?.role) {
            setUserRole(session.user.user_metadata.role);
            if (session.user.user_metadata.role !== 'master') {
              checkClinicStatus(session.user);
            }
          }
        }
      }
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── HIPAA: 15-minute idle session auto-logout ──────────────────────
  useEffect(() => {
    if (!session) return;
    const IDLE_MS = 15 * 60 * 1000; // 15 minutes
    const WARN_MS = 14 * 60 * 1000; // warn at 14 minutes
    let idleTimer: ReturnType<typeof setTimeout>;
    let warnTimer: ReturnType<typeof setTimeout>;
    let warned = false;

    const resetTimers = () => {
      clearTimeout(idleTimer);
      clearTimeout(warnTimer);
      warned = false;
      warnTimer = setTimeout(() => {
        if (!warned) {
          warned = true;
          // show warning via DOM toast (avoids hook-in-hook issues)
          const evt = new CustomEvent('dentora:toast', { detail: { msg: '⚠️ Session expiring in 60 seconds due to inactivity', type: 'error' } });
          window.dispatchEvent(evt);
        }
      }, WARN_MS);
      idleTimer = setTimeout(async () => {
        await supabase.auth.signOut();
      }, IDLE_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(warnTimer);
      events.forEach(e => window.removeEventListener(e, resetTimers));
    };
  }, [session]);

  const switchRole = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('dentsphere_role', role);
    setActiveTab('dashboard');
  };

  // Dynamic page title for SEO + UX
  useEffect(() => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', appointments: 'Appointments', patients: 'Patient Directory',
      emr: 'Medical Records', prescriptions: 'Prescriptions', quickbills: 'Billing',
      labwork: 'Lab Orders', earnings: 'Finance & Payroll', accounts: 'Accounts',
      inventory: 'Inventory', reports: 'Reports', settings: 'Settings',
      profile: 'My Profile', tasks: 'Tasks', 'team-hub': 'Staff Management',
      installments: 'Installments', 'consent-forms': 'Consent Forms',
      sterilization: 'Sterilization', 'equipment-log': 'Equipment', kiosk: 'Kiosk Mode',
      loyalty: 'Loyalty Hub', resources: 'Resources', 'treatment-plans': 'Treatment Plans',
      reminders: 'Reminders', teledentistry: 'TeleDentistry', 'operatory-status': 'Live Rooms',
      'perio-charting': 'Perio Charting', 'recall-engine': 'Recall Engine',
      'waitlist-engine': 'Waitlist', 'doctor-calendar': 'Doctor Schedule', suppliers: 'Suppliers',
      'clinical-notes': 'SOAP Notes', 'vital-signs': 'Vital Signs', 'risk-score': 'Dental Risk Score',
      'photo-gallery': 'Clinical Gallery', 'voice-charting': 'Voice Commands',
    };
    document.title = `Dentora — ${titles[activeTab] || 'Dental Management'}`;
  }, [activeTab]);

  const renderContent = () => {
    // Single unified component set for both light and dark modes
    switch (activeTab) {
      case 'dashboard':
        if (userRole === 'master') return <MasterPanel theme={theme} />;
        if (userRole === 'admin') return <Dashboard setActiveTab={setActiveTab} userRole={userRole} theme={theme} />;
        if (userRole === 'staff') return <DoctorPanel theme={theme} setActiveTab={setActiveTab} />;
        if (userRole === 'patient') return <PatientPortal theme={theme} />;
        return <Dashboard setActiveTab={setActiveTab} userRole={userRole} theme={theme} />;
      case 'appointments':
        return <Appointments userRole={userRole} setActiveTab={setActiveTab} theme={theme} />;
      case 'patient-overview':
        return <PatientOverview patient={globalPatient} onBack={() => setActiveTab('patients')} theme={theme} />;
      case 'patients':
        return <Patients userRole={userRole} setActiveTab={setActiveTab} theme={theme} />;
      case 'emr':
        return <EMR userRole={userRole} setActiveTab={setActiveTab} theme={theme} />;
      case 'prescriptions':
        return <Prescriptions userRole={userRole} theme={theme} />;
      case 'doctor-calendar':
        return <DoctorCalendar theme={theme} setActiveTab={setActiveTab} />;
      case 'earnings':
        return <Earnings userRole={userRole} theme={theme} />;
      case 'settings':
        return <Settings userRole={userRole} theme={theme} />;
      case 'profile':
        return <Profile userRole={userRole} theme={theme} />;
      case 'quickbills':
        return <QuickBills userRole={userRole} setActiveTab={setActiveTab} theme={theme} />;
      case 'labwork':
        return <LabWork userRole={userRole} theme={theme} />;
      case 'accounts':
        return <Accounts userRole={userRole} theme={theme} />;
      case 'inventory':
        return <Inventory userRole={userRole} theme={theme} />;
      case 'suppliers':
        return <SupplierManagement theme={theme} />;
      case 'reports':
        return <Reports userRole={userRole} theme={theme} />;
      case 'tasks':
        return <Tasks userRole={userRole} theme={theme} />;
      case 'team-hub':
        return <TeamHub userRole={userRole} theme={theme} />;
      case 'installments':
        return <InstallmentPlans userRole={userRole} theme={theme} />;
      case 'consent-forms':
        return <ConsentForms userRole={userRole} theme={theme} />;
      case 'sterilization':
        return <SterilizationTracker userRole={userRole} theme={theme} />;
      case 'equipment-log':
        return <EquipmentLog theme={theme} />;
      case 'kiosk':
        return <KioskMode theme={theme} />;
      case 'loyalty':
        return <LoyaltyHub userRole={userRole} theme={theme} />;
      case 'resources':
        return <ResourceCalendar userRole={userRole} theme={theme} />;
      case 'treatment-plans':
        return <TreatmentPlans userRole={userRole} setActiveTab={setActiveTab} theme={theme} />;
      case 'reminders':
        return <ReminderCenter userRole={userRole} theme={theme} />;
      case 'teledentistry':
        return <TeleDentistry theme={theme} />;
      case 'operatory-status':
        return <OperatoryStatus theme={theme} />;
      case 'perio-charting':
        return <PerioCharting theme={theme} />;
      case 'recall-engine':
        return <RecallEngine setActiveTab={setActiveTab} theme={theme} />;
      case 'waitlist-engine':
        return <WaitlistEngine theme={theme} />;
      case 'soap':
        return <ClinicalNotes patientId={globalPatient?.id} theme={theme} />;
      case 'vitals':
        return <VitalSignsPanel patient={globalPatient} theme={theme} />;
      case 'risk-score':
        return <DentalRiskScore patient={globalPatient} toothChartData={globalPatient?.tooth_chart_data || {}} vitals={[]} theme={theme} />;
      case 'gallery':
        return <PhotoGallery patientId={globalPatient?.id} theme={theme} />;
      case 'voice-charting':
        return <div className="p-8 max-w-2xl mx-auto"><h2 className="text-xl font-bold mb-4">Voice Command Playground</h2><VoiceCharting onTranscript={(t) => console.log(t)} currentText="" theme={theme} /></div>;
      case 'notifications':
        return <NotificationModal isOpen={true} onClose={() => setActiveTab('dashboard')} theme={theme} />;
      case 'patient-registration':
        return <PatientRegistrationModal isOpen={true} onClose={() => setActiveTab('patients')} onSuccess={(id) => { setGlobalPatient({ id }); setActiveTab('patient-overview'); }} onNavigate={setActiveTab} theme={theme} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} userRole={userRole} theme={theme} />;
    }
  };

  if (isAuthLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-xs">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Check for Master Mode via URL parameter
    const isMasterMode = window.location.search.includes('mode=master');
    
    if (isMasterMode) {
      return <MasterAuth onAuthSuccess={() => {}} theme={theme} />;
    }
    
    return <Auth onAuthSuccess={() => { }} theme={theme} />;
  }

  // Skeleton fallback for lazy-loaded views
  const ViewFallback = () => (
    <div className="space-y-4 animate-pulse pt-4">
      <div className="h-8 w-48 rounded-xl" style={{ background: 'var(--border-color)' }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-[2rem]" style={{ background: 'var(--border-color)' }} />)}
      </div>
      <div className="h-64 rounded-[2rem]" style={{ background: 'var(--border-color)' }} />
    </div>
  );

  if (clinicStatus !== 'active' && userRole !== 'master') {
    return (
      <Suspense fallback={<ViewFallback />}>
        <LockOutScreen 
          theme={theme} 
          clinicName={clinicName} 
          onLogout={() => supabase.auth.signOut()} 
        />
      </Suspense>
    );
  }

  return (
    <div className={`min-h-screen flex font-sans overflow-x-hidden relative ${isMobile ? 'pb-24 pt-safe-top' : ''}`}
      style={{ background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      {/* Skip to main content — WCAG 2.4.1 */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className="mesh-gradient-bg" />
      <div className="corner-glow" />

      {theme === 'dark' && (
        <div className="fixed top-[-10%] left-[-10%] w-[100%] h-[100%] opacity-[0.05] blur-[150px] rounded-full pointer-events-none" style={{ background: 'var(--primary)' }} />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        userRole={userRole}
        permissions={permissions}
        staffData={staffData}
        theme={theme}
        setTheme={setTheme}
      />

      <div className={`flex-1 flex flex-col min-w-0 ${!isMobile ? 'lg:ml-64' : ''}`}>
        {!isMobile && (
          <Header
            setActiveTab={setActiveTab}
            setGlobalPatient={setGlobalPatient}
            toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            userRole={userRole}
            setUserRole={switchRole}
            theme={theme}
            setTheme={setTheme}
            onLogout={() => supabase.auth.signOut()}
          />
        )}

        {isMobile && !isMobileMenuOpen && (
          <header className={`sticky top-0 z-40 px-5 py-3 transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900 shadow-lg border-b border-white/5' : 'bg-white shadow-sm border-b border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm border transition-colors ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`} onClick={() => setActiveTab('profile')}>
                  <img alt="User avatar" className="w-full h-full object-cover" src={staffData?.profile_photo_url || (userRole === 'patient' ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" : "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150")} />
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Welcome</p>
                  <h1 className={`text-base font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User'}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${theme === 'dark' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}
                    aria-label="Search"
                >
                    <Search size={18} />
                </button>
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${theme === 'dark' ? 'bg-slate-800 text-amber-400 border border-slate-700' : 'bg-slate-50 text-primary border border-slate-200'}`}
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={() => setActiveTab('notifications')} aria-label="View notifications"
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 relative ${theme === 'dark' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                  <Bell size={18} />
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary border-2 border-white"></span>
                </button>
              </div>
            </div>
          </header>
        )}

        <main id="main-content" className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 py-6' : 'p-6 md:p-8'} custom-scrollbar bg-transparent relative z-0`} role="main">
          <div className="max-w-[1400px] mx-auto pb-24 md:pb-12">
            <Suspense fallback={<ViewFallback />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>

      {isMobile && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} toggleMore={() => setIsMobileMenuOpen(true)} theme={theme} userRole={userRole} permissions={permissions} />}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelect={setActiveTab}
        theme={theme}
      />
      <GlobalAIAssistant activeTab={activeTab} />

      <style>{`
        .pt-safe-top { padding-top: env(safe-area-inset-top); }
        .pb-safe     { padding-bottom: env(safe-area-inset-bottom, 20px); }
      `}</style>
    </div>
  );
}

export default App;


