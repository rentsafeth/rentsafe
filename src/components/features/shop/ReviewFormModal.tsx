'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useMemo } from 'react';
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

interface ReviewFormModalProps {
    shopId: string;
    userId: string;
    onSuccess?: () => void;
    isThai?: boolean;
}

export default function ReviewFormModal({ shopId, userId, onSuccess, isThai = true }: ReviewFormModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const supabase = createClient();

    // Create schema with dynamic messages based on locale
    const reviewSchema = useMemo(() => z.object({
        rating: z.number().min(1, isThai ? 'กรุณาให้คะแนนอย่างน้อย 1 ดาว' : 'Please rate at least 1 star').max(5),
        comment: z.string()
            .min(10, isThai ? 'กรุณาเขียนรีวิวอย่างน้อย 10 ตัวอักษร' : 'Please write at least 10 characters')
            .max(1000, isThai ? 'รีวิวต้องไม่เกิน 1000 ตัวอักษร' : 'Review must not exceed 1000 characters'),
        isAnonymous: z.boolean(),
        acceptTerms: z.boolean().refine((val) => val === true, {
            message: isThai ? 'กรุณายอมรับเงื่อนไขการรีวิว' : 'Please accept the review terms',
        }),
    }), [isThai]);

    type ReviewFormValues = z.infer<typeof reviewSchema>;

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            comment: '',
            isAnonymous: true,
            acceptTerms: false,
        },
    });

    const acceptTerms = form.watch('acceptTerms');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + selectedFiles.length > 5) {
            toast.error(isThai ? 'อัปโหลดรูปภาพได้สูงสุด 5 รูป' : 'Maximum 5 images allowed');
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(isThai ? `ไฟล์ ${file.name} มีขนาดใหญ่เกิน 5MB` : `File ${file.name} exceeds 5MB`);
                return false;
            }
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                toast.error(isThai ? `ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ` : `File ${file.name} is not a supported image type`);
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

                    const { error: uploadError } = await supabase.storage
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

            // 2. Get User Info for masking
            const { data: { user } } = await supabase.auth.getUser();
            const emailName = user?.email?.split('@')[0] || 'User';
            const maskedName = values.isAnonymous
                ? `${emailName.substring(0, 3)}***`
                : emailName;

            // 3. Submit Review via API
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
                throw new Error(errorData.error || (isThai ? 'เกิดข้อผิดพลาดในการส่งรีวิว' : 'Failed to submit review'));
            }

            toast.success(isThai ? 'ส่งรีวิวเรียบร้อยแล้ว! กรุณารอการตรวจสอบจากทีมงาน' : 'Review submitted! Please wait for moderation.');
            setIsOpen(false);
            form.reset();
            setSelectedFiles([]);
            setPreviews([]);
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error('Error submitting review:', error);
            toast.error(error.message || (isThai ? 'เกิดข้อผิดพลาดในการส่งรีวิว' : 'An error occurred while submitting the review'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Star className="w-4 h-4 mr-2" />
                    {isThai ? 'เขียนรีวิว' : 'Write a Review'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isThai ? 'เขียนรีวิวร้านค้า' : 'Write a Shop Review'}</DialogTitle>
                    <DialogDescription>
                        {isThai ? 'แบ่งปันประสบการณ์การเช่ารถของคุณเพื่อเป็นข้อมูลให้กับผู้อื่น' : 'Share your rental experience to help others.'}
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
                                    <FormLabel>{isThai ? 'คะแนนความพึงพอใจ' : 'Satisfaction Rating'}</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className={`p-1 transition-transform hover:scale-110 focus:outline-none ${field.value >= star ? 'text-yellow-500' : 'text-gray-300'
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
                                    <FormLabel>{isThai ? 'ความคิดเห็น' : 'Comment'}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={isThai ? 'เล่าประสบการณ์การเช่ารถ สภาพรถ การบริการ...' : 'Describe your rental experience, car condition, service...'}
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
                            <FormLabel>{isThai ? 'รูปภาพหลักฐาน (สูงสุด 5 รูป)' : 'Evidence Images (Max 5)'}</FormLabel>
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
                                        <span className="text-xs text-gray-500 mt-1">{isThai ? 'เพิ่มรูป' : 'Add Image'}</span>
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
                                {isThai ? 'รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB' : 'Supports JPG, PNG up to 5MB'}
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
                                            {isThai ? 'แสดงชื่อแบบไม่ระบุตัวตน' : 'Post Anonymously'}
                                        </FormLabel>
                                        <FormDescription>
                                            {isThai ? 'ชื่อของคุณจะถูกแสดงเป็นบางส่วน (เช่น Som***) เพื่อความเป็นส่วนตัว' : 'Your name will be partially masked (e.g. Som***) for privacy.'}
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
                                                {isThai
                                                    ? 'ข้าพเจ้ายอมรับเงื่อนไขการรีวิว และรับรองว่าข้อมูลทั้งหมดเป็นความจริง หากมีการฟ้องร้อง ข้าพเจ้ายินดีรับผิดชอบทางกฎหมายทุกกรณี'
                                                    : 'I accept the review terms and certify that all information is true. I accept full legal responsibility in case of any litigation.'}
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
                                {isThai ? 'ยกเลิก' : 'Cancel'}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !acceptTerms}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {isThai ? 'กำลังส่ง...' : 'Submitting...'}
                                    </>
                                ) : (
                                    isThai ? 'ส่งรีวิว' : 'Submit Review'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
