import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
            <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <WifiOff className="w-12 h-12 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                    ไม่มีการเชื่อมต่ออินเทอร์เน็ต
                </h1>
                <p className="text-slate-600 mb-6">
                    กรุณาตรวจสอบการเชื่อมต่อของคุณแล้วลองใหม่อีกครั้ง
                </p>
                <Button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    ลองใหม่อีกครั้ง
                </Button>
            </div>
        </div>
    );
}
