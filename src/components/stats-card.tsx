import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'

interface StatsCardProps {
    title: string
    value: string | number
    change: number
    changeLabel: string
    description: string
    icon: LucideIcon
    type?: 'currency' | 'number' | 'percentage'
}

export function StatsCard({
    title,
    value,
    change,
    changeLabel,
    description,
    icon: Icon,
    type = 'number',
}: StatsCardProps) {
    const isPositive = change > 0
    const isNegative = change < 0
    const isNeutral = change === 0

    const formattedValue =
        type === 'currency'
            ? formatCurrency(Number(value))
            : type === 'percentage'
                ? `${value}%`
                : formatNumber(Number(value))

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                </div>
                {!isNeutral && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{formatPercentage(change)}</span>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    <div className="text-3xl font-bold">{formattedValue}</div>
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-muted-foreground">{changeLabel}</p>
                        {!isNeutral && (
                            <span className="inline-flex items-center text-xs text-muted-foreground">
                                {isPositive ? '↗' : '↘'}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}
