import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
    console.log('Test Gemini Models API called at', new Date().toISOString());
    try {
        // 1. Get API Key
        let API_KEY = 'AIzaSyAwSHugjU7ch3LXIoAyfKfIKImLXOgLr3s'; // Default
        try {
            const supabase = createAdminClient();
            const { data: setting } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'gemini_api_key')
                .single();
            if (setting?.value) API_KEY = setting.value;
        } catch (e) { }

        // 2. List Models using Gemini API
        const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

        const res = await fetch(URL);
        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to list models', details: data }, { status: 500 });
        }

        // Filter only generation capable models
        const capableModels = data.models?.filter((m: any) =>
            m.supportedGenerationMethods?.includes('generateContent')
        );

        return NextResponse.json({
            count: capableModels?.length || 0,
            models: capableModels || [],
            all_raw: data
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
