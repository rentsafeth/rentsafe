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

        // Get admin notification read status for current user
        const adminNotificationIds = (adminNotificationsData || []).map((n: any) => n.id);
        const { data: readRecords } = await supabase
            .from('admin_notification_reads')
            .select('notification_id')
            .eq('user_id', user.id)
            .in('notification_id', adminNotificationIds);

        const readNotificationIds = new Set((readRecords || []).map((r: any) => r.notification_id));

        // Transform admin_notifications to match notification format
        const adminNotifications = (adminNotificationsData || []).map((an: any) => ({
            id: an.id,
            shop_id: null,
            type: an.type,
            title: an.title,
            message: an.message,
            data: null,
            is_read: readNotificationIds.has(an.id),
            created_at: an.created_at,
        }));

        // Count unread admin notifications
        const adminUnreadCount = adminNotifications.filter((n: any) => !n.is_read).length;

        // Merge notifications
        const allNotifications = [...shopNotifications, ...adminNotifications]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(offset, offset + limit);

        const totalCount = shopNotifications.length + adminNotifications.length;
        const totalUnreadCount = shopUnreadCount + adminUnreadCount;

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

        // Get shop (optional - user may not have a shop)
        const { data: shop } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

        if (mark_all) {
            // Mark all shop notifications as read (if user has a shop)
            if (shop) {
                await supabase
                    .from('notifications')
                    .update({
                        is_read: true,
                        read_at: new Date().toISOString(),
                    })
                    .or(`target_id.eq.${shop.id},shop_id.eq.${shop.id}`)
                    .eq('is_read', false);
            }

            // Mark all admin notifications as read
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const userRole = profile?.role || 'user';

            // Get all unread admin notifications for this user
            const { data: adminNotifications } = await supabase
                .from('admin_notifications')
                .select('id')
                .or(`target_group.eq.all,target_group.eq.${userRole === 'shop_owner' ? 'shop_owners' : 'users'}`);

            if (adminNotifications && adminNotifications.length > 0) {
                // Insert read records (use upsert to avoid duplicates)
                const readRecords = adminNotifications.map((n: any) => ({
                    user_id: user.id,
                    notification_id: n.id,
                }));

                await supabase
                    .from('admin_notification_reads')
                    .upsert(readRecords, { onConflict: 'user_id,notification_id' });
            }
        } else if (notification_ids && notification_ids.length > 0) {
            // Separate notification IDs into shop notifications and admin notifications
            // We need to fetch notifications to know which table they belong to
            const { data: notifications } = await supabase
                .from('notifications')
                .select('id')
                .in('id', notification_ids);

            const shopNotificationIds = (notifications || []).map((n: any) => n.id);
            const adminNotificationIds = notification_ids.filter((id: string) => !shopNotificationIds.includes(id));

            // Mark shop notifications as read
            if (shopNotificationIds.length > 0 && shop) {
                await supabase
                    .from('notifications')
                    .update({
                        is_read: true,
                        read_at: new Date().toISOString(),
                    })
                    .or(`target_id.eq.${shop.id},shop_id.eq.${shop.id}`)
                    .in('id', shopNotificationIds);
            }

            // Mark admin notifications as read
            if (adminNotificationIds.length > 0) {
                const readRecords = adminNotificationIds.map((id: string) => ({
                    user_id: user.id,
                    notification_id: id,
                }));

                await supabase
                    .from('admin_notification_reads')
                    .upsert(readRecords, { onConflict: 'user_id,notification_id' });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
