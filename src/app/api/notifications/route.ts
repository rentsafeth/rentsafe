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

        // Get shop (if user owns one)
        const { data: shop } = await supabase
            .from('shops')
            .select('id, is_verified_shop, owner_id')
            .eq('owner_id', user.id)
            .maybeSingle();

        let shopNotifications: any[] = [];
        let shopUnreadCount = 0;

        // Fetch shop-specific notifications if user has a shop
        if (shop) {
            let shopQuery = supabase
                .from('notifications')
                .select('*')
                .or(`target_id.eq.${shop.id},shop_id.eq.${shop.id}`)
                .order('created_at', { ascending: false });

            if (unreadOnly) {
                shopQuery = shopQuery.eq('is_read', false);
            }

            const { data } = await shopQuery;
            shopNotifications = data || [];

            // Get shop unread count
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .or(`target_id.eq.${shop.id},shop_id.eq.${shop.id}`)
                .eq('is_read', false);
            shopUnreadCount = count || 0;
        }

        // Fetch admin notifications (system-wide)
        // Get user's role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const userRole = profile?.role || 'user';

        let adminQuery = supabase
            .from('admin_notifications')
            .select('*')
            .or(`target_group.eq.all,target_group.eq.${userRole === 'shop_owner' ? 'shop_owners' : 'users'}`)
            .order('created_at', { ascending: false });

        const { data: adminNotificationsData } = await adminQuery;

        // Transform admin_notifications to match notification format
        const adminNotifications = (adminNotificationsData || []).map((an: any) => ({
            id: an.id,
            shop_id: null,
            type: an.type,
            title: an.title,
            message: an.message,
            data: null,
            is_read: false, // Admin notifications are always shown as unread for now
            created_at: an.sent_at,
        }));

        // Merge notifications
        const allNotifications = [...shopNotifications, ...adminNotifications]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(offset, offset + limit);

        const totalCount = shopNotifications.length + adminNotifications.length;
        const totalUnreadCount = shopUnreadCount + adminNotifications.length;

        return NextResponse.json({
            notifications: allNotifications,
            total: totalCount,
            unread_count: totalUnreadCount,
            has_more: (offset + limit) < totalCount,
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
