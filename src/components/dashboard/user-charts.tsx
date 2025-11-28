'use client'

import * as React from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ChartData = {
    date: string
    amount: number // Revenue/Spending/Earnings
    packages: number
}

type UserChartsProps = {
    data: ChartData[]
    timeRange: string
    onTimeRangeChange: (range: string) => void
    amountLabel: string // "Spending", "Earnings", etc.
}

export function UserCharts({ data, timeRange, onTimeRangeChange, amountLabel }: UserChartsProps) {
    const [activeChart, setActiveChart] = React.useState<'amount' | 'packages'>('amount')

    return (
        <Card>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle>Analytics Overview</CardTitle>
                    <CardDescription>
                        {activeChart === 'amount' ? `Total ${amountLabel.toLowerCase()} over time` : 'Package volume trends'}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2 px-6 py-4 sm:py-0">
                    <div className="flex items-center rounded-lg border bg-background p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveChart('amount')}
                            className={cn(
                                "h-7 rounded-md px-3 text-xs font-medium",
                                activeChart === 'amount' && "bg-muted shadow-sm"
                            )}
                        >
                            {amountLabel}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveChart('packages')}
                            className={cn(
                                "h-7 rounded-md px-3 text-xs font-medium",
                                activeChart === 'packages' && "bg-muted shadow-sm"
                            )}
                        >
                            Packages
                        </Button>
                    </div>
                    <Select value={timeRange} onValueChange={onTimeRangeChange}>
                        <SelectTrigger
                            className="w-[120px] h-9 rounded-lg"
                            aria-label="Select time range"
                        >
                            <SelectValue placeholder="Last 7 days" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="90d" className="rounded-lg">
                                Last 90 days
                            </SelectItem>
                            <SelectItem value="30d" className="rounded-lg">
                                Last 30 days
                            </SelectItem>
                            <SelectItem value="7d" className="rounded-lg">
                                Last 7 days
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <div className="aspect-auto h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {activeChart === 'amount' ? (
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                    tickFormatter={(value) => {
                                        const date = new Date(value)
                                        return date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })
                                    }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                {amountLabel}
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                ${payload[0].value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Area
                                    dataKey="amount"
                                    type="monotone"
                                    fill="url(#fillAmount)"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        ) : (
                            <BarChart data={data}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                    tickFormatter={(value) => {
                                        const date = new Date(value)
                                        return date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })
                                    }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Packages
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {payload[0].value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Bar
                                    dataKey="packages"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={50}
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
