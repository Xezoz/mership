import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formattedValue}</div>
                <p className="text-xs text-muted-foreground">
                    {!isNeutral && (
                        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                            {isPositive ? '+' : ''}
                            {formatPercentage(change)}{' '}
                        </span>
                    )}
                    {changeLabel}
                </p>
            </CardContent>
        </Card>
    )
}
