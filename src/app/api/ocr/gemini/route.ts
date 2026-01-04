import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    console.log(`OCR API Request received at ${new Date().toISOString()}`);
    const startTime = Date.now();
    let status = 'error';
    let errorMessage = '';
    let extractedData = null;

    try {
        const { imageBase64, documentType } = await request.json(); // Clean base64 string

        if (!imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // 1. Get API Key from Database (Safe Fallback)
        let API_KEY = 'AIzaSyAwSHugjU7ch3LXIoAyfKfIKImLXOgLr3s'; // Default Hardcoded
        try {
            const supabase = createAdminClient();
            const { data: setting } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'gemini_api_key')
                .single();

            if (setting?.value) {
                API_KEY = setting.value;
            }
        } catch (dbError) {
            console.error('Failed to fetch API key from DB, using default:', dbError);
        }

        const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

        // Use gemini-2.5-flash (2026 Model)
        const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        // Create Dynamic Prompt based on User Selection
        let promptText = "";
        if (documentType === 'passport') {
            promptText = `Analyze this image as an International Passport.
Rules:
1. Extract details in ENGLISH ONLY.
2. Look for 'Passport Number' (e.g., G3865246).
3. Look for 'Surname' and 'Given Names'.
4. STRICTLY IGNORE Thai characters if present.

Extract these fields into a pure JSON object:
- 'id_card_number': The Passport Number.
- 'first_name': The Given Names (English).
- 'last_name': The Surname (English).
- 'document_type': Return 'passport'.

Return ONLY the JSON.`;
        } else {
            // Default: Thai ID Card
            promptText = `Analyze this image as a Thai National ID Card.
Rules:
1. Extract details in THAI (Prioritize Thai script for names).
2. Look for the 13-digit ID number.
3. Remove titles (นาย, นาง, etc.) from names.

Extract these fields into a pure JSON object:
- 'id_card_number': The 13-digit identification number.
- 'first_name': Thai first name.
- 'last_name': Thai last name.
- 'document_type': Return 'id_card'.

Return ONLY the JSON.`;
        }

        const payload = {
            contents: [{
                parts: [
                    { text: promptText },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]
            }]
        };

        // 2. Call Gemini API
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            errorMessage = JSON.stringify(data.error || data, null, 2);
            console.error('Gemini API Error:', errorMessage);
            throw new Error('Gemini API failed: ' + errorMessage);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No text extracted from Gemini');

        // Clean & Parse JSON
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let parsed;
        try {
            parsed = JSON.parse(cleanJson);
        } catch (e) {
            errorMessage = "JSON Parse Failed: " + text;
            throw new Error('Failed to parse AI response: ' + text);
        }

        // Success!
        status = 'success';
        extractedData = parsed;

        console.log("Parsed AI Data:", parsed);

        // 3. Log to Database (Async - Fire and Forget)
        try {
            const supabase = createAdminClient();
            const latency = Date.now() - startTime;
            supabase.from('ocr_logs').insert({
                status: 'success',
                latency_ms: latency,
                provider: 'gemini',
                extracted_data: parsed
            }).then(res => {
                if (res.error) console.error('BG Log Success Failed:', res.error);
            });
        } catch (logErr) {
            console.error('Logging setup failed:', logErr);
        }

        return NextResponse.json(parsed);

    } catch (error: any) {
        // Error Handling
        const latency = Date.now() - startTime;
        const finalErrorMsg = errorMessage || error.message || 'Unknown error';

        console.error('OCR Process Error (Final Catch):', error);

        // Log Error to Database (Async)
        try {
            const supabase = createAdminClient();
            supabase.from('ocr_logs').insert({
                status: 'error',
                latency_ms: latency,
                error_message: finalErrorMsg,
                provider: 'gemini'
            }).then(res => {
                if (res.error) console.error('BG Log Error Failed:', res.error);
            });
        } catch (logError) {
            console.error('Logging setup failed (Error path):', logError);
        }

        return NextResponse.json({
            error: 'Scan Failed',
            details: finalErrorMsg
        }, { status: 500 });
    }
}
