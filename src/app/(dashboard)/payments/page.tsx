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

            console.log('Creating pending transaction...')
            // Create pending transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    type: 'deposit',
                    amount: amount,
                    status: 'pending',
                    payment_method: 'coinbase',
                    description: `Deposit of $${amount.toFixed(2)} via Coinbase`
                })

            if (txError) {
                console.error('Transaction creation error:', txError)
                if (txError.code === '42P01') {
                    alert('Please run the database migration first: supabase/add-balance-transactions.sql')
                    return
                }
                throw txError
            }

            console.log('Calling Coinbase checkout API...')
            // Call Coinbase checkout API
            const response = await fetch('/api/coinbase/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            })

            console.log('Coinbase API response status:', response.status)
            const data = await response.json()
            console.log('Coinbase API response data:', data)

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initiate Coinbase checkout')
            }

            if (data.url) {
                console.log('Redirecting to:', data.url)
                window.location.href = data.url
                return
            } else {
                console.error('No URL in response data')
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
                            <CardDescription>Add money via Crypto (Coinbase)</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                                <Label htmlFor="deposit_amount">Enter Amount (USD)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        id="deposit_amount"
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        placeholder="0.00"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className="pl-7 text-lg"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['10', '25', '50', '100', '500'].map((amt) => (
                                        <Button
                                            key={amt}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDepositAmount(amt)}
                                            className={depositAmount === amt ? 'bg-primary text-primary-foreground' : ''}
                                        >
                                            ${amt}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <Button
                                onClick={handleDeposit}
                                disabled={processing || !depositAmount || parseFloat(depositAmount) <= 0}
                                className="w-full"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Pay with Crypto ($${depositAmount || '0'})`
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
