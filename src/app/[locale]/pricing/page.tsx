'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Crown,
    Check,
    X,
    Shield,
    Search,
    Phone,
    MessageCircle,
    Bell,
    Zap,
    Star,
    ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const plans = [
    {
        name: 'ฟรี',
        slug: 'free',
        price: 0,
        period: '',
        description: 'สำหรับเริ่มต้นใช้งาน',
        popular: false,
        features: [
            { text: 'ลงทะเบียนร้านค้า', included: true },
            { text: 'รับรีวิวจากลูกค้า', included: true },
            { text: 'ค้นหา Blacklist 3 ครั้ง/วัน', included: true },
            { text: 'รายงานลูกค้าเข้า Blacklist', included: true },
            { text: 'ค้นหา Blacklist ไม่จำกัด', included: false },
            { text: 'ปุ่มโทร/LINE ในผลค้นหา', included: false },
            { text: 'Badge "ร้านรับรอง"', included: false },
            { text: 'รับประกันมัดจำ ฿1,000', included: false },
            { text: 'แจ้งเตือน Blacklist ใหม่', included: false },
        ],
    },
    {
        name: 'ร้านรับรอง',
        slug: 'pro_monthly',
        price: 99,
        period: '/เดือน',
        description: 'สำหรับร้านที่ต้องการความน่าเชื่อถือ',
        popular: true,
        features: [
            { text: 'ลงทะเบียนร้านค้า', included: true },
            { text: 'รับรีวิวจากลูกค้า', included: true },
            { text: 'ค้นหา Blacklist ไม่จำกัด', included: true },
            { text: 'รายงานลูกค้าเข้า Blacklist', included: true },
            { text: 'ปุ่มโทร/LINE ในผลค้นหา', included: true },
            { text: 'Badge "ร้านรับรอง" + มงกุฏ', included: true },
            { text: 'รับประกันมัดจำ ฿1,000', included: true },
            { text: 'แจ้งเตือน Blacklist ใหม่', included: true },
            { text: 'ประหยัด 17% เมื่อจ่ายรายปี', included: false, highlight: true },
        ],
    },
    {
        name: 'ร้านรับรอง รายปี',
        slug: 'pro_yearly',
        price: 999,
        period: '/ปี',
        originalPrice: 1188,
        description: 'ประหยัด 16% เมื่อจ่ายรายปี',
        popular: false,
        features: [
            { text: 'ลงทะเบียนร้านค้า', included: true },
            { text: 'รับรีวิวจากลูกค้า', included: true },
            { text: 'ค้นหา Blacklist ไม่จำกัด', included: true },
            { text: 'รายงานลูกค้าเข้า Blacklist', included: true },
            { text: 'ปุ่มโทร/LINE ในผลค้นหา', included: true },
            { text: 'Badge "ร้านรับรอง" + มงกุฏ', included: true },
            { text: 'รับประกันมัดจำ ฿1,000', included: true },
            { text: 'แจ้งเตือน Blacklist ใหม่', included: true },
            { text: 'ประหยัด ฿189/ปี', included: true, highlight: true },
        ],
    },
];

const benefits = [
    {
        icon: Crown,
        title: 'Badge "ร้านรับรอง"',
        description: 'แสดงให้ลูกค้าเห็นว่าร้านของคุณผ่านการรับรองจาก RentSafe',
    },
    {
        icon: Shield,
        title: 'รับประกันมัดจำ ฿1,000',
        description: 'ลูกค้ามั่นใจมากขึ้น เพราะมีการคุ้มครองเมื่อจองผ่าน RentSafe',
    },
    {
        icon: Search,
        title: 'ค้นหา Blacklist ไม่จำกัด',
        description: 'ตรวจสอบประวัติลูกค้าก่อนเช่าได้ไม่จำกัดจำนวน',
    },
    {
        icon: Phone,
        title: 'ปุ่มโทร/LINE ในผลค้นหา',
        description: 'ลูกค้าติดต่อร้านได้โดยตรงจากหน้าค้นหา',
    },
    {
        icon: Bell,
        title: 'แจ้งเตือน Blacklist ใหม่',
        description: 'รับแจ้งเตือนทันทีเมื่อมีลูกค้าใหม่ถูกเพิ่มเข้า Blacklist',
    },
    {
        icon: Star,
        title: 'แสดงอันดับต้น',
        description: 'ร้านรับรองจะถูกแสดงในอันดับต้นของผลการค้นหา',
    },
];

