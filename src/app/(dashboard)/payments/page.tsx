'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import { Database } from '@/lib/supabase/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']

export default function PaymentsPage() {
    const supabase = createBrowserClient()
    const { isReshipper, isCustomer } = useUserRole()

    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(0)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [depositAmount, setDepositAmount] = useState('')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchBalance()
        fetchTransactions()

        // Check if returning from successful checkout
        const urlParams = new URLSearchParams(window.location.search)
        const success = urlParams.get('success')
        const canceled = urlParams.get('canceled')
        const transactionId = localStorage.getItem('pending_transaction_id')

        console.log('URL params:', { success, canceled, transactionId })

        if (success === 'true' && transactionId) {
            // Verify and complete the transaction
            console.log('Verifying transaction after successful checkout')
            verifyTransaction(transactionId)
            localStorage.removeItem('pending_transaction_id')
            // Clean URL
            window.history.replaceState({}, '', '/payments')
        } else if (canceled === 'true' && transactionId) {
            console.log('Checkout was canceled')
            localStorage.removeItem('pending_transaction_id')
            window.history.replaceState({}, '', '/payments')
            alert('Checkout was canceled')
        } else if (transactionId) {
            // If we have a pending transaction but no success/canceled param,
            // Whop might be redirecting without params. Try to verify anyway.
            console.log('Found pending transaction, attempting verification')
            setTimeout(() => {
                verifyTransaction(transactionId)
                localStorage.removeItem('pending_transaction_id')
            }, 1000)
        }
    }, [])

    const fetchBalance = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', user.id)
                .single()

            if (error) throw error
            setBalance(data?.balance || 0)
        } catch (error) {
            console.error('Error fetching balance:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchTransactions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) {
                // If table doesn't exist yet, just return empty array
                if (error.code === '42P01') {
                    console.log('Transactions table not created yet. Please run the SQL migration.')
                    return
                }
                throw error
            }
            setTransactions(data || [])
        } catch (error) {
            console.error('Error fetching transactions:', error)
        }
    }

    const verifyTransaction = async (transactionId: string) => {
        try {
            console.log('Verifying transaction:', transactionId)
            const response = await fetch('/api/whop/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transaction_id: transactionId })
            })

            const data = await response.json()
            console.log('Verification result:', data)

            if (data.completed) {
                alert(`Payment successful! $${data.amount_added || 0} added to your balance.`)
                fetchBalance()
                fetchTransactions()
            }
        } catch (error) {
            console.error('Error verifying transaction:', error)
        }
    }

    const handleDeposit = async () => {
        console.log('handleDeposit called with amount:', depositAmount)
        const amount = parseFloat(depositAmount)
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount')
            return
        }

        setProcessing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.error('No user found')
                return
            }

            console.log('Calling Whop checkout API with amount:', amount)
            // Call Whop checkout API
            const response = await fetch('/api/whop/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            })

            console.log('Whop API response status:', response.status)

            let data;
            try {
                data = await response.json()
                console.log('Whop API response data:', data)
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError)
                throw new Error('Invalid response from server')
            }

            if (!response.ok) {
                throw new Error(data.error || `Failed to initiate Whop checkout: ${response.statusText}`)
            }

            if (data.url) {
                console.log('Redirecting to:', data.url)
                // Store transaction ID for verification when user returns
                if (data.transaction_id) {
                    localStorage.setItem('pending_transaction_id', data.transaction_id)
                }
                window.location.href = data.url
                return
            } else {
                console.error('No URL in response data:', data)
                // Alert the keys to help debugging if it fails again
                alert(`Error: No checkout URL. Response keys: ${Object.keys(data).join(', ')}. Data: ${JSON.stringify(data).substring(0, 100)}...`)
            }

            setDepositAmount('')
            fetchBalance()
            fetchTransactions()
        } catch (error) {
            console.error('Error processing deposit:', error)
            alert('Failed to process deposit: ' + (error instanceof Error ? error.message : String(error)))
        } finally {
            setProcessing(false)
        }
    }

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount)
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount')
            return
        }

        if (amount > balance) {
            alert('Insufficient balance')
            return
        }

        setProcessing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Create withdrawal transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    type: 'withdrawal',
                    amount: amount,
                    status: 'pending',
                    description: `Withdrawal of $${amount.toFixed(2)}`
                })

            if (txError) throw txError

            // Update balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ balance: balance - amount })
                .eq('id', user.id)

            if (balanceError) throw balanceError

            alert('Withdrawal request submitted! Funds will be processed within 1-3 business days.')

            setWithdrawAmount('')
            fetchBalance()
            fetchTransactions()
        } catch (error) {
            console.error('Error processing withdrawal:', error)
            alert('Failed to process withdrawal')
        } finally {
            setProcessing(false)
        }
    }

    const getStatusColor = (status: string) => {
        // Monochrome only - no colors
        return 'bg-muted text-foreground'
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Payments</h1>
                <p className="text-muted-foreground">Manage your account balance and transactions</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Balance Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Account Balance
                        </CardTitle>
                        <CardDescription>Your current available balance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">${balance.toFixed(2)}</div>
                    </CardContent>
                </Card>

                {/* Deposit Card (Customers Only) */}
                {isCustomer && (
                    <Card className="flex flex-col h-full min-h-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowDownLeft className="h-5 w-5" />
                                Deposit Funds
                            </CardTitle>
                            <CardDescription>Add money via Card, Apple Pay, or Google Pay (Whop)</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                                <Label>Select Amount (USD)</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant={depositAmount === '10' ? 'default' : 'outline'}
                                        onClick={() => setDepositAmount('10')}
                                        className="h-16 text-lg font-semibold"
                                    >
                                        $10
                                    </Button>
                                    <Button
                                        variant={depositAmount === '25' ? 'default' : 'outline'}
                                        onClick={() => setDepositAmount('25')}
                                        className="h-16 text-lg font-semibold"
                                    >
                                        $25
                                    </Button>
                                    <Button
                                        variant={depositAmount === '50' ? 'default' : 'outline'}
                                        onClick={() => setDepositAmount('50')}
                                        className="h-16 text-lg font-semibold"
                                    >
                                        $50
                                    </Button>
                                    <Button
                                        variant={depositAmount === '100' ? 'default' : 'outline'}
                                        onClick={() => setDepositAmount('100')}
                                        className="h-16 text-lg font-semibold"
                                    >
                                        $100
                                    </Button>
                                </div>
                            </div>
                            <Button
                                onClick={handleDeposit}
                                disabled={processing || !depositAmount}
                                className="w-full"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Add $${depositAmount || '0'} to Balance`
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}


                {/* Withdraw Card (Reshippers Only) */}
                {isReshipper && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowUpRight className="h-5 w-5" />
                                Withdraw Funds
                            </CardTitle>
                            <CardDescription>Transfer money to your bank account</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="withdraw_amount">Amount (USD)</Label>
                                <Input
                                    id="withdraw_amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={balance}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Available: ${balance.toFixed(2)}
                                </p>
                            </div>
                            <Button
                                onClick={handleWithdraw}
                                disabled={processing || !withdrawAmount || parseFloat(withdrawAmount) > balance}
                                className="w-full"
                                variant="outline"
                            >
                                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Request Withdrawal
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest payment activity</CardDescription>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No transactions yet
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((tx) => (
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
                                        <Badge variant="secondary" className={getStatusColor(tx.status)}>
                                            {tx.status}
                                        </Badge>
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
