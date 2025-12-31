'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, ExternalLink, Eye, User, Building2, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

interface Shop {
    id: string;
    name: string;
    verification_status: string;
    business_type: string;
    phone_number: string;
    bank_name: string | null;
    bank_account_no: string;
    bank_account_name: string;
    service_provinces: string[] | null;
    created_at: string;
    id_card_url: string | null;
    business_license_url: string | null;
    profiles: {
        email: string;
        full_name: string;
    } | null;
}

interface ShopsListProps {
    shops: Shop[];
}

export default function ShopsList({ shops }: ShopsListProps) {
    const router = useRouter();
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        shopId: string;
        shopName: string;
        action: 'verified' | 'rejected';
    }>({
        open: false,
        shopId: '',
        shopName: '',
        action: 'verified'
    });
    const [loading, setLoading] = useState(false);

    const handleAction = (shopId: string, shopName: string, action: 'verified' | 'rejected') => {
        console.log('[ShopsList] Opening confirm dialog:', { shopId, shopName, action });
        setConfirmDialog({
            open: true,
            shopId,
            shopName,
            action
        });
    };

    const handleConfirm = async () => {
        console.log('[ShopsList] Confirming action:', confirmDialog);
        setLoading(true);

        try {
            console.log('[ShopsList] Calling API...');
            const response = await fetch('/api/admin/shops/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId: confirmDialog.shopId,
                    status: confirmDialog.action
                })
            });

            const result = await response.json();
            console.log('[ShopsList] API response:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update status');
            }

            console.log('[ShopsList] Update completed successfully');

            // Close dialog and refresh
            setConfirmDialog({ open: false, shopId: '', shopName: '', action: 'verified' });
            router.refresh();
        } catch (error) {
            console.error('[ShopsList] Error updating shop status:', error);
            alert('เกิดข้อผิดพลาด: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                {shops.map((shop) => {
                    const owner = shop.profiles;
                    const hasDocuments = shop.id_card_url || shop.business_license_url;

                    return (
                        <Card key={shop.id} className={shop.verification_status === 'pending' ? 'border-yellow-200 bg-yellow-50/30' : ''}>
                            <CardContent className="pt-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h3 className="text-lg font-bold">{shop.name}</h3>
                                            <Badge variant={
                                                shop.verification_status === 'verified' ? 'default' :
                                                    shop.verification_status === 'rejected' ? 'destructive' : 'outline'
                                            }>
                                                {shop.verification_status === 'verified' ? 'ยืนยันแล้ว' :
                                                    shop.verification_status === 'rejected' ? 'ถูกปฏิเสธ' : 'รอตรวจสอบ'}
                                            </Badge>
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                {shop.business_type === 'company' ? (
                                                    <><Building2 className="w-3 h-3" /> นิติบุคคล</>
                                                ) : (
                                                    <><User className="w-3 h-3" /> บุคคลธรรมดา</>
                                                )}
                                            </Badge>
                                            {hasDocuments && (
                                                <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200">
                                                    <FileText className="w-3 h-3" /> มีเอกสาร
                                                </Badge>
                                            )}
                                        </div>

                                        {owner && (
                                            <p className="text-sm text-gray-500 mb-2">
                                                เจ้าของ: {owner.full_name || 'ไม่ระบุ'} ({owner.email})
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <span className="text-gray-600">
                                                <span className="text-gray-400">โทร:</span> {shop.phone_number}
                                            </span>
                                            {shop.bank_name && (
                                                <span className="text-gray-600">
                                                    <span className="text-gray-400">ธนาคาร:</span> {shop.bank_name}
                                                </span>
                                            )}
                                            <span className="text-gray-600">
                                                <span className="text-gray-400">บัญชี:</span> {shop.bank_account_no} ({shop.bank_account_name})
                                            </span>
                                        </div>

                                        {shop.service_provinces && shop.service_provinces.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {shop.service_provinces.slice(0, 5).map((province: string) => (
                                                    <Badge key={province} variant="outline" className="text-xs">
                                                        {province}
                                                    </Badge>
                                                ))}
                                                {shop.service_provinces.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{shop.service_provinces.length - 5} อื่นๆ
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        <p className="text-xs text-gray-400 mt-2">
                                            สมัครเมื่อ {new Date(shop.created_at).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Link href={`/admin/shops/${shop.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-1" /> ดูรายละเอียด
                                            </Button>
                                        </Link>

                                        {shop.verification_status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleAction(shop.id, shop.name, 'verified')}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" /> อนุมัติ
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleAction(shop.id, shop.name, 'rejected')}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> ปฏิเสธ
                                                </Button>
                                            </>
                                        )}

                                        <Link href={`/shop/${shop.id}`} target="_blank">
                                            <Button variant="ghost" size="sm">
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {shops.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-500">
                            <div className="w-12 h-12 mx-auto mb-4 text-gray-300 flex items-center justify-center">
                                <Building2 className="w-12 h-12" />
                            </div>
                            <p>ยังไม่มีร้านค้าที่ลงทะเบียน</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog.action === 'verified' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.action === 'verified'
                                ? `คุณต้องการอนุมัติร้านค้า "${confirmDialog.shopName}" ใช่หรือไม่?`
                                : `คุณต้องการปฏิเสธร้านค้า "${confirmDialog.shopName}" ใช่หรือไม่?`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading}
                            className={confirmDialog.action === 'verified' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {confirmDialog.action === 'verified' ? 'อนุมัติ' : 'ปฏิเสธ'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
