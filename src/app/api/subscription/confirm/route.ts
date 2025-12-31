import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Confirm payment (upload slip / verify)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { transaction_id, slip_url } = body;

        if (!transaction_id) {
            return NextResponse.json(
                { error: 'Missing transaction_id' },
                { status: 400 }
            );
        }

        // Get shop
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (shopError || !shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Get transaction
        const { data: transaction, error: transError } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('id', transaction_id)
            .eq('shop_id', shop.id)
            .eq('status', 'pending')
            .single();

        if (transError || !transaction) {
            return NextResponse.json({ error: 'Transaction not found or already processed' }, { status: 404 });
        }

        // Update transaction with slip
        if (slip_url) {
            await supabase
                .from('payment_transactions')
                .update({
                    slip_url,
                    status: 'pending', // Awaiting admin verification
                    updated_at: new Date().toISOString(),
                })
                .eq('id', transaction_id);
        }

        // Create notification for admin
        await supabase
            .from('notifications')
            .insert({
                target_type: 'all', // Admin notification
                title: 'มีการชำระเงินใหม่รอตรวจสอบ',
                message: `ร้าน ${shop.id} ส่งสลิปการชำระเงินมาแล้ว`,
                type: 'system',
                severity: 'info',
                action_url: `/admin/payments/${transaction_id}`,
                metadata: { transaction_id, shop_id: shop.id },
            });

        return NextResponse.json({
            success: true,
            message: 'อัพโหลดสลิปสำเร็จ รอการตรวจสอบจาก Admin',
            transaction_id,
        });
    } catch (error) {
        console.error('Error confirming payment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
