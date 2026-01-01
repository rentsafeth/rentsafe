'use client';

import {
    Receipt,
    FileText,
    Banknote,
    CreditCard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ShopServiceBadgesProps {
    canIssueTaxInvoice: boolean;
    canIssueWithholdingTax: boolean;
    payOnPickup: boolean;
    acceptCreditCard: boolean;
}

export default function ShopServiceBadges({
    canIssueTaxInvoice,
    canIssueWithholdingTax,
    payOnPickup,
    acceptCreditCard
}: ShopServiceBadgesProps) {
    const services = [
        {
            id: 'tax_invoice',
            show: canIssueTaxInvoice,
            label: 'ใบกำกับภาษี',
            fullName: 'ออกใบกำกับภาษีได้',
            description: 'สำหรับลูกค้าที่ต้องการใบกำกับภาษี VAT 7%',
            icon: Receipt,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            id: 'withholding_tax',
            show: canIssueWithholdingTax,
            label: 'หัก ณ ที่จ่าย',
            fullName: 'ออกหนังสือหัก ณ ที่จ่ายได้',
            description: 'สำหรับลูกค้าที่ต้องการหักภาษี ณ ที่จ่าย',
            icon: FileText,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        {
            id: 'pay_on_pickup',
            show: payOnPickup,
            label: 'จ่ายตอนรับรถ',
            fullName: 'รับชำระเงินตอนรับรถ',
            description: 'ลูกค้าสามารถจ่ายเงินสดหรือโอนตอนมารับรถได้',
            icon: Banknote,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200'
        },
        {
            id: 'credit_card',
            show: acceptCreditCard,
            label: 'บัตรเครดิต',
            fullName: 'รับบัตรเครดิต',
            description: 'รองรับการชำระเงินด้วยบัตรเครดิต/เดบิต',
            icon: CreditCard,
            color: 'text-violet-600',
            bgColor: 'bg-violet-50',
            borderColor: 'border-violet-200'
        }
    ];

    const activeServices = services.filter(s => s.show);

    if (activeServices.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 items-center">
            <TooltipProvider>
                {activeServices.map((service) => (
                    <Tooltip key={service.id}>
                        <TooltipTrigger asChild>
                            <Badge
                                variant="outline"
                                className={`${service.bgColor} ${service.color} ${service.borderColor} cursor-help px-2 py-0.5 flex items-center gap-1.5 hover:shadow-sm transition-all border-dashed`}
                            >
                                <service.icon className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium whitespace-nowrap">{service.label}</span>
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs p-3 shadow-xl border-slate-200">
                            <div className="space-y-1">
                                <p className="font-bold text-sm flex items-center gap-2">
                                    <service.icon className={`w-4 h-4 ${service.color}`} />
                                    {service.fullName}
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed">{service.description}</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    );
}
