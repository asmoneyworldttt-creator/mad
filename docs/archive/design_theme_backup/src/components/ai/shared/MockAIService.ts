// Dentora Smart AI Mock Service
// Used when Gemini API Key is invalid or rate-limited

export const DENTISPHERE_MOCK_RESPONSES: Record<string, string> = {
    "default": "I'm currently in demo mode as the Gemini API key is being verified. I can still help you with navigation and general clinic info! How can I assist you with Dentora today?",
    "patient": "To add a patient, click on the '+ Add Patient' button in the Patient Directory or Dashboard. You can also use the 'Quick Registration' modal for faster entry.",
    "appointment": "You can manage appointments in the 'Calendar' view. Click on any slot to block time or search for a patient to book an appointment instantly.",
    "emr": "The EMR (Electronic Medical Record) features a 3D Odontogram where you can mark tooth conditions like 'Caries', 'Restored', or 'Impacted'. Just click a tooth to update its status.",
    "billing": "The billing module handles treatment costs, insurance claims, and GST invoices. You can generate a 'Quick Bill' directly from the EMR or the Dashboard.",
    "inventory": "Our Smart Inventory tracks clinical supplies. It alerts you when stock levels for consumables like composite or gloves fall below the set threshold.",
    "hello": "Hello! I am your Dentora assistant. I'm currently running in Demo Mode. How can I help you navigate the clinic software today?",
    "hi": "Hi there! Welcome to Dentora. Need help with appointments or billing?",
    "help": "I can help you with: \n1. Navigating the dashboard\n2. Registering new patients\n3. Booking appointments\n4. Using the 3D Odontogram (EMR)\n5. Billing and Financial reports.",
};

export function getMockResponse(query: string): string {
    const q = query.toLowerCase();

    if (q.includes('patient')) return DENTISPHERE_MOCK_RESPONSES.patient;
    if (q.includes('appoint')) return DENTISPHERE_MOCK_RESPONSES.appointment;
    if (q.includes('emr') || q.includes('odontogram') || q.includes('tooth')) return DENTISPHERE_MOCK_RESPONSES.emr;
    if (q.includes('bill') || q.includes('pay') || q.includes('money')) return DENTISPHERE_MOCK_RESPONSES.billing;
    if (q.includes('stock') || q.includes('inventory')) return DENTISPHERE_MOCK_RESPONSES.inventory;
    if (q.includes('hello') || q.includes('hi')) return DENTISPHERE_MOCK_RESPONSES.hello;
    if (q.includes('help')) return DENTISPHERE_MOCK_RESPONSES.help;

    return DENTISPHERE_MOCK_RESPONSES.default;
}
