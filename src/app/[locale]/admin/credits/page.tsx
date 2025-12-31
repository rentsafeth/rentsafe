import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CreditOrdersList from './CreditOrdersList';

export default async function AdminCreditsPage() {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') redirect('/dashboard');

    // Get pending orders
    const { data: pendingOrders } = await supabase
        .from('credit_orders')
        .select(`
            *,
            shops (id, name, owner_id),
            credit_packages (name, credits, bonus_credits)
        `)
        .eq('status', 'pending')
        .not('slip_url', 'is', null)
        .order('created_at', { ascending: true });

    // Get recent processed orders
    const { data: processedOrders } = await supabase
        .from('credit_orders')
        .select(`
            *,
            shops (id, name),
            credit_packages (name)
        `)
        .in('status', ['approved', 'rejected'])
        .order('updated_at', { ascending: false })
        .limit(20);

    // Get system settings
    const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', ['credit_topup_enabled', 'promptpay_number', 'welcome_credits']);

    const settingsMap: Record<string, any> = {};
    settings?.forEach(s => {
        settingsMap[s.key] = s.value;
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-2xl font-bold mb-6">จัดการเครดิต</h1>

            <CreditOrdersList
                pendingOrders={pendingOrders || []}
                processedOrders={processedOrders || []}
                settings={settingsMap}
            />
        </div>
    );
}
