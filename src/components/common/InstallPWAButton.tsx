'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function InstallPWAButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = () => {
        setShowModal(true);
    };

    const confirmInstall = async () => {
        setShowModal(false);
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    // Don't show if already installed or not supported (no deferredPrompt yet)
    // Note: On iOS, deferredPrompt will never fire, so we might want to show a manual instruction modal instead.
    // But for now, let's stick to the standard flow.
    if (!deferredPrompt && !isInstalled) return null;
    if (isInstalled) return null;

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleInstallClick}
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                title="ติดตั้งแอป RentSafe"
            >
                <Download className="w-6 h-6" />
            </Button>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-blue-600" />
                            ติดตั้งแอป RentSafe
                        </DialogTitle>
                        <DialogDescription>
                            ติดตั้งแอปพลิเคชัน RentSafe บนหน้าจอหลักของคุณเพื่อการใช้งานที่สะดวกรวดเร็วและเข้าถึงได้ง่ายขึ้น
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <Download className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    <DialogFooter className="flex flex-row gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={confirmInstall} className="bg-blue-600 hover:bg-blue-700 text-white">
                            ติดตั้งเลย
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
