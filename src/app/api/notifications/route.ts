import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Get notifications for current user's shop
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const unreadOnly = searchParams.get('unread') === 'true';

        // Get shop
        const { data: shop } = await supabase
            .from('shops')
            .select('id, is_verified_shop')
            .eq('owner_id', user.id)
            .single();

        if (!shop) {
            return NextResponse.json({
                notifications: [],
                total: 0,
                unread_count: 0,
                has_more: false
            });
        }

        // Build query for shop notifications
        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .or(`target_id.eq.${shop.id},shop_id.eq.${shop.id}`) // Check both target_id and shop_id
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error, count } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .or(`target_id.eq.${shop.id},shop_id.eq.${shop.id}`)
            .eq('is_read', false);

        return NextResponse.json({
            notifications: notifications || [],
            total: count || 0,
            unread_count: unreadCount || 0,
            has_more: (offset + limit) < (count || 0),
        });
    } catch (error) {
        console.error('Error in notifications API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { notification_ids, mark_all } = body;

        // Get shop
        const { data: shop } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (!shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        if (mark_all) {
            // Mark all as read for this shop
            const { error } = await supabase
                .from('notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString(),
                })
                .or(`target_id.eq.${shop.id},shop_id.eq.${shop.id}`)
                .eq('is_read', false);

            if (error) {
                return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
            }
        } else if (notification_ids && notification_ids.length > 0) {
            // Mark specific notifications as read (only for this shop)
            const { error } = await supabase
                .from('notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString(),
                })
                .or(`target_id.eq.${shop.id},shop_id.eq.${shop.id}`)
                .in('id', notification_ids);

            if (error) {
                return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
