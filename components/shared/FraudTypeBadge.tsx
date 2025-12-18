import { Badge } from '@/components/ui/badge'
import { FRAUD_TYPES, type FraudTypeId } from '@/lib/constants'
import {
  Ban,
  CarFront,
  Banknote,
  HandCoins,
  Car,
  MoreHorizontal,
} from 'lucide-react'

interface FraudTypeBadgeProps {
  type: FraudTypeId
  size?: 'sm' | 'md'
}

const iconMap = {
  Ban,
  CarFront,
  Banknote,
  HandCoins,
  Car,
  MoreHorizontal,
}

const colorMap = {
  red: 'bg-red-100 text-red-800',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
}

export function FraudTypeBadge({ type, size = 'md' }: FraudTypeBadgeProps) {
  const config = FRAUD_TYPES.find((t) => t.id === type)
  if (!config) return null

  const Icon = iconMap[config.icon as keyof typeof iconMap]
  const colorClass = colorMap[config.color as keyof typeof colorMap]

  return (
    <Badge
      variant="outline"
      className={`${colorClass} border-0 ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      }`}
    >
      <Icon className={`mr-1 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
      {config.label}
    </Badge>
  )
}
