'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2, Save, Building2, ImageIcon, X, Receipt, FileText, Banknote, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { StandaloneAlert } from '@/components/ui/alert-modal';

interface Shop {
    id: string;
    name: string;
    description: string | null;
    phone_number: string;
    line_id: string | null;
    line_ids: string[] | null;
    facebook_url: string | null;
    facebook_urls: string[] | null;
    website: string | null;
    logo_url: string | null;
    cover_url: string | null;
    owner_id: string;
    business_type: 'individual' | 'company';
    can_issue_tax_invoice: boolean;
    can_issue_withholding_tax: boolean;
    pay_on_pickup: boolean;
    accept_credit_card: boolean;
}

export default function EditShopPage() {
    const router = useRouter();
    const supabase = createClient();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const idCardRef = useRef<HTMLInputElement>(null);
    const businessLicenseRef = useRef<HTMLInputElement>(null);
    const leaseAgreementRef = useRef<HTMLInputElement>(null);
    const leaseAgreementWithCarRef = useRef<HTMLInputElement>(null);

    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    // Document Uploads State
    const [idCardFile, setIdCardFile] = useState<File | null>(null);
    const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
    const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
    const [businessLicensePreview, setBusinessLicensePreview] = useState<string | null>(null);
    const [leaseAgreementFile, setLeaseAgreementFile] = useState<File | null>(null);
    const [leaseAgreementPreview, setLeaseAgreementPreview] = useState<string | null>(null);
    const [leaseAgreementWithCarFile, setLeaseAgreementWithCarFile] = useState<File | null>(null);
    const [leaseAgreementWithCarPreview, setLeaseAgreementWithCarPreview] = useState<string | null>(null);

    // Alert state
    const [alertState, setAlertState] = useState({
        isOpen: false,
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        title: '',
        message: '',
        onConfirm: undefined as (() => void) | undefined,
    });

    const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => {
        setAlertState({ isOpen: true, type, title, message, onConfirm });
    };

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        phone_number: '',
        line_ids: [''],
        facebook_urls: [''],
        facebook_page_names: [''],
        website: '',
        promptpay_number: '',
        can_issue_tax_invoice: false,
        can_issue_withholding_tax: false,
        pay_on_pickup: false,
        accept_credit_card: false,
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
            line_ids: shopData.line_ids && shopData.line_ids.length > 0 ? shopData.line_ids : (shopData.line_id ? [shopData.line_id] : ['']),
            facebook_urls: shopData.facebook_urls && shopData.facebook_urls.length > 0 ? shopData.facebook_urls : (shopData.facebook_url ? [shopData.facebook_url] : ['']),
            facebook_page_names: (shopData as any).facebook_page_names && (shopData as any).facebook_page_names.length > 0 ? (shopData as any).facebook_page_names : [''],
            website: shopData.website || '',
            promptpay_number: (shopData as any).promptpay_number || '',
            can_issue_tax_invoice: shopData.can_issue_tax_invoice || false,
            can_issue_withholding_tax: shopData.can_issue_withholding_tax || false,
            pay_on_pickup: shopData.pay_on_pickup || false,
            accept_credit_card: shopData.accept_credit_card || false,
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
            showAlert('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถอัพโหลดรูปได้ กรุณาลองใหม่อีกครั้ง');
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
            showAlert('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถลบรูปได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'businessLicense' | 'leaseAgreement' | 'leaseAgreementWithCar') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showAlert('error', 'ไฟล์ใหญ่เกินไป', 'ขนาดไฟล์ต้องไม่เกิน 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const preview = file.type.startsWith('image/') ? reader.result as string : null;
            if (type === 'idCard') {
                setIdCardFile(file);
                setIdCardPreview(preview);
            } else if (type === 'businessLicense') {
                setBusinessLicenseFile(file);
                setBusinessLicensePreview(preview);
            } else if (type === 'leaseAgreement') {
                setLeaseAgreementFile(file);
                setLeaseAgreementPreview(preview);
            } else if (type === 'leaseAgreementWithCar') {
                setLeaseAgreementWithCarFile(file);
                setLeaseAgreementWithCarPreview(preview);
            }
        };
        reader.readAsDataURL(file);
    };

    const removeFile = (type: 'idCard' | 'businessLicense' | 'leaseAgreement' | 'leaseAgreementWithCar') => {
        if (type === 'idCard') {
            setIdCardFile(null);
            setIdCardPreview(null);
            if (idCardRef.current) idCardRef.current.value = '';
        } else if (type === 'businessLicense') {
            setBusinessLicenseFile(null);
            setBusinessLicensePreview(null);
            if (businessLicenseRef.current) businessLicenseRef.current.value = '';
        } else if (type === 'leaseAgreement') {
            setLeaseAgreementFile(null);
            setLeaseAgreementPreview(null);
            if (leaseAgreementRef.current) leaseAgreementRef.current.value = '';
        } else if (type === 'leaseAgreementWithCar') {
            setLeaseAgreementWithCarFile(null);
            setLeaseAgreementWithCarPreview(null);
            if (leaseAgreementWithCarRef.current) leaseAgreementWithCarRef.current.value = '';
        }
    };

    const uploadDocument = async (file: File, prefix: string) => {
        if (!shop) return null;
        const fileExt = file.name.split('.').pop();
        const filePath = `${shop.id}/${prefix}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('verification-docs')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('verification-docs').getPublicUrl(filePath);
        return urlData.publicUrl;
    };

    const handleSave = async () => {
        if (!shop) return;
        setSaving(true);

        try {
            // Upload documents if any
            let idCardUrl = null;
            let businessLicenseUrl = null;
            let leaseAgreementUrl = null;
            let leaseAgreementWithCarUrl = null;

            if (idCardFile) idCardUrl = await uploadDocument(idCardFile, 'id_card');
            if (businessLicenseFile) businessLicenseUrl = await uploadDocument(businessLicenseFile, 'business_license');
            if (leaseAgreementFile) leaseAgreementUrl = await uploadDocument(leaseAgreementFile, 'lease_agreement');
            if (leaseAgreementWithCarFile) leaseAgreementWithCarUrl = await uploadDocument(leaseAgreementWithCarFile, 'lease_agreement_with_car');

            // Prepare update data
            const updateData: any = {
                name: formData.name,
                description: formData.description || null,
                phone_number: formData.phone_number,
                line_ids: formData.line_ids.filter(id => id.trim() !== ''),
                facebook_urls: formData.facebook_urls.filter(url => url.trim() !== ''),
                facebook_page_names: formData.facebook_page_names.filter((_, i) => formData.facebook_urls[i]?.trim() !== ''),
                line_id: formData.line_ids[0] || null,
                facebook_url: formData.facebook_urls[0] || null,
                website: formData.website || null,
                promptpay_number: formData.promptpay_number || null,
                can_issue_tax_invoice: formData.can_issue_tax_invoice,
                can_issue_withholding_tax: formData.can_issue_withholding_tax,
                pay_on_pickup: formData.pay_on_pickup,
                accept_credit_card: formData.accept_credit_card,
            };

            // Add doc URLs if updated
            if (idCardUrl) updateData.id_card_url = idCardUrl;
            if (businessLicenseUrl) updateData.business_license_url = businessLicenseUrl;
            if (leaseAgreementUrl) updateData.lease_agreement_url = leaseAgreementUrl;
            if (leaseAgreementWithCarUrl) updateData.lease_agreement_with_car_url = leaseAgreementWithCarUrl;

            // CRITICAL: If shop was rejected, reset to pending for re-verification
            // Only if at least one document is re-uploaded or just by saving? 
            // Usually re-submitting means "I fixed it".
            // Let's reset status only if currently 'rejected'.
            const { data: currentShop } = await supabase.from('shops').select('verification_status').eq('id', shop.id).single();
            if (currentShop?.verification_status === 'rejected') {
                updateData.verification_status = 'pending';
                updateData.verification_notes = null; // Clear rejection notes
            }

            const { error } = await supabase
                .from('shops')
                .update(updateData)
                .eq('id', shop.id);
            if (error) throw error;

            showAlert('success', 'บันทึกสำเร็จ!', 'ข้อมูลร้านค้าของคุณได้รับการอัปเดตแล้ว', () => {
                router.push(`/shop/${shop.id}`);
            });
        } catch (error) {
            console.error('Save error:', error);
            showAlert('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
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

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Line IDs */}
                            <div className="space-y-3">
                                <Label>Line ID (สูงสุด 3 รายการ)</Label>
                                {formData.line_ids.map((lineId, index) => (
                                    <div key={`line-${index}`} className="flex gap-2">
                                        <Input
                                            value={lineId}
                                            onChange={(e) => {
                                                const newIds = [...formData.line_ids];
                                                newIds[index] = e.target.value;
                                                setFormData(prev => ({ ...prev, line_ids: newIds }));
                                            }}
                                            placeholder="@yourline"
                                        />
                                        {formData.line_ids.length > 1 && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    const newIds = formData.line_ids.filter((_, i) => i !== index);
                                                    setFormData(prev => ({ ...prev, line_ids: newIds }));
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {formData.line_ids.length < 3 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => setFormData(prev => ({ ...prev, line_ids: [...prev.line_ids, ''] }))}
                                    >
                                        + เพิ่ม LINE ID
                                    </Button>
                                )}
                            </div>

                            {/* Facebook Pages with Names */}
                            <div className="space-y-3">
                                <Label>Facebook Page (สูงสุด 3 รายการ)</Label>
                                <p className="text-xs text-gray-500 -mt-1">ระบุชื่อเพจและลิงก์ Facebook ของร้าน</p>
                                {formData.facebook_urls.map((url, index) => (
                                    <div key={`fb-${index}`} className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Page {index + 1}</span>
                                            {formData.facebook_urls.length > 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="ml-auto h-6 w-6 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        const newUrls = formData.facebook_urls.filter((_, i) => i !== index);
                                                        const newNames = formData.facebook_page_names.filter((_, i) => i !== index);
                                                        setFormData(prev => ({ ...prev, facebook_urls: newUrls, facebook_page_names: newNames }));
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <Input
                                            value={formData.facebook_page_names[index] || ''}
                                            onChange={(e) => {
                                                const newNames = [...formData.facebook_page_names];
                                                newNames[index] = e.target.value;
                                                setFormData(prev => ({ ...prev, facebook_page_names: newNames }));
                                            }}
                                            placeholder="ชื่อ Page เช่น รถเช่าสุขใจ"
                                            className="text-sm"
                                        />
                                        <Input
                                            value={url}
                                            onChange={(e) => {
                                                const newUrls = [...formData.facebook_urls];
                                                newUrls[index] = e.target.value;
                                                setFormData(prev => ({ ...prev, facebook_urls: newUrls }));
                                            }}
                                            placeholder="https://facebook.com/yourpage"
                                            className="text-sm"
                                        />
                                    </div>
                                ))}
                                {formData.facebook_urls.length < 3 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            facebook_urls: [...prev.facebook_urls, ''],
                                            facebook_page_names: [...prev.facebook_page_names, '']
                                        }))}
                                    >
                                        + เพิ่ม Facebook Page
                                    </Button>
                                )}
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

                        {/* PromptPay */}
                        <div className="space-y-2">
                            <Label htmlFor="promptpay">หมายเลขพร้อมเพย์ (PromptPay)</Label>
                            <Input
                                id="promptpay"
                                value={formData.promptpay_number}
                                onChange={(e) => setFormData(prev => ({ ...prev, promptpay_number: e.target.value }))}
                                placeholder="เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน"
                            />
                            <p className="text-xs text-gray-500">ใส่เพื่อแสดงในหน้าข้อมูลร้านค้า (ไม่บังคับ)</p>
                        </div>

                        {/* Documents Section */}
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-gray-900 mb-4">อัปเดตเอกสารยืนยันตัวตน</h3>
                            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg mb-4">
                                การอัปโหลดเอกสารใหม่จะทำให้สถานะร้านค้ากลับไปเป็น "รอตรวจสอบ" อีกครั้ง
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* ID Card */}
                                <div className="space-y-2">
                                    <Label>สำเนาบัตรประชาชน</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                                        {idCardPreview ? (
                                            <div className="relative">
                                                <button onClick={() => removeFile('idCard')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                                                <img src={idCardPreview} className="max-h-32 mx-auto rounded" alt="Preview" />
                                                <p className="text-xs mt-2 text-green-600">{idCardFile?.name}</p>
                                            </div>
                                        ) : (
                                            <div onClick={() => idCardRef.current?.click()} className="cursor-pointer py-4 hover:bg-gray-50 transition-colors">
                                                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดใหม่</p>
                                            </div>
                                        )}
                                        <input ref={idCardRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'idCard')} />
                                    </div>
                                </div>

                                {/* Business License */}
                                <div className="space-y-2">
                                    <Label>ทะเบียนพาณิชย์ / หนังสือรับรอง</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                                        {businessLicensePreview ? (
                                            <div className="relative">
                                                <button onClick={() => removeFile('businessLicense')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                                                <img src={businessLicensePreview} className="max-h-32 mx-auto rounded" alt="Preview" />
                                                <p className="text-xs mt-2 text-green-600">{businessLicenseFile?.name}</p>
                                            </div>
                                        ) : (
                                            <div onClick={() => businessLicenseRef.current?.click()} className="cursor-pointer py-4 hover:bg-gray-50 transition-colors">
                                                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดใหม่</p>
                                            </div>
                                        )}
                                        <input ref={businessLicenseRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'businessLicense')} />
                                    </div>
                                </div>

                                {/* Lease Agreement */}
                                <div className="space-y-2">
                                    <Label>ตัวอย่างสัญญาเช่าจริง</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                                        {leaseAgreementPreview ? (
                                            <div className="relative">
                                                <button onClick={() => removeFile('leaseAgreement')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                                                <img src={leaseAgreementPreview} className="max-h-32 mx-auto rounded" alt="Preview" />
                                                <p className="text-xs mt-2 text-green-600">{leaseAgreementFile?.name}</p>
                                            </div>
                                        ) : (
                                            <div onClick={() => leaseAgreementRef.current?.click()} className="cursor-pointer py-4 hover:bg-gray-50 transition-colors">
                                                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดใหม่</p>
                                            </div>
                                        )}
                                        <input ref={leaseAgreementRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'leaseAgreement')} />
                                    </div>
                                </div>

                                {/* Lease Agreement With Car */}
                                <div className="space-y-2">
                                    <Label>รูปสัญญาเช่าคู่กับรถ</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                                        {leaseAgreementWithCarPreview ? (
                                            <div className="relative">
                                                <button onClick={() => removeFile('leaseAgreementWithCar')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                                                <img src={leaseAgreementWithCarPreview} className="max-h-32 mx-auto rounded" alt="Preview" />
                                                <p className="text-xs mt-2 text-green-600">{leaseAgreementWithCarFile?.name}</p>
                                            </div>
                                        ) : (
                                            <div onClick={() => leaseAgreementWithCarRef.current?.click()} className="cursor-pointer py-4 hover:bg-gray-50 transition-colors">
                                                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดใหม่</p>
                                            </div>
                                        )}
                                        <input ref={leaseAgreementWithCarRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'leaseAgreementWithCar')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tax & Payment Options */}
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-gray-900 mb-4">บริการเอกสารและการชำระเงิน</h3>

                            {/* Tax Document Options */}
                            <div className="space-y-3 mb-4">
                                <p className="text-sm text-gray-600">บริการเอกสารภาษี</p>

                                {shop?.business_type === 'company' ? (
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.can_issue_tax_invoice}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                can_issue_tax_invoice: e.target.checked,
                                                can_issue_withholding_tax: false
                                            }))}
                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <Receipt className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <span className="font-medium text-gray-700">ออกใบกำกับภาษีได้</span>
                                            <p className="text-xs text-gray-500">สำหรับลูกค้าที่ต้องการใบกำกับภาษี VAT 7%</p>
                                        </div>
                                    </label>
                                ) : (
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.can_issue_withholding_tax}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                can_issue_withholding_tax: e.target.checked,
                                                can_issue_tax_invoice: false
                                            }))}
                                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <FileText className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <span className="font-medium text-gray-700">ออกหนังสือหัก ณ ที่จ่ายได้</span>
                                            <p className="text-xs text-gray-500">สำหรับลูกค้าที่ต้องการหักภาษี ณ ที่จ่าย</p>
                                        </div>
                                    </label>
                                )}
                            </div>

                            {/* Payment Options */}
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">ตัวเลือกการชำระเงิน</p>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.pay_on_pickup}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            pay_on_pickup: e.target.checked
                                        }))}
                                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                    />
                                    <Banknote className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <span className="font-medium text-gray-700">รับชำระเงินตอนรับรถ</span>
                                        <p className="text-xs text-gray-500">ลูกค้าสามารถจ่ายเงินสดหรือโอนตอนมารับรถได้</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.accept_credit_card}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            accept_credit_card: e.target.checked
                                        }))}
                                        className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                    />
                                    <CreditCard className="w-5 h-5 text-violet-600" />
                                    <div>
                                        <span className="font-medium text-gray-700">รับบัตรเครดิต</span>
                                        <p className="text-xs text-gray-500">รองรับการชำระเงินด้วยบัตรเครดิต/เดบิต</p>
                                    </div>
                                </label>
                            </div>
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

            {/* Alert Modal */}
            <StandaloneAlert
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
                onConfirm={alertState.onConfirm}
            />
        </div>
    );
}
