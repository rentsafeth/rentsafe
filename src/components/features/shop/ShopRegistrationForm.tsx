'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { PROVINCES } from '@/lib/constants/provinces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(2, 'ชื่อร้านต้องยาวอย่างน้อย 2 ตัวอักษร'),
    description: z.string().optional(),
    facebook_url: z.string().url('กรุณากรอกลิงก์ Facebook ที่ถูกต้อง').optional().or(z.literal('')),
    line_id: z.string().optional(),
    phone_number: z.string().min(9, 'เบอร์โทรศัพท์ไม่ถูกต้อง'),
    website: z.string().url().optional().or(z.literal('')),
    service_provinces: z.array(z.string()).min(1, 'กรุณาเลือกจังหวัดที่ให้บริการอย่างน้อย 1 จังหวัด'),
    bank_account_no: z.string().min(10, 'เลขบัญชีต้องมีอย่างน้อย 10 หลัก'),
    bank_account_name: z.string().min(2, 'ชื่อบัญชีต้องระบุให้ชัดเจน'),
    pdpa_accepted: z.boolean().refine((val) => val === true, 'คุณต้องยอมรับข้อตกลง PDPA'),
});

export default function ShopRegistrationForm({ userId }: { userId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            facebook_url: '',
            line_id: '',
            phone_number: '',
            website: '',
            service_provinces: [],
            bank_account_no: '',
            bank_account_name: '',
            pdpa_accepted: false,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const { error } = await supabase.from('shops').insert({
                owner_id: userId,
                name: values.name,
                description: values.description,
                facebook_url: values.facebook_url,
                line_id: values.line_id,
                phone_number: values.phone_number,
                website: values.website,
                service_provinces: values.service_provinces,
                bank_account_no: values.bank_account_no,
                bank_account_name: values.bank_account_name,
                verification_status: 'pending',
            });

            if (error) throw error;

            toast.success("ลงทะเบียนสำเร็จ", {
                description: "ร้านค้าของคุณถูกสร้างเรียบร้อยแล้ว",
            });

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาด", {
                description: "ไม่สามารถลงทะเบียนร้านค้าได้ กรุณาลองใหม่อีกครั้ง",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลร้านค้า</CardTitle>
                        <CardDescription>ข้อมูลทั่วไปของร้านเช่ารถของคุณ</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ชื่อร้าน <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="เช่น RentSafe Car Rental" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>คำอธิบายร้าน</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="รายละเอียดเกี่ยวกับร้านของคุณ..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="service_provinces"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>จังหวัดที่ให้บริการ <span className="text-red-500">*</span></FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border p-4 rounded-md h-48 overflow-y-auto">
                                        {PROVINCES.map((province) => (
                                            <FormField
                                                key={province.value}
                                                control={form.control}
                                                name="service_provinces"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={province.value}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(province.value)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, province.value])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== province.value
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">
                                                                {province.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>ช่องทางการติดต่อ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>เบอร์โทรศัพท์ <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="08x-xxx-xxxx" {...field} />
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
                                            <Input placeholder="@yourshop" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="facebook_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Facebook URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://facebook.com/yourshop" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website (ถ้ามี)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://yourshop.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Info (Sensitive) */}
                <Card className="border-red-100">
                    <CardHeader className="bg-red-50/50">
                        <CardTitle className="text-red-700">ข้อมูลบัญชีธนาคาร (สำคัญ)</CardTitle>
                        <CardDescription className="text-red-600/80">
                            ข้อมูลนี้จะใช้สำหรับให้ลูกค้าตรวจสอบก่อนโอนเงิน หากบันทึกแล้วการแก้ไขจะต้องผ่านการอนุมัติจากแอดมินเท่านั้น
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bank_account_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>เลขบัญชีธนาคาร <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="xxxxxxxxxx" {...field} />
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
                                        <FormLabel>ชื่อบัญชี <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="นาย/นาง/บริษัท..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* PDPA */}
                <Card>
                    <CardContent className="pt-6">
                        <FormField
                            control={form.control}
                            name="pdpa_accepted"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            ยอมรับนโยบายความเป็นส่วนตัว (PDPA)
                                        </FormLabel>
                                        <FormDescription className="text-xs text-slate-500">
                                            ข้าพเจ้ายินยอมให้ RentSafe เก็บข้อมูลเพื่อการตรวจสอบ และเปิดเผยข้อมูลร้านค้า (ชื่อ, เบอร์โทร, เลขบัญชี) ต่อสาธารณะเพื่อการตรวจสอบความปลอดภัย
                                            <br />
                                            *หากมีการร้องขอจากทางราชการ ทางเว็บสามารถเปิดเผยข้อมูลของท่านได้
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    ลงทะเบียนร้านค้า
                </Button>
            </form>
        </Form>
    );
}
