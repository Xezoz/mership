'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'

const data3Months = [
    { date: 'Jun 23', value: 2400 },
    { date: 'Jun 24', value: 1398 },
    { date: 'Jun 25', value: 3800 },
    { date: 'Jun 26', value: 3908 },
    { date: 'Jun 27', value: 4800 },
    { date: 'Jun 28', value: 3800 },
    { date: 'Jun 29', value: 4300 },
]

const data30Days = [
    { date: 'Day 1', value: 2000 },
    { date: 'Day 5', value: 2780 },
    { date: 'Day 10', value: 1890 },
    { date: 'Day 15', value: 2390 },
    { date: 'Day 20', value: 3490 },
    { date: 'Day 25', value: 2000 },
    { date: 'Day 30', value: 4300 },
]

const data7Days = [
    { date: 'Mon', value: 3000 },
    { date: 'Tue', value: 2000 },
    { date: 'Wed', value: 2780 },
    { date: 'Thu', value: 1890 },
    { date: 'Fri', value: 2390 },
    { date: 'Sat', value: 3490 },
    { date: 'Sun', value: 4300 },
]

export function VisitorChart() {
    const [period, setPeriod] = useState('3months')

    const data =
        period === '3months'
            ? data3Months
            : period === '30days'
                ? data30Days
                : data7Days

    return (
        <Card className="col-span-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Total Visitors</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Total for the last {period === '3months' ? '3 months' : period === '30days' ? '30 days' : '7 days'}
                        </p>
                    </div>
                    <Tabs value={period} onValueChange={setPeriod}>
                        <TabsList>
                            <TabsTrigger value="3months">Last 3 months</TabsTrigger>
                            <TabsTrigger value="30days">Last 30 days</TabsTrigger>
                            <TabsTrigger value="7days">Last 7 days</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
