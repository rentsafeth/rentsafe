'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';

interface ShareShopButtonProps {
    shopName: string;
    shopId: string;
    isVerifiedPro?: boolean;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export default function ShareShopButton({
    shopName,
    shopId,
    isVerifiedPro = false,
    variant = 'outline',
    size = 'sm',
    className = ''
}: ShareShopButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/th/shop/${shopId}`;
        const shareText = isVerifiedPro
            ? `${shopName} ร้านรับรอง👑 ยืนยันตัวตนแล้ว\n${shareUrl}\nเช็คก่อนเช่า ปลอดภัยแน่นอน`
            : `${shopName} ยืนยันตัวตนแล้ว\n${shareUrl}\nเช็คก่อนเช่า ปลอดภัยแน่นอน`;

        // Check if it's a desktop browser (no navigator.share or explicit request to copy)
        const isDesktop = !navigator.share;

        if (isDesktop) {
            try {
                await navigator.clipboard.writeText(shareText);
                setCopied(true);
                toast.success('คัดลอกลิงก์แล้ว', {
                    description: 'คุณสามารถนำไปวางเพื่อแชร์ได้ทันที'
                });
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Error copying:', err);
                toast.error('ไม่สามารถคัดลอกลิงก์ได้');
            }
            return;
        }

        // Mobile / Supported browsers
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shopName,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        }
    };

    if (size === 'icon') {
        return (
            <button
                onClick={handleShare}
                className={`p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors ${className}`}
                title="แชร์ร้านนี้"
            >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
            </button>
        );
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleShare}
            className={className}
        >
            {copied ? (
                <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
                <Share2 className="w-4 h-4 mr-2" />
            )}
            แชร์ร้าน
        </Button>
    );
}
