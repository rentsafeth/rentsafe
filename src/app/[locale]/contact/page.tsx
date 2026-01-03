'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, Send, Phone, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

const SUBJECT_TYPES = [
    { value: 'payment_issue', label: 'เติมเงินไม่สำเร็จ' },
    { value: 'registration_issue', label: 'ลงทะเบียนไม่สำเร็จ' },
    { value: 'blacklist_removal', label: 'ขอลบรายการ Blacklist' },
    { value: 'review_removal', label: 'ขอลบรีวิว' },
    { value: 'other', label: 'อื่นๆ' },
];

export default function ContactPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subjectType: '',
        customSubject: '',
        description: '',
        contactNumber: '',
    });
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (images.length + newFiles.length > 5) {
                alert('อัพโหลดได้สูงสุด 5 รูป');
                return;
            }

            setImages([...images, ...newFiles]);

            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews([...previews, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]); // Cleanup
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('กรุณาเข้าสู่ระบบก่อนติดต่อเจ้าหน้าที่');
                router.push('/login');
                return;
            }

            // 1. Upload images
            const imageUrls: string[] = [];
            for (const file of images) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('contact-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('contact-images')
                    .getPublicUrl(fileName);

                imageUrls.push(publicUrl);
            }

            // 2. Create ticket
            const { error } = await supabase
                .from('contact_tickets')
                .insert({
                    user_id: user.id,
                    subject_type: formData.subjectType,
                    custom_subject: formData.subjectType === 'other' ? formData.customSubject : null,
                    description: formData.description,
                    contact_number: formData.contactNumber,
                    images: imageUrls,
                    status: 'pending'
                });

            if (error) throw error;

            alert('ส่งข้อมูลเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด');
            router.push('/dashboard/support');

        } catch (error) {
            console.error('Error submitting contact form:', error);
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-center">ติดต่อเรา / แจ้งปัญหา</CardTitle>
                    <CardDescription className="text-center">
                        กรอกรายละเอียดปัญหาที่พบ หรือเรื่องที่ต้องการติดต่อ ทีมงานจะตรวจสอบและตอบกลับโดยเร็วที่สุด
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Subject Type */}
                        <div className="space-y-2">
                            <Label>เรื่องที่ต้องการติดต่อ <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.subjectType}
                                onValueChange={(value) => setFormData({ ...formData, subjectType: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกหัวข้อ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUBJECT_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Custom Subject (if other) */}
                        {formData.subjectType === 'other' && (
                            <div className="space-y-2">
                                <Label>ระบุหัวข้อ <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.customSubject}
                                    onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
                                    placeholder="เรื่องที่ต้องการติดต่อ..."
                                    required
                                />
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-2">
                            <Label>รายละเอียด <span className="text-red-500">*</span></Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="อธิบายรายละเอียดปัญหา หรือสิ่งที่ต้องการ..."
                                className="min-h-[120px]"
                                required
                            />
                        </div>

                        {/* Contact Number */}
                        <div className="space-y-2">
                            <Label>เบอร์โทรศัพท์ติดต่อกลับ <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    value={formData.contactNumber}
                                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                    placeholder="08x-xxx-xxxx"
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label>แนบรูปภาพ (สูงสุด 5 รูป)</Label>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-2">
                                {previews.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-slate-100 group">
                                        <Image
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                        <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-500">เพิ่มรูป</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageSelect}
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">รองรับไฟล์ .jpg, .png ขนาดไม่เกิน 5MB</p>
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังส่งข้อมูล...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    ส่งข้อมูล
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
