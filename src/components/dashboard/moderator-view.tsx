'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, DollarSign, Users, ArrowUpRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { StatsCard } from '@/components/stats-card'
import { Database } from '@/lib/supabase/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
    profiles: {
        full_name: string | null
        email: string | null
    } | null
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
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Total Revenue (Sum of all completed deposits)
            const { data: revenueData, error: revenueError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'deposit')
                .eq('status', 'completed')

            if (revenueError) throw revenueError
            const totalRevenue = revenueData?.reduce((sum, tx) => sum + tx.amount, 0) || 0

            // 2. Fetch Pending Withdrawals
            const { data: withdrawalsData, error: withdrawalsError } = await supabase
                .from('transactions')
                .select('*, profiles(full_name, email)')
                .eq('type', 'withdrawal')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })

            if (withdrawalsError) throw withdrawalsError

            // 3. Fetch Active Reshippers
            const { count: reshippersCount, error: reshippersError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'reshipper')

            if (reshippersError) throw reshippersError

            setStats({
                totalRevenue,
                pendingWithdrawalsCount: withdrawalsData?.length || 0,
                activeReshippersCount: reshippersCount || 0
            })
            setWithdrawals(withdrawalsData as Transaction[])

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
                            description: `Refund for rejected withdrawal ${transactionId}`
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
            fetchData() // Refresh list
        } catch (error) {
            console.error(`Error ${action}ing withdrawal:`, error)
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
                <p className="text-muted-foreground">Overview of platform revenue and pending actions.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Total Revenue"
                    value={stats.totalRevenue}
                    change={0}
                    changeLabel="Lifetime"
                    description="Total deposits processed"
                    icon={DollarSign}
                    type="currency"
                />
                <StatsCard
                    title="Pending Withdrawals"
                    value={stats.pendingWithdrawalsCount}
                    change={0}
                    changeLabel="Requests"
                    description="Awaiting approval"
                    icon={AlertCircle}
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

            {/* Pending Withdrawals Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Withdrawals</CardTitle>
                    <CardDescription>Review and process reshipper withdrawal requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {withdrawals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No pending withdrawals
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {withdrawals.map((tx) => (
                                <div key={tx.id} className="flex flex-col md:flex-row md:items-center justify-between border rounded-lg p-4 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-lg">${tx.amount.toFixed(2)}</span>
                                            <Badge variant="outline" className="capitalize">{tx.status}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Requested by <span className="font-medium text-foreground">{tx.profiles?.full_name || 'Unknown User'}</span> ({tx.profiles?.email})
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </div>
                                        {/* Payment Details from Description */}
                                        <div className="mt-2 bg-muted/50 p-2 rounded text-sm font-mono">
                                            {tx.description}
                                        </div>
                                    </div>

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
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
