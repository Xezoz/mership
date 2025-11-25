'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Package, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { DashboardCharts } from '@/components/dashboard-charts'
import { Database } from '@/lib/supabase/database.types'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

type DashboardStats = {
    balance: number
    totalShipments: number
    pendingShipments: number
    recentTransactions: Array<{
        id: string
        type: string
        amount: number
        status: string
        created_at: string
        description: string | null
    }>
    shipmentStats: {
        total: number
        pending: number
        in_transit: number
        delivered: number
        received: number
    }
    recentActivity: {
        id: string
        status: string
        tracking_number: string
        created_at: string
        updated_at: string
    }[]
}

export default function DashboardPage() {
    const supabase = createBrowserClient()
    const { isCustomer, isReshipper } = useUserRole()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        balance: 0,
        totalShipments: 0,
        pendingShipments: 0,
        recentTransactions: [],
        shipmentStats: {
            total: 0,
            pending: 0,
            in_transit: 0,
            delivered: 0,
            received: 0,
        },
        recentActivity: []
    })

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Execute all independent queries in parallel
            const [
                profileResult,
                shipmentsCountResult,
                pendingCountResult,
                inTransitCountResult,
                deliveredCountResult,
                receivedCountResult,
                recentActivityResult,
                transactionsResult
            ] = await Promise.all([
                // 1. Fetch balance
                supabase.from('profiles').select('balance').eq('id', user.id).single(),

                // 2. Total shipments count
                supabase.from('shipments')
                    .select('id', { count: 'exact', head: true })
                    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),

                // 3. Pending count
                supabase.from('shipments')
                    .select('id', { count: 'exact', head: true })
                    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                    .eq('status', 'pending'),

                // 4. In Transit count
                supabase.from('shipments')
                    .select('id', { count: 'exact', head: true })
                    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                    .eq('status', 'in_transit'),

                // 5. Delivered count
                supabase.from('shipments')
                    .select('id', { count: 'exact', head: true })
                    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                    .eq('status', 'delivered'),

                // 6. Received count
                supabase.from('shipments')
                    .select('id', { count: 'exact', head: true })
                    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                    .eq('status', 'received'),

                // 7. Recent activity (limit 5)
                supabase.from('shipments')
                    .select('id, status, tracking_number, created_at, updated_at')
                    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                    .order('updated_at', { ascending: false })
                    .limit(5),

                // 8. Recent transactions (limit 5)
                supabase.from('transactions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5)
            ])

            const shipmentStats = {
                total: shipmentsCountResult.count || 0,
                pending: pendingCountResult.count || 0,
                in_transit: inTransitCountResult.count || 0,
                delivered: deliveredCountResult.count || 0,
                received: receivedCountResult.count || 0,
            }

            // Calculate active shipments (pending + in_transit + received)
            const activeShipments = shipmentStats.pending + shipmentStats.in_transit + shipmentStats.received

            setStats({
                balance: profileResult.data?.balance || 0,
                totalShipments: shipmentStats.total,
                pendingShipments: activeShipments,
                recentTransactions: transactionsResult.data || [],
                shipmentStats,
                recentActivity: (recentActivityResult.data as any[]) || []
            })
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        // Monochrome only - no colors
        return 'bg-muted text-foreground'
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Loading your overview...</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Welcome back! Here's an overview of your account.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Account Balance"
                    value={stats.balance}
                    change={0}
                    changeLabel="Available funds"
                    description="Your current balance"
                    icon={DollarSign}
                    type="currency"
                />
                <StatsCard
                    title="Total Shipments"
                    value={stats.totalShipments}
                    change={0}
                    changeLabel="All time"
                    description="Packages processed"
                    icon={Package}
                    type="number"
                />
                <StatsCard
                    title="Active Shipments"
                    value={stats.pendingShipments}
                    change={0}
                    changeLabel="In progress"
                    description="Currently being processed"
                    icon={Clock}
                    type="number"
                />
                <StatsCard
                    title="Recent Activity"
                    value={stats.recentTransactions.length}
                    change={0}
                    changeLabel="Last 5 transactions"
                    description="Transaction history"
                    icon={TrendingUp}
                    type="number"
                />
            </div>

            {/* Shipment Overview Chart */}
            <DashboardCharts stats={stats.shipmentStats} />

            {/* Transaction History and Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Transactions */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Your latest payment activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.recentTransactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No transactions yet
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-full bg-muted">
                                                {tx.type === 'deposit' ? (
                                                    <ArrowDownLeft className="h-4 w-4 text-foreground" />
                                                ) : (
                                                    <ArrowUpRight className="h-4 w-4 text-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium capitalize">{tx.type}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-foreground">
                                                {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                                            </span>
                                            <Badge variant="outline" className="capitalize">
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats.recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent activity</p>
                            ) : (
                                stats.recentActivity.map((item) => (
                                    <div key={item.id} className="flex items-center">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {item.tracking_number}
                                            </p>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {item.status.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.updated_at || item.created_at), { addSuffix: true })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
