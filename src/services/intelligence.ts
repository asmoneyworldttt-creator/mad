import { supabase } from '../supabase';

export interface NoShowRisk {
    patientId: string;
    score: number; // 0 to 100
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    reasons: string[];
}

/**
 * Predicts the likelihood of a patient missing their appointment.
 * In a real production environment, this would call a server-side Python ML model.
 * Here we implement the heuristic logic.
 */
export async function predictNoShowRisk(patientId: string): Promise<NoShowRisk> {
    try {
        // Fetch last 10 appointments for this patient
        const { data: history } = await supabase
            .from('appointments')
            .select('status, date')
            .eq('patient_id', patientId)
            .order('date', { ascending: false })
            .limit(10);

        if (!history || history.length === 0) {
            return { patientId, score: 5, level: 'Low', reasons: ['New patient - clean record'] };
        }

        let score = 0;
        const reasons: string[] = [];

        const total = history.length;
        const missed = history.filter(a => a.status === 'Missed' || a.status === 'No-Show').length;
        const cancelled = history.filter(a => a.status === 'Cancelled').length;

        // 1. Historical Ratio
        const missedRatio = missed / total;
        if (missedRatio > 0.5) {
            score += 40;
            reasons.push('Historical no-show rate > 50%');
        } else if (missedRatio > 0.2) {
            score += 20;
            reasons.push('Repeat offender for missed slots');
        }

        // 2. Recent behavior (Last 2)
        if (history[0]?.status === 'Missed') {
            score += 25;
            reasons.push('Most recent appointment was missed');
        }

        // 3. High cancellation frequency
        if (cancelled / total > 0.4) {
            score += 15;
            reasons.push('Frequent last-minute cancellations');
        }

        // Cap score
        score = Math.min(score + 5, 100);

        let level: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
        if (score > 75) level = 'Critical';
        else if (score > 50) level = 'High';
        else if (score > 25) level = 'Medium';

        return { patientId, score, level, reasons };

    } catch (e) {
        return { patientId, score: 0, level: 'Low', reasons: ['Predictive engine offline'] };
    }
}
