'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check local storage delay to avoid flash
        const consent = localStorage.getItem('rentsafe_cookie_consent');
        if (!consent) {
            // Delay slightly to feel more natural
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        setIsVisible(false);
        localStorage.setItem('rentsafe_cookie_consent', 'accepted');
    };

    const handleDecline = () => {
        setIsVisible(false);
        localStorage.setItem('rentsafe_cookie_consent', 'declined');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
                >
                    <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur shadow-2xl rounded-2xl border border-slate-200 p-4 md:flex items-center gap-6 ring-1 ring-black/5">
                        <div className="flex-1 flex gap-4">
                            <div className="p-3 bg-blue-50 rounded-full h-fit">
                                <Cookie className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-base mb-1">
                                    เราใช้คุกกี้ (Cookies)
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    เว็บไซต์นี้มีการใช้งานคุกกี้เพื่อมอบประสบการณ์การใช้งานที่ดีเยี่ยม และช่วยให้เราสามารถพัฒนาบริการให้ดียิ่งขึ้น
                                    การใช้งานเว็บไซต์นี้ถือว่าคุณยอมรับ
                                    <Link href="/privacy-policy" className="text-blue-600 hover:underline mx-1 font-medium">
                                        นโยบายความเป็นส่วนตัว
                                    </Link>
                                    ของเรา
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4 md:mt-0 items-center justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDecline}
                                className="text-gray-600 border-gray-300 hover:bg-gray-100"
                            >
                                ปฏิเสธ
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleAccept}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            >
                                ยอมรับทั้งหมด
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
