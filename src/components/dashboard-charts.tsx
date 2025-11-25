'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type DashboardChartsProps = {
    stats: {
        total: number
        pending: number
        in_transit: number
        delivered: number
        received: number
    }
}

const chartConfig = {
    pending: {
        label: 'Pending',
        color: 'hsl(var(--foreground))',
    },
    received: {
        label: 'Received',
        color: 'hsl(var(--muted-foreground))',
    },
    in_transit: {
        label: 'In Transit',
        color: 'hsl(var(--border))',
    },
    delivered: {
        label: 'Delivered',
        color: 'hsl(var(--muted))',
    },
} satisfies ChartConfig

export function DashboardCharts({ stats }: DashboardChartsProps) {
    const [timeRange, setTimeRange] = React.useState('7d')

    // Generate time-series data - show zeros for history, actual values for today only
    const generateChartData = (days: number) => {
        const data = []
        const today = new Date()

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)

            // Only show actual values for today, zeros for all historical dates
            const isToday = i === 0

            data.push({
                date: date.toISOString().split('T')[0],
                pending: isToday ? stats.pending : 0,
                received: isToday ? stats.received : 0,
                in_transit: isToday ? stats.in_transit : 0,
                delivered: isToday ? stats.delivered : 0,
            })
        }

        return data
    }

    const getDaysFromRange = (range: string) => {
        switch (range) {
            case '7d': return 7
            case '30d': return 30
            case '90d': return 90
            default: return 7
        }
    }

    const chartData = generateChartData(getDaysFromRange(timeRange))

    return (
        <Card>
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Shipment Overview</CardTitle>
                    <CardDescription>
                        Package status trends over time
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="w-[160px] rounded-lg sm:ml-auto"
                        aria-label="Select a value"
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
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-pending)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-pending)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient id="fillReceived" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-received)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-received)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient id="fillInTransit" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-in_transit)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-in_transit)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient id="fillDelivered" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-delivered)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-delivered)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
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
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            dataKey="delivered"
                            type="natural"
                            fill="url(#fillDelivered)"
                            stroke="var(--color-delivered)"
                            stackId="a"
                        />
                        <Area
                            dataKey="in_transit"
                            type="natural"
                            fill="url(#fillInTransit)"
                            stroke="var(--color-in_transit)"
                            stackId="a"
                        />
                        <Area
                            dataKey="received"
                            type="natural"
                            fill="url(#fillReceived)"
                            stroke="var(--color-received)"
                            stackId="a"
                        />
                        <Area
                            dataKey="pending"
                            type="natural"
                            fill="url(#fillPending)"
                            stroke="var(--color-pending)"
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
