import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { Menu, HeartPulse } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/views/Dashboard';
import { Dashboard as DashboardLight } from './components/views/DashboardReallyOld';
import { EMR } from './components/views/EMR';
import { Appointments } from './components/views/Appointments';
import { Appointments as AppointmentsLight } from './components/views/AppointmentsOld';
import { Patients } from './components/views/Patients';
import { PatientOverview } from './components/views/PatientOverview';
import { Prescriptions } from './components/views/Prescriptions';
import { Settings } from './components/views/Settings';
import { Settings as SettingsLight } from './components/views/SettingsOld';
import { Profile } from './components/views/Profile';
import { Earnings } from './components/views/Earnings';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickBills } from './components/views/QuickBills';
import { LabWork } from './components/views/LabWork';
import { Accounts } from './components/views/Accounts';
import { Accounts as AccountsLight } from './components/views/AccountsOld';
import { Inventory } from './components/views/Inventory';
import { Inventory as InventoryLight } from './components/views/InventoryOld';
import { Reports } from './components/views/Reports';
import { GlobalAIAssistant } from './components/ai/GlobalAIAssistant';
import { NotificationModal } from './components/views/NotificationModal';
import { PatientRegistrationModal } from './components/views/PatientRegistrationModal';
import { Tasks } from './components/views/Tasks';
import { TeamHub } from './components/views/TeamHub';
import { InstallmentPlans } from './components/views/InstallmentPlans';
import { ConsentForms } from './components/views/ConsentForms';
import { SterilizationTracker } from './components/views/SterilizationTracker';
import { KioskMode } from './components/views/KioskMode';
import { ResourceCalendar } from './components/views/ResourceCalendar';
import { LoyaltyHub } from './components/views/LoyaltyHub';
import { TreatmentPlans } from './components/views/TreatmentPlans';
import { ReminderCenter } from './components/views/ReminderCenter';
import { MasterPanel } from './components/views/MasterPanel';
import { DoctorPanel } from './components/views/DoctorPanel';
import { PatientPortal } from './components/views/PatientPortal';
import { DoctorCalendar } from './components/views/DoctorCalendar';
import { EquipmentLog } from './components/views/EquipmentLog';
import { SupplierManagement } from './components/views/SupplierManagement';
import { TeleDentistry } from './components/views/TeleDentistry';
import { OperatoryStatus } from './components/views/OperatoryStatus';
import { PerioCharting } from './components/views/PerioCharting';
import { RecallEngine } from './components/views/RecallEngine';
import { WaitlistEngine } from './components/views/WaitlistEngine';
import { Auth } from './components/ai/Auth';
import type { Session } from '@supabase/supabase-js';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('dentora_theme') as 'light' | 'dark') || 'dark';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalPatient, setGlobalPatient] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('patient');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('dentora_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
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

  // Authentication Sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.user_metadata?.role) {
        setUserRole(session.user.user_metadata.role);
      }
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.user_metadata?.role) {
        setUserRole(session.user.user_metadata.role);
      }
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchRole = (role: UserRole) => {
    // Note: In real auth, roles are changed via profile update, but we keep this for legacy demo/dev testing
    setUserRole(role);
    localStorage.setItem('dentsphere_role', role);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    // Mapping for Light Mode (Old Design)
    if (theme === 'light') {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardLight setActiveTab={setActiveTab} />;
        case 'appointments':
          return <AppointmentsLight />;
        case 'patients':
          return <Patients userRole={userRole} setActiveTab={setActiveTab} theme={theme} />;
        case 'emr':
          return <EMR userRole={userRole} setActiveTab={setActiveTab} theme={theme} />;
        case 'prescriptions':
          return <Prescriptions userRole={userRole} theme={theme} />;
        case 'earnings':
          return <Earnings userRole={userRole} theme={theme} />;
        case 'settings':
          return <SettingsLight />;
        case 'profile':
          return <Profile userRole={userRole} theme={theme} />;
        case 'quickbills':
          return <QuickBills userRole={userRole} theme={theme} />;
        case 'labwork':
          return <LabWork userRole={userRole} theme={theme} />;
        case 'accounts':
          return <AccountsLight />;
        case 'inventory':
          return <InventoryLight />;
        case 'reports':
          return <Reports userRole={userRole} theme={theme} />;
        case 'notifications':
          return <NotificationModal isOpen={true} onClose={() => setActiveTab('dashboard')} theme={theme} />;
        case 'patient-registration':
          return <PatientRegistrationModal isOpen={true} onClose={() => setActiveTab('patients')} onSuccess={(id) => { setGlobalPatient({ id }); setActiveTab('patient-overview'); }} theme={theme} />;
        default:
          return <DashboardLight setActiveTab={setActiveTab} />;
      }
    }

    // Default Mapping (Dark Mode / Modern Design)
    switch (activeTab) {
      case 'dashboard':
        if (userRole === 'admin') return <MasterPanel theme={theme} />;
        if (userRole === 'doctor') return <DoctorPanel theme={theme} />;
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
        return <DoctorCalendar theme={theme} />;
      case 'earnings':
        return <Earnings userRole={userRole} theme={theme} />;
      case 'settings':
        return <Settings userRole={userRole} theme={theme} />;
      case 'profile':
        return <Profile userRole={userRole} theme={theme} />;
      case 'quickbills':
        return <QuickBills userRole={userRole} theme={theme} />;
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
        return <TreatmentPlans userRole={userRole} theme={theme} />;
      case 'reminders':
        return <ReminderCenter userRole={userRole} theme={theme} />;
      case 'teledentistry':
        return <TeleDentistry theme={theme} />;
      case 'operatory-status':
        return <OperatoryStatus theme={theme} />;
      case 'perio-charting':
        return <PerioCharting theme={theme} />;
      case 'recall-engine':
        return <RecallEngine theme={theme} />;
      case 'waitlist-engine':
        return <WaitlistEngine theme={theme} />;
      case 'notifications':
        return <NotificationModal isOpen={true} onClose={() => setActiveTab('dashboard')} theme={theme} />;
      case 'patient-registration':
        return <PatientRegistrationModal isOpen={true} onClose={() => setActiveTab('patients')} onSuccess={(id) => { setGlobalPatient({ id }); setActiveTab('patient-overview'); }} theme={theme} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} userRole={userRole} theme={theme} />;
    }
  };

  if (isAuthLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-500 font-bold italic animate-pulse tracking-widest uppercase text-xs">Synchronizing Clinical Nodes...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => { }} theme={theme} />;
  }

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'text-white' : 'text-slate-900'} bg-[var(--bg-deep)] font-sans selection:bg-[var(--accent-cyan)]/30 ${isMobile ? 'pb-24 pt-safe-top' : ''} relative overflow-x-hidden`}>
      {theme === 'dark' && (
        <>
          <div className="circuit-bg"></div>
          <div className="circuit-lines"></div>
          <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent-cyan)] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        </>
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        userRole={userRole}
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
          <header className={`sticky top-0 z-40 px-5 pt-4 pb-4 border-b transition-all duration-500 ease-fluid ${theme === 'dark' ? 'bg-surface/80 backdrop-blur-2xl border-primary/10 shadow-glass' : 'glass-morphism border-white/10'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative group" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shadow-neon transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                    <img alt="User avatar" className="w-full h-full object-cover" src={userRole === 'patient' ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" : "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150"} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary-mint rounded-full border-2 border-background-dark shadow-[0_0_8px_rgba(132,229,212,0.8)] animate-pulse"></div>
                </div>
                <div>
                  <h1 className={`font-display text-lg font-medium tracking-wide leading-none ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-primary/80 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]' : 'text-blue-700'}`}>Dentora</h1>
                  <div className="flex items-center gap-2 mt-1.5 opacity-90">
                    <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-secondary-mint shadow-[0_0_8px_rgba(132,229,212,0.8)] animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                    <span className={`text-[10px] tracking-[0.1em] font-display font-medium ${theme === 'dark' ? 'text-secondary-mint' : 'text-slate-500 font-bold'}`}>System Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveTab('notifications')} className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all duration-300 ease-fluid active:scale-90 relative group ${theme === 'dark' ? 'bg-background-light/40 border border-primary/10 hover:border-primary/30 hover:bg-primary/10 shadow-inner' : 'glass-morphism text-slate-700 hover:bg-white'}`}>
                <span className={`material-symbols-outlined text-[26px] group-hover:rotate-12 transition-transform duration-300 ${theme === 'dark' ? 'text-primary/80 group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''}`}>notifications</span>
                <span className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-background-dark ${theme === 'dark' ? 'bg-primary shadow-neon animate-pulse' : 'bg-red-500'}`}></span>
              </button>
            </div>
          </header>
        )}

        <main className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 py-6' : 'p-6 md:p-8'} custom-scrollbar bg-transparent relative z-0`}>
          <div className="max-w-[1400px] mx-auto pb-24 md:pb-12">
            {renderContent()}
          </div>
        </main>
      </div>

      {isMobile && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} toggleMore={() => setIsMobileMenuOpen(true)} />}
      <GlobalAIAssistant activeTab={activeTab} />

      <style>{`
        :root {
            --primary: #135bec;
            --primary-hover: #0e44b5;
        }
        .pt-safe-top {
            padding-top: env(safe-area-inset-top);
        }
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E2E8F0;
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #CBD5E1;
        }
        .neo-glass {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
            animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default App;


