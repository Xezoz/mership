'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/stats-card'
import { DollarSign, Users, ArrowUpRight, ArrowDownLeft, Clock, Loader2, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Database } from '@/lib/supabase/database.types'
import { ModeratorCharts } from './moderator-charts'
import { TopReshippersCard } from './top-reshippers-card'
import { subDays, format, isSameDay } from 'date-fns'

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
    profiles: {
        full_name: string | null
        email: string | null
    } | null
}

type ChartData = {
    date: string
    revenue: number
    packages: number
}

type TopReshipper = {
    id: string
    full_name: string | null
    email: string | null
    shipment_count: number
    rank: number
}

export function ModeratorDashboard() {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingWithdrawalsCount: 0,
        activeReshippersCount: 0
    })
    const [withdrawals, setWithdrawals] = useState<Transaction[]>([])
    const [chartData, setChartData] = useState<ChartData[]>([])
    const [topReshippers, setTopReshippers] = useState<TopReshipper[]>([])
    const [timeRange, setTimeRange] = useState('7d')
    const [processingId, setProcessingId] = useState<string | null>(null)


    useEffect(() => {
        fetchModeratorData()
    }, [timeRange])

    const fetchModeratorData = async () => {
        try {
            setLoading(true)

            // Calculate date range
            const days = parseInt(timeRange)
            const startDate = subDays(new Date(), days).toISOString()

            // 1. Fetch Total Revenue (All time)
            const { data: revenueData, error: revenueError } = await supabase
                .from('transactions')
                .select('amount, created_at')
                .eq('type', 'deposit') // Assuming deposits to system are revenue

            if (revenueError) throw revenueError
            const totalRevenue = revenueData?.reduce((sum, tx) => sum + tx.amount, 0) || 0

            // 2. Fetch All Transactions (Recent) - without join to avoid FK issues
            const { data: withdrawalsData, error: withdrawalsError } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100) // Fetch more to account for filtering

            if (withdrawalsError) {
                console.error('Transactions query error:', withdrawalsError)
                throw withdrawalsError
            }

            // Filter out pending withdrawals (those are shown in Payout dialog)
            const filteredTransactions = withdrawalsData?.filter(tx =>
                !(tx.type === 'withdrawal' && tx.status === 'pending')
            ).slice(0, 50) || []

            // Fetch profiles for all user_ids in transactions
            let enrichedWithdrawals: Transaction[] = []
            if (filteredTransactions && filteredTransactions.length > 0) {
                const userIds = [...new Set(filteredTransactions.map(tx => tx.user_id))]
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', userIds)

                if (profilesError) {
                    console.error('Profiles query error:', profilesError)
                }

                const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
                enrichedWithdrawals = filteredTransactions.map(tx => ({
                    ...tx,
                    profiles: profilesMap.get(tx.user_id) || null
                })) as Transaction[]
            }

            // 3. Fetch Active Reshippers
            const { count: reshippersCount, error: reshippersError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'reshipper')

            if (reshippersError) {
                console.error('Reshippers query error:', reshippersError)
                throw reshippersError
            }

            // 4. Fetch Chart Data (Revenue & Packages)
            // Fetch shipments for package count
            const { data: shipmentsData } = await supabase
                .from('shipments')
                .select('created_at, recipient_id')
                .gte('created_at', startDate)

            // Process chart data
            const chartDataPoints: ChartData[] = []
            for (let i = days - 1; i >= 0; i--) {
                const date = subDays(new Date(), i)
                const dateStr = format(date, 'yyyy-MM-dd')

                // Calculate daily revenue (from deposits)
                const dailyRevenue = revenueData
                    ?.filter(tx => isSameDay(new Date(tx.created_at), date))
                    .reduce((sum, tx) => sum + tx.amount, 0) || 0

                // Calculate daily packages
                const dailyPackages = shipmentsData
                    ?.filter(s => isSameDay(new Date(s.created_at), date))
                    .length || 0

                chartDataPoints.push({
                    date: dateStr,
                    revenue: dailyRevenue,
                    packages: dailyPackages
                })
            }
            setChartData(chartDataPoints)

            // 5. Calculate Top Reshippers
            // We need to fetch all shipments to aggregate correctly (or at least a large enough sample)
            // Ideally this should be a DB view, but for now we'll aggregate client-side
            const { data: allShipments } = await supabase
                .from('shipments')
                .select('recipient_id')
                .not('recipient_id', 'is', null)

            const reshipperCounts = new Map<string, number>()
            allShipments?.forEach(s => {
                if (s.recipient_id) {
                    reshipperCounts.set(s.recipient_id, (reshipperCounts.get(s.recipient_id) || 0) + 1)
                }
            })

            // Sort and take top 10
            const sortedReshippers = [...reshipperCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)

            // Fetch profiles for top reshippers
            let topReshippersList: TopReshipper[] = []
            if (sortedReshippers.length > 0) {
                const topIds = sortedReshippers.map(([id]) => id)
                const { data: topProfiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', topIds)

                const topProfilesMap = new Map(topProfiles?.map(p => [p.id, p]) || [])

                topReshippersList = sortedReshippers.map(([id, count], index) => ({
                    id,
                    full_name: topProfilesMap.get(id)?.full_name || 'Unknown',
                    email: topProfilesMap.get(id)?.email || null,
                    shipment_count: count,
                    rank: index + 1
                }))
            }
            setTopReshippers(topReshippersList)

            setStats({
                totalRevenue,
                pendingWithdrawalsCount: enrichedWithdrawals?.length || 0, // This logic might need adjustment if we filter pending out of the list but want to show count
                activeReshippersCount: reshippersCount || 0
            })

            // For pending withdrawals count, we should actually fetch the count separately since we filtered them out of the list
            const { count: pendingCount } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'withdrawal')
                .eq('status', 'pending')

            setStats(prev => ({
                ...prev,
                pendingWithdrawalsCount: pendingCount || 0
            }))

            setWithdrawals(enrichedWithdrawals)

        } catch (error) {
            console.error('Error fetching moderator data:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const handleWithdrawalAction = async (transactionId: string, action: 'approve' | 'reject') => {
        setProcessingId(transactionId)
        try {
            const status = action === 'approve' ? 'completed' : 'failed'

            // Update transaction status
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ status })
                .eq('id', transactionId)

            if (updateError) throw updateError

            // If rejected, refund the balance to the user
            if (action === 'reject') {
                const transaction = withdrawals.find(tx => tx.id === transactionId)
                if (transaction) {
                    const { error: refundError } = await supabase.rpc('increment_balance', {
                        user_id: transaction.user_id,
                        amount: transaction.amount
                    })

                    // Fallback if RPC doesn't exist (though it should be handled safely)
                    if (refundError) {
                        // Manual refund logic if needed, but atomic RPC is preferred. 
                        // For now, let's assume simple update for MVP or add a refund transaction.
                        // Actually, let's just create a 'refund' transaction to keep history clear
                        await supabase.from('transactions').insert({
                            user_id: transaction.user_id,
                            type: 'deposit', // Treat as deposit to add back
                            amount: transaction.amount,
                            status: 'completed',
                            description: `Refund for rejected withdrawal ${transactionId} `
                        })

                        // And update profile balance
                        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', transaction.user_id).single()
                        if (profile) {
                            await supabase.from('profiles').update({ balance: profile.balance + transaction.amount }).eq('id', transaction.user_id)
                        }
                    }
                }
            }

            toast.success(`Withdrawal ${action}ed successfully`)
            fetchModeratorData() // Refresh list
        } catch (error) {
            console.error(`Error ${action}ing withdrawal: `, error)
            toast.error(`Failed to ${action} withdrawal`)
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Moderator Dashboard</h2>
                <p className="text-muted-foreground">
                    System overview and management
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title="Total Revenue"
                    value={stats.totalRevenue}
                    change={0}
                    changeLabel="All time"
                    description="Total system revenue"
                    icon={DollarSign}
                    type="currency"
                />
                <StatsCard
                    title="Pending Withdrawals"
                    value={stats.pendingWithdrawalsCount}
                    change={0}
                    changeLabel="Requests"
                    description="Waiting for approval"
                    icon={Clock}
                    type="number"
                />
                <StatsCard
                    title="Active Reshippers"
                    value={stats.activeReshippersCount}
                    change={0}
                    changeLabel="Total"
                    description="Registered reshippers"
                    icon={Users}
                    type="number"
                />
            </div>

            {/* All Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>View all platform transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {withdrawals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No transactions yet
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {withdrawals.map((tx) => (
                                <div key={tx.id} className="flex flex-col md:flex-row md:items-center justify-between border rounded-lg p-4 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-lg">
                                                {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                                            </span>
                                            <Badge variant="outline" className="capitalize">{tx.status}</Badge>
                                            <Badge variant="secondary" className="capitalize">{tx.type}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            User: <span className="font-medium text-foreground">{tx.profiles?.full_name || 'Unknown User'}</span> ({tx.profiles?.email})
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </div>
                                        {/* Payment Details from Description */}
                                        {tx.description && (
                                            <div className="mt-2 bg-muted/50 p-2 rounded text-sm font-mono">
                                                {tx.description}
                                            </div>
                                        )}
                                    </div>

                                    {tx.type === 'withdrawal' && tx.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                disabled={!!processingId}
                                                onClick={() => handleWithdrawalAction(tx.id, 'reject')}
                                            >
                                                {processingId === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                disabled={!!processingId}
                                                onClick={() => handleWithdrawalAction(tx.id, 'approve')}
                                            >
                                                {processingId === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                                Approve (Paid)
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
