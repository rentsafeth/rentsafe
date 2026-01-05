import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Upload evidence image
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admins = ['admin@rentsafe.th', 'support@rentsafe.th'];
        const isAdmin = admins.includes(user.email || '');

        let shopId = '';
        if (!isAdmin) {
            // Get shop
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (shopError || !shop) {
                return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
            }
            shopId = shop.id;
        } else {
            shopId = 'admin';
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `evidence/${shopId}/${timestamp}-${randomStr}.${ext}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from('blacklist-evidence')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('blacklist-evidence')
            .getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: fileName,
        });
    } catch (error) {
        console.error('Error uploading evidence:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Remove evidence image
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
        }

        const admins = ['admin@rentsafe.th', 'support@rentsafe.th'];
        const isAdmin = admins.includes(user.email || '');

        if (!isAdmin) {
            // Get shop
            const { data: shop } = await supabase
                .from('shops')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!shop) {
                return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
            }

            // Verify the path belongs to this shop
            if (!path.includes(`evidence/${shop.id}/`)) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        } else {
            // Admins can delete anything in blacklist-evidence
        }

        // Delete from storage
        const { error } = await supabase.storage
            .from('blacklist-evidence')
            .remove([path]);

        if (error) {
            console.error('Delete error:', error);
            return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting evidence:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
