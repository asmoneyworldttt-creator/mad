import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/views/Dashboard';
import { EMR } from './components/views/EMR';
import { Appointments } from './components/views/Appointments';
import { Patients } from './components/views/Patients';
import { Prescriptions } from './components/views/Prescriptions';
import { Settings } from './components/views/Settings';
import { Profile } from './components/views/Profile';
import { Earnings } from './components/views/Earnings';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickBills } from './components/views/QuickBills';
import { LabWork } from './components/views/LabWork';
import { Accounts } from './components/views/Accounts';
import { Inventory } from './components/views/Inventory';
import { Reports } from './components/views/Reports';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobileApp = Capacitor.isNativePlatform();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'appointments':
        return <Appointments />;
      case 'patients':
        return <Patients />;
      case 'emr':
        return <EMR />;
      case 'prescriptions':
        return <Prescriptions />;
      case 'earnings':
        return <Earnings />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      case 'quickbills':
        return <QuickBills />;
      case 'labwork':
        return <LabWork />;
      case 'accounts':
        return <Accounts />;
      case 'inventory':
        return <Inventory />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen flex text-text-main bg-background font-sans selection:bg-primary/30 ${isMobileApp ? 'pb-20 pt-safe-top' : ''}`}>
      {!isMobileApp && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
        />
      )}

      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${!isMobileApp ? 'lg:ml-64' : ''}`}>
        {!isMobileApp && <Header toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />}

        {isMobileApp && (
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm z-30 sticky top-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-hover shadow-premium flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">M</span>
              </div>
              <h1 className="font-display font-bold text-xl text-text-dark tracking-tight">MedPro<span className="text-xs ml-1 text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold align-top">APP</span></h1>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 font-bold text-xs bg-slate-50">Dr</div>
          </div>
        )}

        <main className={`flex-1 overflow-y-auto ${isMobileApp ? 'p-3 pb-24' : 'p-4 md:p-8'} custom-scrollbar`}>
          <div className="max-w-[1400px] mx-auto pb-20">
            {renderContent()}
          </div>
        </main>
      </div>

      {isMobileApp && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}

      <style>{`
        .pt-safe-top {
            padding-top: env(safe-area-inset-top);
        }
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
      `}</style>
    </div>
  );
}

export default App;
