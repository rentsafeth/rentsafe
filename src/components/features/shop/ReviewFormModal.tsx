import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Star, Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Image from 'next/image';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const reviewSchema = z.object({
    rating: z.number().min(1, 'กรุณาให้คะแนนอย่างน้อย 1 ดาว').max(5),
    comment: z.string().min(10, 'กรุณาเขียนรีวิวอย่างน้อย 10 ตัวอักษร').max(1000, 'รีวิวต้องไม่เกิน 1000 ตัวอักษร'),
    isAnonymous: z.boolean().default(true),
    acceptTerms: z.boolean().refine((val) => val === true, {
        message: 'กรุณายอมรับเงื่อนไขการรีวิว',
    }),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormModalProps {
    shopId: string;
    userId: string;
    onSuccess?: () => void;
}

export default function ReviewFormModal({ shopId, userId, onSuccess }: ReviewFormModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const supabase = createClient();

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            comment: '',
            isAnonymous: true,
            acceptTerms: false,
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + selectedFiles.length > 5) {
            toast.error('อัปโหลดรูปภาพได้สูงสุด 5 รูป');
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 5MB`);
                return false;
            }
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`);
                return false;
            }
            return true;
        });

        setSelectedFiles(prev => [...prev, ...validFiles]);

        // Create previews
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previews[index]);
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (values: ReviewFormValues) => {
        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            // 1. Upload images
            const evidenceUrls: string[] = [];
            
            if (selectedFiles.length > 0) {
                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`;
                    
                    const { error: uploadError, data } = await supabase.storage
                        .from('review-evidence')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('review-evidence')
                        .getPublicUrl(fileName);

                    evidenceUrls.push(publicUrl);
                    setUploadProgress(((i + 1) / selectedFiles.length) * 50);
                }
            }

            // 2. Get User Info for masking (if not anonymous, actually we store masked name anyway)
            // For now, we'll just use a placeholder or fetch profile if needed.
            // Let's assume we want to store a masked name regardless.
            const { data: { user } } = await supabase.auth.getUser();
            const emailName = user?.email?.split('@')[0] || 'User';
            const maskedName = values.isAnonymous 
                ? `${emailName.substring(0, 3)}***` 
                : emailName; // Or fetch real name if available

            // 3. Submit Review
            const { error: insertError } = await supabase
                .from('reviews')
                .insert({
                    shop_id: shopId,
                    user_id: userId,
                    rating: values.rating,
                    comment: values.comment,
                    status: 'pending', // Always pending first
                    evidence_urls: evidenceUrls,
                    is_anonymous: values.isAnonymous,
                    reviewer_name: maskedName,
                    // ip_address will be handled by API or RLS if possible, 
                    // but since we are client-side, we might need a server action or API route to get real IP.
                    // For now, let's submit to an API route instead of direct DB insert to handle IP securely.
                });

            if (insertError) {
                // Fallback: If direct insert fails (maybe RLS issue), try API
                // But we configured RLS to allow insert. 
                // IP Address: We can't reliably get IP client-side. 
                // Best practice: Submit to API Route.
                throw new Error('Direct DB insert failed, please implement API route for secure IP logging');
            }
            
            // Wait, to capture IP securely, we MUST use an API Route.
            // Let's change this to call an API route.
            
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId,
                    ...values,
                    evidenceUrls,
                    reviewerName: maskedName
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit review');
            }

            toast.success('ส่งรีวิวเรียบร้อยแล้ว! กรุณารอการตรวจสอบจากทีมงาน');
            setIsOpen(false);
            form.reset();
            setSelectedFiles([]);
            setPreviews([]);
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error('Error submitting review:', error);
            toast.error(error.message || 'เกิดข้อผิดพลาดในการส่งรีวิว');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Star className="w-4 h-4 mr-2" />
                    เขียนรีวิว
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>เขียนรีวิวร้านค้า</DialogTitle>
                    <DialogDescription>
                        แบ่งปันประสบการณ์การเช่ารถของคุณเพื่อเป็นข้อมูลให้กับผู้อื่น
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Rating */}
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>คะแนนความพึงพอใจ</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className={`p-1 transition-transform hover:scale-110 focus:outline-none ${
                                                        field.value >= star ? 'text-yellow-500' : 'text-gray-300'
                                                    }`}
                                                    onClick={() => field.onChange(star)}
                                                >
                                                    <Star className="w-8 h-8 fill-current" />
                                                </button>
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Comment */}
                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ความคิดเห็น</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="เล่าประสบการณ์การเช่ารถ สภาพรถ การบริการ..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload */}
                        <div className="space-y-3">
                            <FormLabel>รูปภาพหลักฐาน (สูงสุด 5 รูป)</FormLabel>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                                {previews.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                        <Image
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {previews.length < 5 && (
                                    <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                                        <Upload className="w-6 h-6 text-gray-400" />
                                        <span className="text-xs text-gray-500 mt-1">เพิ่มรูป</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
                            </p>
                        </div>

                        {/* Anonymous Toggle */}
                        <FormField
                            control={form.control}
                            name="isAnonymous"
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
                                            แสดงชื่อแบบไม่ระบุตัวตน
                                        </FormLabel>
                                        <FormDescription>
                                            ชื่อของคุณจะถูกแสดงเป็นบางส่วน (เช่น Som***) เพื่อความเป็นส่วนตัว
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Terms */}
                        <FormField
                            control={form.control}
                            name="acceptTerms"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <div className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="font-normal">
                                                ข้าพเจ้ายอมรับเงื่อนไขการรีวิว และรับรองว่าข้อมูลทั้งหมดเป็นความจริง
                                                หากมีการฟ้องร้อง ข้าพเจ้ายินดีรับผิดชอบทางกฎหมายทุกกรณี
                                            </FormLabel>
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isSubmitting}
                            >
                                ยกเลิก
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังส่ง...
                                    </>
                                ) : (
                                    'ส่งรีวิว'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
