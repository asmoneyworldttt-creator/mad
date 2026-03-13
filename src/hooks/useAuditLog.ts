import { useCallback } from 'react';
import { supabase } from '../supabase';

type AuditAction =
    | 'view_patient' | 'edit_patient' | 'delete_patient'
    | 'view_emr' | 'create_emr' | 'edit_emr'
    | 'create_appointment' | 'edit_appointment' | 'delete_appointment'
    | 'create_bill' | 'view_bill'
    | 'export_report' | 'login' | 'logout'
    | 'view_prescription' | 'create_prescription'
    | 'page_view';

interface AuditEntry {
    action: AuditAction | string;
    entity_type?: string;
    entity_id?: string;
    metadata?: Record<string, any>;
}

export function useAuditLog() {
    const log = useCallback(async (entry: AuditEntry) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            await supabase.from('audit_log').insert({
                user_id: session.user.id,
                user_email: session.user.email,
                action: entry.action,
                entity_type: entry.entity_type || null,
                entity_id: entry.entity_id || null,
                metadata: entry.metadata || null,
                ip_address: null, // Browser cannot reliably get IP; set server-side via Edge Function if needed
                user_agent: navigator.userAgent,
                created_at: new Date().toISOString(),
            });
        } catch {
            // Audit log failures should never crash the app - silent fail
        }
    }, []);

    return { log };
}
