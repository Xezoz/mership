'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { Database } from '@/lib/supabase/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
    profiles: {
        full_name: string | null
        email: string | null
    } | null
}

type PayoutDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function PayoutDialog({ open, onOpenChange, onSuccess }: PayoutDialogProps) {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(true)
    const [withdrawals, setWithdrawals] = useState<Transaction[]>([])
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchWithdrawals()
        }
    }, [open])

    const fetchWithdrawals = async () => {
        setLoading(true)
        try {
            // Fetch pending withdrawals without join
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('type', 'withdrawal')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })

            if (error) throw error

            // Fetch profiles for all user_ids
            if (data && data.length > 0) {
                const userIds = [...new Set(data.map(tx => tx.user_id))]
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', userIds)

                const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
                const enrichedData = data.map(tx => ({
                    ...tx,
                    profiles: profilesMap.get(tx.user_id) || null
                })) as Transaction[]

                setWithdrawals(enrichedData)
            } else {
                setWithdrawals([])
            }
        } catch (error) {
            console.error('Error fetching withdrawals:', error)
            toast.error('Failed to load withdrawal requests')
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
                    // Refund by creating a deposit transaction
                    await supabase.from('transactions').insert({
                        user_id: transaction.user_id,
                        type: 'deposit',
                        amount: transaction.amount,
                        status: 'completed',
                        payment_method: 'refund',
                        description: `Refund for rejected withdrawal ${transactionId}`
                    })

                    // Update profile balance
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('balance')
                        .eq('id', transaction.user_id)
                        .single()

                    if (profile) {
                        await supabase
                            .from('profiles')
                            .update({ balance: profile.balance + transaction.amount })
                            .eq('id', transaction.user_id)
                    }

                    // Notify user
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: transaction.user_id,
                            title: 'Withdrawal Rejected',
                            message: `Your withdrawal request for $${transaction.amount.toFixed(2)} was rejected and refunded to your balance.`,
                            type: 'warning',
                            read: false
                        })
                }
            } else {
                // Notify user of approval
                const transaction = withdrawals.find(tx => tx.id === transactionId)
                if (transaction) {
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: transaction.user_id,
                            title: 'Withdrawal Approved',
                            message: `Your withdrawal request for $${transaction.amount.toFixed(2)} has been approved and processed.`,
                            type: 'success',
                            read: false
                        })
                }
            }

            toast.success(`Withdrawal ${action}ed successfully`)
            fetchWithdrawals() // Refresh list
            onSuccess()
        } catch (error) {
            console.error(`Error ${action}ing withdrawal:`, error)
            toast.error(`Failed to ${action} withdrawal`)
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Process Payouts
                    </DialogTitle>
                    <DialogDescription>
                        Review and approve pending withdrawal requests from reshippers
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : withdrawals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No pending withdrawal requests</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {withdrawals.map((tx) => (
                            <div key={tx.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-lg">${tx.amount.toFixed(2)}</span>
                                            <Badge variant="outline" className="capitalize">{tx.status}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Requested by <span className="font-medium text-foreground">{tx.profiles?.full_name || 'Unknown User'}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {tx.profiles?.email}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                {tx.description && (
                                    <div className="bg-muted/50 p-3 rounded text-sm font-mono">
                                        {tx.description}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={!!processingId}
                                        onClick={() => handleWithdrawalAction(tx.id, 'reject')}
                                        className="flex-1"
                                    >
                                        {processingId === tx.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject & Refund
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 flex-1"
                                        disabled={!!processingId}
                                        onClick={() => handleWithdrawalAction(tx.id, 'approve')}
                                    >
                                        {processingId === tx.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Approve (Paid)
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
