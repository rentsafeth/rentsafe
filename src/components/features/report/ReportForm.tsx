'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportForm({ userId }: { userId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('ReportPage');
    const prefilledShopId = searchParams.get('shop_id');
    const prefilledBlacklistId = searchParams.get('blacklist_id');
    const prefilledBank = searchParams.get('bank');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [blacklistInfo, setBlacklistInfo] = useState<any>(null);
    const [shopInfo, setShopInfo] = useState<any>(null);
    const supabase = createClient();

    const formSchema = z.object({
        shop_name: z.string().min(2, t('validation.shopNameRequired')),
        facebook_url: z.string().optional(),
        line_id: z.string().optional(),
        phone_number: z.string().optional(),
        bank_account_no: z.string().optional(),
        bank_account_name: z.string().optional(),
        id_card: z.string().optional(),
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
            facebook_url: '',
            line_id: blacklistInfo?.line_ids?.[0] || '',
            phone_number: blacklistInfo?.phone_numbers?.[0] || '',
            bank_account_no: prefilledBank || blacklistInfo?.bank_account_no || '',
            bank_account_name: '',
            id_card: blacklistInfo?.id_card_numbers?.[0] || '',
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
            const fileInput = document.getElementById('evidence-upload') as HTMLInputElement;

            if (!fileInput?.files?.length) {
                throw new Error('กรุณาแนบหลักฐาน (รูปภาพ/สลิป/แชท)');
            }

            setUploading(true);
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];

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
                manual_shop_contact: `FB: ${values.facebook_url}, Line: ${values.line_id}, Phone: ${values.phone_number}`,
                manual_bank_account: `${values.bank_account_no} (${values.bank_account_name})`,
                manual_id_card: values.id_card,
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

                <Card className="border-red-100 shadow-md">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
                                    <Input
                                        id="evidence-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-600">คลิกเพื่ออัปโหลดรูปภาพหลักฐาน</p>
                                    <p className="text-xs text-slate-400 mt-1">รองรับไฟล์ JPG, PNG (สูงสุด 5 รูป, ไม่เกิน 5MB/รูป)</p>
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

                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-lg h-12" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {uploading ? 'กำลังอัปโหลดหลักฐาน...' : 'ยืนยันการส่งรายงาน'}
                        </Button>

                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}
