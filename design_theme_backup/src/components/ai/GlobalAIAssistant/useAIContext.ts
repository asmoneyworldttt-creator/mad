import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';

export function useAIContext(activeTab: string) {
    const [contextData, setContextData] = useState<any>(null);

    useEffect(() => {
        async function fetchContext() {
            switch (activeTab) {
                case 'appointments':
                    const today = new Date().toISOString().split('T')[0];
                    const { data: apts } = await supabase.from('appointments').select('*').eq('date', today);
                    setContextData({ todayAppointments: apts });
                    break;
                case 'patients':
                    const { data: ps } = await supabase.from('patients').select('*').limit(5);
                    setContextData({ recentPatients: ps });
                    break;
                case 'earnings':
                    const { data: bs } = await supabase.from('bills').select('*').limit(10);
                    setContextData({ recentBills: bs });
                    break;
                case 'dashboard':
                    const { data: stats } = await supabase.from('bills').select('amount');
                    const totalRev = (stats || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
                    setContextData({ clinicStats: { totalRevenue: totalRev, activePatients: 102 } });
                    break;
                default:
                    setContextData(null);
            }
        }
        fetchContext();
    }, [activeTab]);

    return contextData;
}
