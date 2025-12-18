import { Badge } from '@/components/ui/badge'
import { REPORT_STATUS, type ReportStatus } from '@/lib/constants'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: ReportStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = REPORT_STATUS[status]

  const icons = {
    pending: Clock,
    verified: CheckCircle,
    rejected: XCircle,
  }

  const Icon = icons[status]

  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.textColor} border-0 ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      }`}
    >
      <Icon className={`mr-1 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
      {config.label}
    </Badge>
  )
}
