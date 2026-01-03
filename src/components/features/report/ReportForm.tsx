'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, AlertTriangle, Info, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import MultiSelect from '@/components/ui/multi-select';

// All Thai provinces
const ALL_PROVINCES = [
    'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร',
    'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท',
    'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง',
    'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม',
    'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส',
    'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์',
    'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พังงา', 'พัทลุง',
    'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่',
    'พะเยา', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน',
    'ยะลา', 'ยโสธร', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง',
    'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย',
    'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ',
    'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี',
    'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย',
    'หนองบัวลำภู', 'อ่างทอง', 'อุดรธานี', 'อุทัยธานี', 'อุตรดิตถ์',
    'อุบลราชธานี', 'อำนาจเจริญ'
];

export default function ReportForm({ userId }: { userId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('ReportPage');
    const params = useParams();
    const locale = params.locale as string;
    const isThai = locale === 'th';
    const prefilledShopId = searchParams.get('shop_id');
    const prefilledBlacklistId = searchParams.get('blacklist_id');
    const prefilledBank = searchParams.get('bank');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [blacklistInfo, setBlacklistInfo] = useState<any>(null);
    const [shopInfo, setShopInfo] = useState<any>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const supabase = createClient();

    const formSchema = z.object({
        shop_name: z.string().min(2, t('validation.shopNameRequired')),
        facebook_url: z.string().optional(),
        line_id: z.string().optional(),
        phone_number: z.string().optional(),
        bank_account_no: z.string().optional(),
        bank_account_name: z.string().optional(),
        id_card: z.string().optional(),
        scam_provinces: z.string().array().optional(),
        description: z.string().min(10, t('validation.descriptionMin')),
        incident_date: z.string().refine((val) => !isNaN(Date.parse(val)), t('validation.dateRequired')),
        amount_lost: z.string().optional(),
        liability_accepted: z.boolean().refine((val) => val === true, t('validation.liabilityRequired')),
        evidence_files: z.any().optional(),
    });

    // Fetch blacklist info if adding to existing entry
    useEffect(() => {
        async function fetchBlacklistInfo() {
            if (prefilledBlacklistId) {
                const { data } = await supabase
                    .from('blacklist_entries')
                    .select('*')
                    .eq('id', prefilledBlacklistId)
                    .single();
                if (data) {
                    setBlacklistInfo(data);
                }
            }
        }
        fetchBlacklistInfo();
    }, [prefilledBlacklistId, supabase]);

    // Fetch shop info if reporting a registered shop
    useEffect(() => {
        async function fetchShopInfo() {
            if (prefilledShopId) {
                const { data } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('id', prefilledShopId)
                    .single();
                if (data) {
                    setShopInfo(data);
                }
            }
        }
        fetchShopInfo();
    }, [prefilledShopId, supabase]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            shop_name: blacklistInfo?.shop_names?.[0] || '',
            facebook_url: blacklistInfo?.facebook_urls?.[0] || '',
            line_id: blacklistInfo?.line_ids?.[0] || '',
            phone_number: blacklistInfo?.phone_numbers?.[0] || '',
            bank_account_no: prefilledBank || blacklistInfo?.bank_account_no || '',
            bank_account_name: '',
            id_card: blacklistInfo?.id_card_numbers?.[0] || '',
            scam_provinces: [],
            description: '',
            incident_date: new Date().toISOString().split('T')[0],
            amount_lost: '',
            liability_accepted: false,
        },
    });

    // Update form when blacklistInfo loads
    useEffect(() => {
        if (blacklistInfo) {
            form.setValue('shop_name', blacklistInfo.shop_names?.[0] || '');
            form.setValue('bank_account_no', blacklistInfo.bank_account_no || prefilledBank || '');
            form.setValue('phone_number', blacklistInfo.phone_numbers?.[0] || '');
            form.setValue('line_id', blacklistInfo.line_ids?.[0] || '');
            form.setValue('id_card', blacklistInfo.id_card_numbers?.[0] || '');
        }
    }, [blacklistInfo, form, prefilledBank]);

    // Update form when shopInfo loads
    useEffect(() => {
        if (shopInfo) {
            form.setValue('shop_name', shopInfo.name || '');
            form.setValue('facebook_url', shopInfo.facebook_url || '');
            form.setValue('line_id', shopInfo.line_id || '');
            form.setValue('phone_number', shopInfo.phone_number || '');
            form.setValue('bank_account_no', shopInfo.bank_account_no || '');
            form.setValue('bank_account_name', shopInfo.bank_account_name || '');
        }
    }, [shopInfo, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            // 1. Upload Images (Mocking implementation for now, assuming bucket exists)
            const evidenceUrls: string[] = [];
            if (selectedFiles.length === 0) {
                throw new Error('กรุณาแนบหลักฐาน (รูปภาพ/สลิป/แชท)');
            }

            setUploading(true);
            for (const file of selectedFiles) {


                // Check file size (5MB limit)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 5MB`);
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${userId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('report-evidence')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('report-evidence')
                    .getPublicUrl(filePath);

                evidenceUrls.push(publicUrl);
            }
            setUploading(false);

            // 2. Insert Report
            const { error } = await supabase.from('reports').insert({
                reporter_id: userId,
                shop_id: prefilledShopId || null, // If reporting a registered shop
                manual_shop_name: values.shop_name,
                manual_shop_contact: [
                    values.facebook_url ? `FB: ${values.facebook_url}` : null,
                    values.line_id ? `Line: ${values.line_id}` : null,
                    values.phone_number ? `Phone: ${values.phone_number}` : null
                ].filter(Boolean).join(', '),
                manual_facebook_url: values.facebook_url || null,
                manual_line_id: values.line_id || null,
                manual_phone_number: values.phone_number || null,
                manual_bank_account: `${values.bank_account_no} (${values.bank_account_name})`,
                manual_id_card: values.id_card,
                scam_provinces: values.scam_provinces || [],
                description: values.description,
                evidence_urls: evidenceUrls,
                incident_date: values.incident_date,
                amount_lost: values.amount_lost ? parseFloat(values.amount_lost) : 0,
                liability_accepted: values.liability_accepted,
                status: 'pending',
            });

            if (error) throw error;

            toast.success(t('successTitle'), {
                description: t('successDescription'),
            });

            // Redirect to blacklist page if came from there, otherwise dashboard
            if (prefilledBlacklistId) {
                router.push(`/blacklist/${prefilledBlacklistId}`);
            } else {
                router.push('/dashboard');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(t('errorTitle'), {
                description: error.message || t('errorDescription'),
            });
        } finally {
            setLoading(false);
            setUploading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Motivation Section */}
                <div className="space-y-4 mb-8">
                    <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="text-left flex-1">
                                    <h4 className="font-bold text-slate-800 mb-2 text-lg">
                                        {isThai ? 'เคยโดนโกงจากร้านนี้?' : 'Were you scammed by this shop?'}
                                    </h4>
                                    <p className="text-sm text-slate-600 mb-4">
                                        {isThai
                                            ? 'รายงานมิจฉาชีพเพื่อช่วยเหลือคนอื่นไม่ให้ถูกโกงซ้ำ และรับเครดิตปลอบใจเมื่อมีคนกดให้กำลังใจ!'
                                            : 'Report the scammer to help protect others and receive karma credits when you get hearts!'}
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={() => document.getElementById('report-form-start')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/30 font-bold"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        {isThai ? 'รายงานมิจฉาชีพ' : 'Report Scammer'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Show existing blacklist info if adding to existing entry */}
                {blacklistInfo && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-orange-800">{t('addingToExisting')}</h4>
                                    <p className="text-sm text-orange-700 mt-1">
                                        {t('existingReportInfo', {
                                            shopName: blacklistInfo.shop_names?.[0] || t('unknownShop'),
                                            count: blacklistInfo.total_reports
                                        })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="border-orange-300 text-orange-700">
                                            {blacklistInfo.bank_account_no}
                                        </Badge>
                                        <Badge className="bg-red-100 text-red-700 border-red-200">
                                            {t('reportsCount', { count: blacklistInfo.total_reports })}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card id="report-form-start" className="border-red-100 shadow-md">
                    <CardHeader className="bg-red-50">
                        <CardTitle className="flex items-center text-red-700">
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            {t('formTitle')}
                        </CardTitle>
                        <CardDescription className="text-red-600/80">
                            {t('formDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">

                        {/* Shop Details */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">1. ข้อมูลร้านคู่กรณี</h3>
                                {shopInfo && (
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                        กำลังรายงานร้าน: {shopInfo.name}
                                    </Badge>
                                )}
                            </div>

                            {shopInfo && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-800">ระบบดึงข้อมูลร้านให้อัตโนมัติ</h4>
                                            <p className="text-sm text-blue-700 mt-1">
                                                ระบบดึงข้อมูลร้าน <strong>{shopInfo.name}</strong> ({prefilledShopId}) ให้อัตโนมัติแล้ว กรุณากรอกเฉพาะรายละเอียดเหตุการณ์
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="shop_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อร้าน / ชื่อเพจ <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="ระบุชื่อร้านที่โกง..." {...field} disabled={!!shopInfo} className={shopInfo ? 'bg-slate-100' : ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="facebook_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ลิงก์ Facebook / ชื่อเพจ</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://facebook.com/..." {...field} disabled={!!shopInfo} className={shopInfo ? 'bg-slate-100' : ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="line_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Line ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="@..." {...field} disabled={!!shopInfo} className={shopInfo ? 'bg-slate-100' : ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>เบอร์โทรศัพท์</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="08x-xxx-xxxx"
                                                    {...field}
                                                    onBlur={(e) => {
                                                        field.onBlur(); // Handover to react-hook-form
                                                        // Auto-format: remove non-digits
                                                        if (field.value) {
                                                            const cleaned = field.value.replace(/[^0-9]/g, '');
                                                            if (cleaned !== field.value) {
                                                                field.onChange(cleaned);
                                                            }
                                                        }
                                                    }}
                                                    disabled={!!shopInfo}
                                                    className={shopInfo ? 'bg-slate-100' : ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bank_account_no"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>เลขบัญชีที่โอนเงิน</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ระบุเลขบัญชี..." {...field} disabled={!!shopInfo} className={shopInfo ? 'bg-slate-100' : ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bank_account_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ชื่อบัญชี</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ระบุชื่อเจ้าของบัญชี..." {...field} disabled={!!shopInfo} className={shopInfo ? 'bg-slate-100' : ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="id_card"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>เลขบัตรประชาชน (ถ้ามี)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ระบุเลขบัตรประชาชน..." {...field} disabled={!!shopInfo} className={shopInfo ? 'bg-slate-100' : ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Multi-select for provinces */}
                            <FormField
                                control={form.control}
                                name="scam_provinces"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {isThai ? 'จังหวัดที่มิจฉาชีพแอบอ้าง (ถ้าทราบ)' : 'Scammer\'s Claimed Province (if known)'}
                                        </FormLabel>
                                        <FormDescription>
                                            {isThai
                                                ? 'เลือกจังหวัดที่มิจฉาชีพอ้างว่าอยู่/ให้บริการ (เลือกได้หลายจังหวัด)'
                                                : 'Select province(s) the scammer claimed to be located/operate in (multiple selection allowed)'}
                                        </FormDescription>
                                        <FormControl>
                                            <MultiSelect
                                                options={ALL_PROVINCES.map(p => ({ label: p, value: p }))}
                                                selected={field.value || []}
                                                onChange={field.onChange}
                                                placeholder={isThai ? 'เลือกจังหวัด (ไม่บังคับ)' : 'Select Province (Optional)'}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Incident Details */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">2. รายละเอียดเหตุการณ์</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="incident_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>วันที่เกิดเหตุ <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amount_lost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>มูลค่าความเสียหาย (บาท)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>คำอธิบายเหตุการณ์ <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="เล่ารายละเอียดเหตุการณ์ที่เกิดขึ้น..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel>หลักฐาน (รูปภาพ/สลิป/แชท) <span className="text-red-500">*</span></FormLabel>
                                <div className={`border-2 border-dashed rounded-md p-6 text-center transition relative ${selectedFiles.length > 0 ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                                    <Input
                                        id="evidence-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => {
                                            const files = e.target.files;
                                            if (files) {
                                                const newFiles = Array.from(files);
                                                setSelectedFiles(prev => {
                                                    const combined = [...prev, ...newFiles];
                                                    // Limit to 5 files
                                                    if (combined.length > 5) {
                                                        toast.warning(t('maxFilesWarning', { count: 5, defaultMessage: 'อัปโหลดได้สูงสุด 5 รูป (ระบบตัดรูปที่เกินออก)' }));
                                                        return combined.slice(0, 5);
                                                    }
                                                    return combined;
                                                });
                                                // Reset input value to allow selecting the same file again if needed
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                    {selectedFiles.length === 0 ? (
                                        <div className="pointer-events-none">
                                            <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                            <p className="text-sm text-slate-600">คลิกเพื่ออัปโหลดรูปภาพหลักฐาน</p>
                                            <p className="text-xs text-slate-400 mt-1">รองรับไฟล์ JPG, PNG (สูงสุด 5 รูป, ไม่เกิน 5MB/รูป)</p>
                                        </div>
                                    ) : (
                                        <div className="relative z-20">
                                            <div className="flex items-center justify-center gap-2 mb-3 pointer-events-none">
                                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">✓</span>
                                                </div>
                                                <span className="text-green-700 font-semibold">เลือกแล้ว {selectedFiles.length} ไฟล์</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 justify-center mb-2">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            alt={file.name}
                                                            className="w-20 h-20 object-cover rounded-md border-2 border-green-300 bg-white"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent triggering file input
                                                                e.preventDefault();
                                                                setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-green-600 pointer-events-none">คลิกพื้นที่ว่างเพื่อเพิ่มรูป (สูงสุด 5 รูป)</p>
                                        </div>
                                    )}
                                </div>
                            </FormItem>
                        </div>

                        {/* Liability Waiver */}
                        <div className="bg-slate-50 p-4 rounded-md border">
                            <FormField
                                control={form.control}
                                name="liability_accepted"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="font-semibold text-red-700">
                                                ข้อตกลงความรับผิดชอบ (Liability Waiver)
                                            </FormLabel>
                                            <FormDescription className="text-xs text-slate-600 mt-2">
                                                ข้าพเจ้าขอรับรองว่าข้อมูลและหลักฐานทั้งหมดเป็นความจริง และข้าพเจ้าขอรับผิดชอบต่อความเสียหายใดๆ ที่อาจเกิดขึ้นแต่เพียงผู้เดียว
                                                <br /><br />
                                                **การเปิดเผยข้อมูล**: หากมีการพิสูจน์ได้ว่าเป็นเท็จ หรือมีหนังสือคำสั่งจากทางราชการ ข้าพเจ้ายินยอมให้ RentSafe เปิดเผยข้อมูลส่วนตัวของข้าพเจ้าแก่เจ้าหน้าที่รัฐเพื่อดำเนินคดีตามกฎหมาย
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            className={`w-full text-lg h-12 ${!form.watch('liability_accepted') ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                            disabled={loading || !form.watch('liability_accepted')}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {uploading ? 'กำลังอัปโหลดหลักฐาน...' : !form.watch('liability_accepted') ? 'กรุณาติ๊กยอมรับข้อตกลง' : 'ยืนยันการส่งรายงาน'}
                        </Button>

                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}
