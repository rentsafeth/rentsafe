'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2, Save, Building2, ImageIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Shop {
    id: string;
    name: string;
    description: string | null;
    phone_number: string;
    line_id: string | null;
    facebook_url: string | null;
    website: string | null;
    logo_url: string | null;
    cover_url: string | null;
    owner_id: string;
}

export default function EditShopPage() {
    const router = useRouter();
    const supabase = createClient();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        phone_number: '',
        line_id: '',
        facebook_url: '',
        website: '',
    });

    useEffect(() => {
        loadShop();
    }, []);

    const loadShop = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: shopData, error } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', user.id)
            .single();

        if (error || !shopData) {
            router.push('/dashboard');
            return;
        }

        setShop(shopData);
        setFormData({
            name: shopData.name || '',
            description: shopData.description || '',
            phone_number: shopData.phone_number || '',
            line_id: shopData.line_id || '',
            facebook_url: shopData.facebook_url || '',
            website: shopData.website || '',
        });
        setLoading(false);
    };

    const handleImageUpload = async (file: File, type: 'logo' | 'cover') => {
        if (!shop) return;

        const setUploading = type === 'logo' ? setUploadingLogo : setUploadingCover;
        setUploading(true);

        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${shop.id}/${type}_${Date.now()}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('shop-images')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('shop-images')
                .getPublicUrl(fileName);

            // Update shop record
            const updateField = type === 'logo' ? 'logo_url' : 'cover_url';
            const { error: updateError } = await supabase
                .from('shops')
                .update({ [updateField]: publicUrl })
                .eq('id', shop.id);

            if (updateError) throw updateError;

            // Update local state
            setShop(prev => prev ? { ...prev, [updateField]: publicUrl } : null);

        } catch (error) {
            console.error('Upload error:', error);
            alert('เกิดข้อผิดพลาดในการอัพโหลดรูป');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = async (type: 'logo' | 'cover') => {
        if (!shop) return;

        const setUploading = type === 'logo' ? setUploadingLogo : setUploadingCover;
        setUploading(true);

        try {
            const updateField = type === 'logo' ? 'logo_url' : 'cover_url';
            const { error } = await supabase
                .from('shops')
                .update({ [updateField]: null })
                .eq('id', shop.id);

            if (error) throw error;

            setShop(prev => prev ? { ...prev, [updateField]: null } : null);
        } catch (error) {
            console.error('Remove error:', error);
            alert('เกิดข้อผิดพลาด');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!shop) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('shops')
                .update({
                    name: formData.name,
                    description: formData.description || null,
                    phone_number: formData.phone_number,
                    line_id: formData.line_id || null,
                    facebook_url: formData.facebook_url || null,
                    website: formData.website || null,
                })
                .eq('id', shop.id);

            if (error) throw error;

            alert('บันทึกสำเร็จ!');
            router.push(`/shop/${shop.id}`);
        } catch (error) {
            console.error('Save error:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>ไม่พบร้านค้า</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-2xl font-bold mb-6">แก้ไขโปรไฟล์ร้านค้า</h1>

                {/* Cover Image Section */}
                <Card className="mb-6 overflow-hidden">
                    <div className="relative">
                        {/* Cover Image */}
                        <div
                            className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-cyan-500 relative cursor-pointer group"
                            onClick={() => coverInputRef.current?.click()}
                        >
                            {shop.cover_url ? (
                                <Image
                                    src={shop.cover_url}
                                    alt="Cover"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-white/70 text-center">
                                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                        <p>คลิกเพื่ออัพโหลดรูปพื้นหลัง</p>
                                        <p className="text-sm">แนะนำ: 1200 x 400 px</p>
                                    </div>
                                </div>
                            )}

                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {uploadingCover ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                                ) : (
                                    <Camera className="w-8 h-8 text-white" />
                                )}
                            </div>

                            {/* Remove button */}
                            {shop.cover_url && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage('cover');
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'cover');
                            }}
                        />

                        {/* Logo */}
                        <div className="absolute -bottom-12 left-6">
                            <div
                                className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-lg border-4 border-white overflow-hidden cursor-pointer group relative"
                                onClick={() => logoInputRef.current?.click()}
                            >
                                {shop.logo_url ? (
                                    <Image
                                        src={shop.logo_url}
                                        alt="Logo"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                        <Building2 className="w-12 h-12 text-slate-400" />
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {uploadingLogo ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                    ) : (
                                        <Camera className="w-6 h-6 text-white" />
                                    )}
                                </div>
                            </div>

                            {shop.logo_url && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage('logo');
                                    }}
                                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}

                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, 'logo');
                                }}
                            />
                        </div>
                    </div>

                    <div className="pt-16 pb-6 px-6">
                        <p className="text-sm text-slate-500">คลิกที่รูปเพื่อเปลี่ยน</p>
                    </div>
                </Card>

                {/* Shop Info Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลร้านค้า</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">ชื่อร้านค้า *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="ชื่อร้านค้า"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                    placeholder="0xx-xxx-xxxx"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">คำอธิบายร้านค้า</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="รายละเอียดเกี่ยวกับร้านค้าของคุณ..."
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="line">Line ID</Label>
                                <Input
                                    id="line"
                                    value={formData.line_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, line_id: e.target.value }))}
                                    placeholder="@yourline"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="facebook">Facebook URL</Label>
                                <Input
                                    id="facebook"
                                    value={formData.facebook_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                                    placeholder="https://facebook.com/yourpage"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">เว็บไซต์</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="https://yourwebsite.com"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleSave}
                                disabled={saving || !formData.name || !formData.phone_number}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                บันทึก
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                ยกเลิก
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
