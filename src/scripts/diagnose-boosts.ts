
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Debug Process Info
console.log('CWD:', process.cwd());
const envPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
    console.log('Found .env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const lines = envConfig.replace(/\r\n/g, '\n').split('\n');

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) return;

        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        process.env[key] = value;
        console.log(`Loaded Key: ${key}`);
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not found. Trying NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars. Keys found:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DIAGNOSING BOOSTS ---');

    // 1. Current Time Info
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Bangkok' };
    console.log(`Node Time (UTC): ${now.toISOString()}`);
    console.log(`Thai Date: ${now.toLocaleDateString('en-CA', options)}`);

    // 2. Check Pending/Active Schedules
    console.log('\n--- Checking Schedules ---');

    const thaiDate = now.toLocaleDateString('en-CA', options);

    // Pending Boosts due today or earlier
    const { data: pendingBoosts, error: pendingError } = await supabase
        .from('ad_schedules')
        .select('id, shop_id, type, start_date, status')
        .eq('status', 'pending')
        .lte('start_date', thaiDate);

    if (pendingError) console.error('Error fetching pending:', pendingError);

    console.log(`Pending Boosts/PPC due (Should Activate): ${pendingBoosts?.length || 0}`);
    pendingBoosts?.forEach(b => console.log(` - [${b.type}] ID: ${b.id}, Shop: ${b.shop_id}, Start: ${b.start_date}`));

    // Check shop_ad_settings for Active Boosts
    const { data: activeSettings, error: settingsError } = await supabase
        .from('shop_ad_settings')
        .select('shop_id, boost_active, boost_expires_at')
        .eq('boost_active', true);

    if (settingsError) console.error('Error fetching settings:', settingsError);

    console.log(`Active Boosts (Settings): ${activeSettings?.length || 0}`);
    activeSettings?.forEach(s => {
        if (s.boost_expires_at) {
            const expires = new Date(s.boost_expires_at);
            const isExpired = expires < now;
            console.log(` - Shop: ${s.shop_id}, Expires: ${s.boost_expires_at} (Expired? ${isExpired})`);
        }
    });

    // 3. Run the Process (ONLY if key allows)
    console.log('\n--- Running process_daily_boosts() RPC ---');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('process_daily_boosts');

    if (rpcError) {
        console.error('RPC Error:', rpcError);
        console.log('Note: If using Anon key, RPC might fail if not exposed to public/anon.');
    } else {
        console.log('RPC Success:', rpcResult);
    }
}

diagnose();
