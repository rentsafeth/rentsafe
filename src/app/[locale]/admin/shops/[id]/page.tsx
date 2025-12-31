import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, ArrowLeft, Mail, User, Building2, CreditCard, FileText, Phone, MapPin, ExternalLink, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminShopDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch shop with owner profile
    const { data: shop, error } = await supabase
        .from('shops')
        .select(`
            *,
            profiles:owner_id (
                id,
                email,
                full_name,
                avatar_url
            )
        `)
        .eq('id', id)
        .single();

    if (error || !shop) {
        notFound();
    }

    // Fetch verification documents
    const { data: documents } = await supabase
        .from('verifications')
        .select('*')
        .eq('shop_id', id)
        .order('created_at', { ascending: false });

    async function updateStatus(formData: FormData) {
        'use server';
        const supabase = await createClient();
        const status = formData.get('status') as 'verified' | 'rejected';
        const notes = formData.get('notes') as string;
        const shopId = formData.get('shopId') as string;

        await supabase
            .from('shops')
            .update({
                verification_status: status,
                verification_notes: notes || null,
                verified_at: status === 'verified' ? new Date().toISOString() : null
            })
            .eq('id', shopId);

        revalidatePath(`/admin/shops/${shopId}`);
        revalidatePath('/admin/shops');
    }

    async function sendVerificationEmail(formData: FormData) {
        'use server';
        const supabase = await createClient();
        const shopId = formData.get('shopId') as string;
        const email = formData.get('email') as string;
        const status = formData.get('status') as string;
        const shopName = formData.get('shopName') as string;

        // In production, use a proper email service like Resend, SendGrid, etc.
        // For now, we'll just update the timestamp to track that email was sent
        await supabase
            .from('shops')
            .update({
                verification_email_sent_at: new Date().toISOString()
            })
            .eq('id', shopId);

        // TODO: Implement actual email sending here
        // Example with Resend:
        // await resend.emails.send({
        //     from: 'RentSafe <noreply@rentsafe.in.th>',
        //     to: email,
        //     subject: status === 'verified'
        //         ? `ร้าน ${shopName} ได้รับการยืนยันแล้ว!`
        //         : `การลงทะเบียนร้าน ${shopName} ต้องการเอกสารเพิ่มเติม`,
        //     html: `...email content...`
        // });

        revalidatePath(`/admin/shops/${shopId}`);
    }

    const owner = shop.profiles as { id: string; email: string; full_name: string; avatar_url: string } | null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/shops" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {shop.name}
                            <Badge variant={
                                shop.verification_status === 'verified' ? 'default' :
                                    shop.verification_status === 'rejected' ? 'destructive' : 'outline'
                            }>
                                {shop.verification_status === 'verified' ? 'ยืนยันแล้ว' :
                                    shop.verification_status === 'rejected' ? 'ถูกปฏิเสธ' : 'รอตรวจสอบ'}
                            </Badge>
                        </h1>
                        <p className="text-sm text-gray-500">
                            สมัครเมื่อ {new Date(shop.created_at).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
                <Link href={`/shop/${shop.id}`} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1">
                    ดูหน้าร้าน <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Owner Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-green-600" />
                            ข้อมูลเจ้าของ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {owner && (
                            <>
                                <div className="flex items-center gap-3">
                                    {owner.avatar_url ? (
                                        <Image
                                            src={owner.avatar_url}
                                            alt={owner.full_name || 'Avatar'}
                                            width={48}
                                            height={48}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{owner.full_name || 'ไม่ระบุชื่อ'}</p>
                                        <p className="text-sm text-gray-500">{owner.email}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-xs text-gray-500">Owner ID: {owner.id}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Business Type */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {shop.business_type === 'company' ? (
                                <Building2 className="w-5 h-5 text-blue-600" />
                            ) : (
                                <User className="w-5 h-5 text-green-600" />
                            )}
                            ประเภทธุรกิจ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={shop.business_type === 'company' ? 'default' : 'secondary'} className="text-base px-3 py-1">
                            {shop.business_type === 'company' ? 'นิติบุคคล / บริษัท' : 'บุคคลธรรมดา'}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-green-600" />
                            ข้อมูลติดต่อ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500">เบอร์โทร:</span>
                            <span className="font-medium">{shop.phone_number}</span>
                        </div>
                        {shop.line_id && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">LINE ID:</span>
                                <span className="font-medium">{shop.line_id}</span>
                            </div>
                        )}
                        {shop.facebook_url && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Facebook:</span>
                                <a href={shop.facebook_url} target="_blank" className="font-medium text-blue-600 hover:underline">
                                    {shop.facebook_url}
                                </a>
                            </div>
                        )}
                        {shop.website && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Website:</span>
                                <a href={shop.website} target="_blank" className="font-medium text-blue-600 hover:underline">
                                    {shop.website}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Service Area */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-600" />
                            พื้นที่ให้บริการ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {shop.service_provinces?.map((province: string) => (
                                <Badge key={province} variant="outline">{province}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Info */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-green-600" />
                            ข้อมูลธนาคาร
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">ธนาคาร</p>
                                <p className="font-semibold">{shop.bank_name || '-'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">เลขบัญชี</p>
                                <p className="font-semibold font-mono">{shop.bank_account_no || '-'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">ชื่อบัญชี</p>
                                <p className="font-semibold">{shop.bank_account_name || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Verification Documents */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            เอกสารยืนยันตัวตน
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ID Card */}
                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {shop.business_type === 'individual'
                                        ? 'สำเนาบัตรประชาชน'
                                        : 'สำเนาบัตรประชาชนผู้มีอำนาจลงนาม'}
                                </h4>
                                {shop.id_card_url ? (
                                    <div className="aspect-[4/3] relative bg-gray-100 rounded-lg overflow-hidden">
                                        <Image
                                            src={shop.id_card_url}
                                            alt="ID Card"
                                            fill
                                            className="object-contain"
                                        />
                                        <a
                                            href={shop.id_card_url}
                                            target="_blank"
                                            className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            ดูเต็ม
                                        </a>
                                    </div>
                                ) : (
                                    <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                            <p>ยังไม่ได้อัปโหลด</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Business License */}
                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    {shop.business_type === 'individual'
                                        ? 'ทะเบียนพาณิชย์'
                                        : 'หนังสือรับรองบริษัท'}
                                </h4>
                                {shop.business_license_url ? (
                                    <div className="aspect-[4/3] relative bg-gray-100 rounded-lg overflow-hidden">
                                        <Image
                                            src={shop.business_license_url}
                                            alt="Business License"
                                            fill
                                            className="object-contain"
                                        />
                                        <a
                                            href={shop.business_license_url}
                                            target="_blank"
                                            className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            ดูเต็ม
                                        </a>
                                    </div>
                                ) : (
                                    <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                            <p>ยังไม่ได้อัปโหลด</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bank Book (optional) */}
                            {shop.bank_book_url && (
                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        สมุดบัญชีธนาคาร
                                    </h4>
                                    <div className="aspect-[4/3] relative bg-gray-100 rounded-lg overflow-hidden">
                                        <Image
                                            src={shop.bank_book_url}
                                            alt="Bank Book"
                                            fill
                                            className="object-contain"
                                        />
                                        <a
                                            href={shop.bank_book_url}
                                            target="_blank"
                                            className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            ดูเต็ม
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Documents from verifications table */}
                        {documents && documents.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="font-medium mb-4">เอกสารเพิ่มเติม</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="border rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline">{doc.document_type}</Badge>
                                                <Badge variant={
                                                    doc.status === 'approved' ? 'default' :
                                                        doc.status === 'rejected' ? 'destructive' : 'outline'
                                                }>
                                                    {doc.status}
                                                </Badge>
                                            </div>
                                            <a
                                                href={doc.document_url}
                                                target="_blank"
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                ดูเอกสาร
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Verification Notes */}
                {shop.verification_notes && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>หมายเหตุการตรวจสอบ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{shop.verification_notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>ดำเนินการ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Status Update Form */}
                            {shop.verification_status === 'pending' && (
                                <form action={updateStatus} className="space-y-4">
                                    <input type="hidden" name="shopId" value={shop.id} />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            หมายเหตุ (ถ้ามี)
                                        </label>
                                        <textarea
                                            name="notes"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="เพิ่มหมายเหตุสำหรับการตรวจสอบ..."
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            type="submit"
                                            name="status"
                                            value="verified"
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            อนุมัติ
                                        </Button>
                                        <Button
                                            type="submit"
                                            name="status"
                                            value="rejected"
                                            variant="destructive"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            ปฏิเสธ
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {/* Send Email Button */}
                            {owner && shop.verification_status !== 'pending' && (
                                <form action={sendVerificationEmail}>
                                    <input type="hidden" name="shopId" value={shop.id} />
                                    <input type="hidden" name="email" value={owner.email} />
                                    <input type="hidden" name="status" value={shop.verification_status} />
                                    <input type="hidden" name="shopName" value={shop.name} />

                                    <div className="flex items-center gap-4">
                                        <Button type="submit" variant="outline">
                                            <Mail className="w-4 h-4 mr-2" />
                                            ส่งอีเมลแจ้งผลการตรวจสอบ
                                        </Button>
                                        {shop.verification_email_sent_at && (
                                            <p className="text-sm text-gray-500">
                                                ส่งอีเมลล่าสุดเมื่อ {new Date(shop.verification_email_sent_at).toLocaleDateString('th-TH', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            )}

                            {/* Already verified/rejected */}
                            {shop.verification_status !== 'pending' && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        สถานะ: <span className={`font-medium ${shop.verification_status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                                            {shop.verification_status === 'verified' ? 'ยืนยันแล้ว' : 'ถูกปฏิเสธ'}
                                        </span>
                                        {shop.verified_at && (
                                            <> เมื่อ {new Date(shop.verified_at).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