export default function PricingPage() {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const handleSelectPlan = (slug: string) => {
        if (slug === 'free') {
            window.location.href = '/register/shop';
        } else {
            setSelectedPlan(slug);
            // In production, redirect to payment page
            window.location.href = `/dashboard/subscription?plan=${slug}`;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <Badge className="bg-yellow-100 text-yellow-700 mb-4">
                        <Crown className="w-4 h-4 mr-1" />
                        เลือกแพ็คเกจที่เหมาะกับคุณ
                    </Badge>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        ยกระดับร้านของคุณด้วย
                        <span className="text-yellow-600"> "ร้านรับรอง"</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        เพิ่มความน่าเชื่อถือ เข้าถึงลูกค้ามากขึ้น และป้องกันความเสี่ยงจากลูกค้าไม่ดี
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {plans.map((plan) => (
                        <Card
                            key={plan.slug}
                            className={`relative overflow-hidden transition-all hover:shadow-lg ${
                                plan.popular
                                    ? 'border-2 border-yellow-400 shadow-lg scale-105'
                                    : 'border border-gray-200'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-1 text-sm font-semibold">
                                    แนะนำ
                                </div>
                            )}
                            <CardHeader className={plan.popular ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : ''}>
                                <div className="flex items-center gap-2 mb-2">
                                    {plan.slug !== 'free' && (
                                        <Crown className="w-6 h-6 text-yellow-500" />
                                    )}
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                </div>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold text-gray-900">
                                        ฿{plan.price.toLocaleString()}
                                    </span>
                                    <span className="text-gray-500">{plan.period}</span>
                                    {plan.originalPrice && (
                                        <p className="text-sm text-gray-400 line-through mt-1">
                                            ฿{plan.originalPrice.toLocaleString()}/ปี
                                        </p>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, idx) => (
                                        <li
                                            key={idx}
                                            className={`flex items-start gap-2 ${
                                                feature.highlight ? 'text-green-600 font-medium' : ''
                                            }`}
                                        >
                                            {feature.included ? (
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                                            )}
                                            <span className={!feature.included ? 'text-gray-400' : ''}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    onClick={() => handleSelectPlan(plan.slug)}
                                    className={`w-full ${
                                        plan.popular
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                                            : plan.slug === 'free'
                                            ? 'bg-gray-900 hover:bg-gray-800'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {plan.slug === 'free' ? 'เริ่มต้นฟรี' : 'เลือกแพ็คเกจนี้'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Benefits Section */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        สิทธิพิเศษสำหรับ "ร้านรับรอง"
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benefits.map((benefit, idx) => {
                            const Icon = benefit.icon;
                            return (
                                <Card key={idx} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-yellow-100 rounded-lg">
                                                <Icon className="w-6 h-6 text-yellow-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-1">
                                                    {benefit.title}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {benefit.description}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Guarantee Section */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 mb-16">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="p-4 bg-green-100 rounded-full">
                                <Shield className="w-12 h-12 text-green-600" />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    รับประกันคืนเงินมัดจำสูงสุด ฿1,000
                                </h3>
                                <p className="text-gray-600">
                                    หากลูกค้าจองผ่าน RentSafe กับร้านรับรอง แล้วถูกฉ้อโกง เราจะคืนเงินมัดจำให้สูงสุด ฿1,000
                                </p>
                            </div>
                            <Link href="/guarantee-terms">
                                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                                    อ่านเงื่อนไข
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        คำถามที่พบบ่อย
                    </h2>
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-6">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    ชำระเงินได้อย่างไร?
                                </h4>
                                <p className="text-gray-600">
                                    รองรับการชำระผ่าน PromptPay QR Code และโอนผ่านธนาคาร หลังจากชำระเงินแล้วระบบจะเปิดใช้งานภายใน 24 ชั่วโมง
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    สามารถยกเลิกได้ไหม?
                                </h4>
                                <p className="text-gray-600">
                                    สามารถยกเลิกได้ทุกเมื่อ โดยแพ็คเกจจะยังใช้งานได้จนกว่าจะหมดอายุ ไม่มีการคืนเงินสำหรับช่วงเวลาที่เหลือ
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    รับประกันมัดจำทำงานอย่างไร?
                                </h4>
                                <p className="text-gray-600">
                                    หากลูกค้าจองผ่านระบบ RentSafe กับร้านรับรอง และถูกฉ้อโกง สามารถยื่นเรื่องขอคืนเงินมัดจำได้ภายใน 7 วัน พร้อมหลักฐานการชำระเงิน
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <p className="text-gray-600 mb-4">มีคำถามเพิ่มเติม?</p>
                    <Link href="/contact">
                        <Button variant="outline" size="lg">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            ติดต่อเรา
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
