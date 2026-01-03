import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert File to Blob/Buffer for forwarding
        // Note: AIForThai expects multipart/form-data with 'file' field
        const apiFormData = new FormData();
        apiFormData.append('file', file);

        const response = await fetch('https://api.aiforthai.in.th/ocr-id-front-iapp', {
            method: 'POST',
            headers: {
                'Apikey': 'AfjvxpZHzOubBbdCI9y0iS9qMeGh8CFg', // Use env var in production ideally
                // Do NOT set Content-Type header manually when using FormData, 
                // fetch will set boundary automatically
            },
            body: apiFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AIForThai API Error:', errorText);
            return NextResponse.json({ error: 'OCR API Failed', details: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('OCR Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
