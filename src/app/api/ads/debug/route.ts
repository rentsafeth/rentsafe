import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Debug PPC system for a shop
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's shop
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id, name, credit_balance')
            .eq('owner_id', user.id)
            .single();

        if (shopError || !shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Get ad settings
        const { data: adSettings, error: adError } = await supabase
            .from('shop_ad_settings')
            .select('*')
            .eq('shop_id', shop.id)
            .single();

        // Get recent clicks (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentClicks, error: clicksError } = await supabase
            .from('ad_clicks')
            .select('*')
            .eq('shop_id', shop.id)
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(20);

        // Get recent impressions
        const { data: recentImpressions, error: impressionsError } = await supabase
            .from('ad_impressions')
            .select('*')
            .eq('shop_id', shop.id)
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(20);

        // Get daily stats
        const { data: dailyStats, error: statsError } = await supabase
            .from('ad_stats_daily')
            .select('*')
            .eq('shop_id', shop.id)
            .order('stat_date', { ascending: false })
            .limit(7);

        // Get credit transactions for ad_click
        const { data: creditTransactions, error: txError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('shop_id', shop.id)
            .eq('type', 'ad_click')
            .order('created_at', { ascending: false })
            .limit(10);

        // Analyze issues
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check 1: Ad settings exist
        if (!adSettings) {
            issues.push('shop_ad_settings ไม่มีข้อมูล - ต้องสร้าง row ใหม่');
            recommendations.push('ไปที่หน้า Ads dashboard เพื่อเปิดใช้งาน PPC');
        } else {
            // Check 2: PPC enabled
            if (!adSettings.ppc_enabled) {
                issues.push('PPC ถูกปิดอยู่ (ppc_enabled = false)');
                recommendations.push('เปิด PPC ในหน้า Dashboard > Ads > Pay Per Click');
            }

            // Check 3: PPC bid
            if (adSettings.ppc_bid <= 0) {
                issues.push('ppc_bid = 0 (ไม่มีค่าใช้จ่ายต่อคลิก)');
                recommendations.push('ตั้งค่า ppc_bid มากกว่า 0');
            }

            // Check 4: Daily budget
            if (adSettings.ppc_daily_budget > 0 && adSettings.ppc_spent_today >= adSettings.ppc_daily_budget) {
                issues.push(`งบประมาณรายวันหมด (ใช้ไป ${adSettings.ppc_spent_today}/${adSettings.ppc_daily_budget})`);
                recommendations.push('เพิ่มงบประมาณรายวัน หรือรอวันใหม่');
            }
        }

        // Check 5: Credit balance
        if (shop.credit_balance < (adSettings?.ppc_bid || 5)) {
            issues.push(`เครดิตไม่พอ (มี ${shop.credit_balance}, ต้องการ ${adSettings?.ppc_bid || 5} ต่อคลิก)`);
            recommendations.push('เติมเครดิตเพิ่ม');
        }

        // Check 6: Clicks vs Charged
        const chargedClicks = recentClicks?.filter(c => c.credits_charged > 0) || [];
        const freeClicks = recentClicks?.filter(c => c.credits_charged === 0) || [];

        if (recentClicks && recentClicks.length > 0 && chargedClicks.length === 0) {
            issues.push('มีคลิกแต่ไม่มีการหักเครดิต');
            recommendations.push('อาจเป็นคลิกซ้ำจาก IP เดียวกัน (ภายใน 1 ชม.)');
        }

        // Summary
        const status = issues.length === 0 ? 'OK' : 'ISSUES_FOUND';

        return NextResponse.json({
            status,
            shop: {
                id: shop.id,
                name: shop.name,
                credit_balance: shop.credit_balance
            },
            ad_settings: adSettings || null,
            statistics: {
                total_impressions_7d: recentImpressions?.length || 0,
                total_clicks_7d: recentClicks?.length || 0,
                charged_clicks_7d: chargedClicks.length,
                free_clicks_7d: freeClicks.length,
                credit_spent_on_ads: creditTransactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
            },
            daily_stats: dailyStats || [],
            recent_clicks: recentClicks?.slice(0, 5) || [],
            credit_transactions: creditTransactions?.slice(0, 5) || [],
            issues,
            recommendations,
            debug_info: {
                ad_settings_exists: !!adSettings,
                ppc_enabled: adSettings?.ppc_enabled || false,
                ppc_bid: adSettings?.ppc_bid || 0,
                ppc_daily_budget: adSettings?.ppc_daily_budget || 0,
                ppc_spent_today: adSettings?.ppc_spent_today || 0,
                boost_active: adSettings?.boost_active || false,
                boost_expires_at: adSettings?.boost_expires_at || null
            }
        });
    } catch (error) {
        console.error('Debug API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
