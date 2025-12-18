import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { FraudTypeBadge } from '@/components/shared/FraudTypeBadge'
import type { ScamReport } from '@/types'
import { MapPin, Phone, Facebook, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

interface ReportCardProps {
  report: ScamReport
}

export function ReportCard({ report }: ReportCardProps) {
  const timeAgo = formatDistanceToNow(new Date(report.created_at), {
    addSuffix: true,
    locale: th,
  })

  // Mask phone number: 081-xxx-xxxx
  const maskedPhone = report.phone
    ? report.phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-xxx-$3')
    : null

  return (
    <Link href={`/report/${report.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {report.shop_name}
              </h3>
              <p className="text-sm text-muted-foreground">{timeAgo}</p>
            </div>
            <StatusBadge status={report.status} size="sm" />
          </div>

          {/* Fraud Type */}
          <div className="mb-3">
            <FraudTypeBadge type={report.fraud_type} size="sm" />
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {/* Province */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{report.province}</span>
            </div>

            {/* Phone */}
            {maskedPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{maskedPhone}</span>
              </div>
            )}

            {/* Facebook */}
            {report.facebook_page_name && (
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{report.facebook_page_name}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center gap-1 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">
                {report.verified_count} คนยืนยัน
              </span>
            </div>
            {report.damage_amount > 0 && (
              <Badge variant="secondary" className="text-xs">
                ฿{report.damage_amount.toLocaleString()}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
