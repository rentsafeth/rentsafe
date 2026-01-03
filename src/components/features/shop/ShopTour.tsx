'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShopTourProps {
    isThai: boolean;
    isVerifiedPro: boolean;
}

export default function ShopTour({ isThai, isVerifiedPro }: ShopTourProps) {
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Check local storage
        const hasSeenTour = localStorage.getItem('hasSeenShopTour');
        if (!hasSeenTour) {
            // Start tour after a short delay
            setTimeout(() => {
                setStep(1);
            }, 1000);
        }
    }, []);

    useEffect(() => {
        if (step === 0) return;

        const updateTarget = () => {
            let targetId = '';
            if (step === 1) targetId = 'shop-contact-facebook-0';
            if (step === 2) targetId = 'shop-bank-card';

            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Give time for scroll to finish
                setTimeout(() => {
                    const rect = element.getBoundingClientRect();
                    setTargetRect(rect);
                }, 500);
            } else {
                // If element not found (e.g. no facebook), skip or finish
                if (step === 1) setStep(2);
                else handleFinish();
            }
        };

        updateTarget();
        window.addEventListener('resize', updateTarget);
        window.addEventListener('scroll', updateTarget);

        return () => {
            window.removeEventListener('resize', updateTarget);
            window.removeEventListener('scroll', updateTarget);
        };
    }, [step]);

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleFinish = () => {
        setStep(0);
        localStorage.setItem('hasSeenShopTour', 'true');
    };

    if (step === 0 || !targetRect) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
            {/* Backdrop with hole */}
            <div className="absolute inset-0 bg-black/60 transition-all duration-300">
                <div
                    style={{
                        position: 'absolute',
                        left: targetRect.left - 8,
                        top: targetRect.top - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                        borderRadius: '12px',
                    }}
                    className="pointer-events-auto ring-4 ring-white/30 transition-all duration-300"
                />
            </div>

            {/* Tooltip Content */}
            <div
                className="absolute pointer-events-auto transition-all duration-300 max-w-sm w-full p-4"
                style={{
                    left: Math.min(Math.max(16, targetRect.left), window.innerWidth - 300), // Keep roughly aligned but on screen
                    top: targetRect.bottom + 20, // Display below target
                }}
            >
                <div className="bg-white rounded-xl shadow-2xl p-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            {step === 1 ? (
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                                </div>
                            ) : (
                                <div className={`p-2 rounded-full ${isVerifiedPro ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {isVerifiedPro ? (
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                    )}
                                </div>
                            )}
                            <h3 className="font-bold text-lg text-slate-900">
                                {step === 1
                                    ? (isThai ? 'เพจจริงต้องลิงก์นี้' : 'Official Page Link')
                                    : (isVerifiedPro
                                        ? (isThai ? 'คุ้มครองเงินมัดจำ' : 'Deposit Protection')
                                        : (isThai ? 'ตรวจสอบบัญชีก่อนโอน' : 'Check Before Transfer')
                                    )
                                }
                            </h3>
                        </div>
                        <button
                            onClick={handleFinish}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-slate-600 mb-6 leading-relaxed">
                        {step === 1
                            ? (isThai
                                ? 'คลิกที่ปุ่มนี้เพื่อเข้าสู่เพจ Facebook ที่แท้จริงของร้านค้า หลีกเลี่ยงโจรที่สวมรอยใช้ชื่อเหมือนกัน'
                                : 'Click here to visit the shop\'s official Facebook page. Avoid scammers using fake pages.')
                            : (isVerifiedPro
                                ? (isThai
                                    ? 'มั่นใจกว่า! หากโอนเงินเข้าบัญชีนี้ แล้วโดนโกง RentSafe ชดเชยเงินมัดจำคืนให้สูงสุด 1,000 บาท'
                                    : 'Safe! Transfer to this account. If you get scammed, RentSafe covers your deposit up to 1,000 THB.')
                                : (isThai
                                    ? 'โปรดโอนเงินเข้าบัญชีนี้เท่านั้น! ห้ามโอนเข้าบัญชีบุคคลอื่นที่ไม่ตรงกับชื่อร้านหรือข้อมูลที่ลงทะเบียนไว้'
                                    : 'Transfer to this account only! Do not transfer to personal accounts that do not match the shop info.')
                            )
                        }
                    </p>

                    <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                            <div className={`h-1.5 w-6 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                            <div className={`h-1.5 w-6 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        </div>
                        <Button
                            onClick={step === 1 ? handleNext : handleFinish}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                        >
                            {step === 1
                                ? (isThai ? 'ถัดไป' : 'Next')
                                : (isThai ? 'เข้าใจแล้ว' : 'Got it')
                            }
                            {step === 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </div>
                    {/* Arrow pointing up */}
                    <div
                        className="absolute w-4 h-4 bg-white transform rotate-45 border-l border-t border-slate-100 -top-2 left-6"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
