'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Database } from '@/lib/supabase/database.types'
import { toast } from 'sonner'
import { BalanceActionDialog } from '@/components/balance-action-dialog'
import { PayoutDialog } from '@/components/payout-dialog'

type Transaction = Database['public']['Tables']['transactions']['Row']

export default function PaymentsPage() {
    const supabase = createBrowserClient()
    const { isReshipper, isCustomer, isModerator } = useUserRole()

    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(0)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [stats, setStats] = useState({ totalDeposited: 0, totalSpent: 0, transactionCount: 0, lastTransactionDate: null as string | null })
    const [depositAmount, setDepositAmount] = useState('')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [processing, setProcessing] = useState(false)
    const [withdrawalStep, setWithdrawalStep] = useState(1)
    const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'ach' | 'bank' | null>(null)
    const [sendBalanceOpen, setSendBalanceOpen] = useState(false)
    const [deductBalanceOpen, setDeductBalanceOpen] = useState(false)
    const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
    const [paymentDetails, setPaymentDetails] = useState({
        cryptoAddress: '',
        cryptoNetwork: '',
        accountName: '',
        routingNumber: '',
        accountNumber: '',
        bankName: '',
        swiftCode: ''
    })

    useEffect(() => {
        fetchData()

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
            toast.info('Checkout was canceled')
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

    const fetchData = async () => {
        setLoading(true)
        await Promise.all([fetchBalance(), fetchTransactions(), fetchStats()])
        setLoading(false)
    }

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
        }
    }

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch all transactions to calculate totals
            const { data, error } = await supabase
                .from('transactions')
                .select('amount, type, status, created_at')
                .eq('user_id', user.id)

            if (error) throw error

            let deposited = 0
            let spent = 0
            let lastDate = null

            if (data && data.length > 0) {
                // Sort by date to find last activity
                const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                lastDate = sorted[0].created_at

                data.forEach(tx => {
                    if (tx.status === 'completed') {
                        if (tx.type === 'deposit') {
                            deposited += tx.amount
                        } else if (tx.type === 'withdrawal') {
                            spent += tx.amount
                        }
                    }
                })
            }

            setStats({
                totalDeposited: deposited,
                totalSpent: spent,
                transactionCount: data?.length || 0,
                lastTransactionDate: lastDate
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
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
                if (error.code === '42P01') return
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
                toast.success(`Payment successful! $${data.amount_added || 0} added to your balance.`)
                fetchData() // Refresh everything
            } else if (data.message) {
                if (data.status === 'failed' || data.status === 'canceled') {
                    toast.error(`Payment failed: ${data.message}`)
                }
            }
        } catch (error) {
            console.error('Error verifying transaction:', error)
            toast.error('Failed to verify transaction')
        }
    }

    const handleDeposit = async () => {
        console.log('handleDeposit called with amount:', depositAmount)
        const amount = parseFloat(depositAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount')
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
            const response = await fetch('/api/whop/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            })

            let data;
            try {
                data = await response.json()
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError)
                throw new Error('Invalid response from server')
            }

            if (!response.ok) {
                throw new Error(data.error || `Failed to initiate Whop checkout: ${response.statusText}`)
            }

            if (data.url) {
                if (data.transaction_id) {
                    localStorage.setItem('pending_transaction_id', data.transaction_id)
                }
                window.location.href = data.url
                return
            } else {
                toast.error('Failed to get checkout URL from payment provider')
            }

            fetchData()
        } catch (error) {
            console.error('Error processing deposit:', error)
            toast.error('Failed to process deposit: ' + (error instanceof Error ? error.message : String(error)))
        } finally {
            setProcessing(false)
        }
    }



    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        if (amount > balance) {
            toast.error('Insufficient balance')
            return
        }

        // Validation based on payment method
        if (paymentMethod === 'crypto') {
            if (!paymentDetails.cryptoAddress || !paymentDetails.cryptoNetwork) {
                toast.error('Please fill in all crypto details')
                return
            }
        } else if (paymentMethod === 'ach') {
            if (!paymentDetails.accountName || !paymentDetails.routingNumber || !paymentDetails.accountNumber) {
                toast.error('Please fill in all ACH details')
                return
            }
        } else if (paymentMethod === 'bank') {
            if (!paymentDetails.accountName || !paymentDetails.bankName || !paymentDetails.swiftCode || !paymentDetails.accountNumber) {
                toast.error('Please fill in all bank details')
                return
            }
        }

        setProcessing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Construct description with payment details
            let description = `Withdrawal of $${amount.toFixed(2)} via ${paymentMethod?.toUpperCase()}`
            if (paymentMethod === 'crypto') {
                description += ` (${paymentDetails.cryptoNetwork}: ${paymentDetails.cryptoAddress})`
            } else if (paymentMethod === 'ach') {
                description += ` (ACH: ${paymentDetails.accountName}, ****${paymentDetails.accountNumber.slice(-4)})`
            } else if (paymentMethod === 'bank') {
                description += ` (Bank: ${paymentDetails.bankName}, SWIFT: ${paymentDetails.swiftCode})`
            }

            // Create withdrawal transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    type: 'withdrawal',
                    amount: amount,
                    status: 'pending',
                    description: description
                })

            if (txError) throw txError

            // Update balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ balance: balance - amount })
                .eq('id', user.id)

            if (balanceError) throw balanceError

            toast.success('Withdrawal request submitted! Funds will be processed within 1-3 business days.')

            setWithdrawAmount('')
            setWithdrawalStep(1)
            setPaymentMethod(null)
            setPaymentDetails({
                cryptoAddress: '',
                cryptoNetwork: '',
                accountName: '',
                routingNumber: '',
                accountNumber: '',
                bankName: '',
                swiftCode: ''
            })
            fetchData()
        } catch (error) {
            console.error('Error processing withdrawal:', error)
            toast.error('Failed to process withdrawal')
        } finally {
            setProcessing(false)
        }
    }

    const getStatusColor = (status: string) => {
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
                {/* Enhanced Balance Card */}
                <Card className="overflow-hidden">
                    <CardHeader className="border-b bg-muted/40 pb-8">
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Account Balance
                        </CardTitle>
                        <CardDescription>Your current available funds</CardDescription>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-4xl font-bold">${balance.toFixed(2)}</span>
                            <span className="text-sm text-muted-foreground">USD</span>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6 p-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                Total Deposited
                            </div>
                            <div className="text-2xl font-bold">${stats.totalDeposited.toFixed(2)}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingDown className="h-4 w-4" />
                                Total Spent
                            </div>
                            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Activity className="h-4 w-4" />
                                Total Transactions
                            </div>
                            <div className="text-2xl font-bold">{stats.transactionCount}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ArrowUpRight className="h-4 w-4" />
                                Last Activity
                            </div>
                            <div className="text-lg font-medium truncate">
                                {stats.lastTransactionDate ? new Date(stats.lastTransactionDate).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
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

                {/* Moderator Actions Card */}
                {isModerator && (
                    <Card className="flex flex-col h-full min-h-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Moderator Actions
                            </CardTitle>
                            <CardDescription>Manage user balances and payouts</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <Button
                                variant="outline"
                                className="w-full justify-start h-auto py-4"
                                onClick={() => setSendBalanceOpen(true)}
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold flex items-center gap-2">
                                        <ArrowUpRight className="h-4 w-4" />
                                        Send Balance
                                    </span>
                                    <span className="text-xs text-muted-foreground">Credit a user's account</span>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-auto py-4"
                                onClick={() => setDeductBalanceOpen(true)}
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4" />
                                        Deduct Balance
                                    </span>
                                    <span className="text-xs text-muted-foreground">Remove funds from a user</span>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-auto py-4"
                                onClick={() => setPayoutDialogOpen(true)}
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold flex items-center gap-2">
                                        <ArrowDownLeft className="h-4 w-4" />
                                        Process Payouts
                                    </span>
                                    <span className="text-xs text-muted-foreground">Review pending withdrawal requests</span>
                                </div>
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
                            {withdrawalStep === 1 && (
                                <div className="space-y-4">
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
                                        <div className="flex gap-2 mt-2">
                                            {[25, 50, 75, 100].map((percent) => (
                                                <Button
                                                    key={percent}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={() => {
                                                        const amount = (balance * percent) / 100
                                                        setWithdrawAmount(amount.toFixed(2))
                                                    }}
                                                >
                                                    {percent === 100 ? 'Max' : `${percent}%`}
                                                </Button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Available: ${balance.toFixed(2)}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const amount = parseFloat(withdrawAmount)
                                            if (isNaN(amount) || amount <= 0) {
                                                toast.error('Please enter a valid amount')
                                                return
                                            }
                                            if (amount > balance) {
                                                toast.error('Insufficient balance')
                                                return
                                            }
                                            setWithdrawalStep(2)
                                        }}
                                        className="w-full"
                                    >
                                        Next: Select Payment Method
                                    </Button>
                                </div>
                            )}

                            {withdrawalStep === 2 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        <Button
                                            variant={paymentMethod === 'crypto' ? 'default' : 'outline'}
                                            onClick={() => setPaymentMethod('crypto')}
                                            className="justify-start h-auto py-4"
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="font-semibold">Crypto (USDT/USDC)</span>
                                                <span className="text-xs text-muted-foreground">Fastest transfer, low fees</span>
                                            </div>
                                        </Button>
                                        <Button
                                            variant={paymentMethod === 'ach' ? 'default' : 'outline'}
                                            onClick={() => setPaymentMethod('ach')}
                                            className="justify-start h-auto py-4"
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="font-semibold">ACH Transfer</span>
                                                <span className="text-xs text-muted-foreground">1-3 business days</span>
                                            </div>
                                        </Button>
                                        <Button
                                            variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                                            onClick={() => setPaymentMethod('bank')}
                                            className="justify-start h-auto py-4"
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="font-semibold">Bank Wire</span>
                                                <span className="text-xs text-muted-foreground">International transfers available</span>
                                            </div>
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => setWithdrawalStep(1)} className="w-full">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (!paymentMethod) {
                                                    toast.error('Please select a payment method')
                                                    return
                                                }
                                                setWithdrawalStep(3)
                                            }}
                                            className="w-full"
                                        >
                                            Next: Enter Details
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {withdrawalStep === 3 && (
                                <div className="space-y-4">
                                    {paymentMethod === 'crypto' && (
                                        <div className="space-y-2">
                                            <Label>Wallet Address (USDT/USDC - TRC20/ERC20)</Label>
                                            <Input
                                                placeholder="Enter your wallet address"
                                                value={paymentDetails.cryptoAddress}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, cryptoAddress: e.target.value })}
                                            />
                                            <Label>Network</Label>
                                            <Input
                                                placeholder="e.g. TRC20, ERC20, SOL"
                                                value={paymentDetails.cryptoNetwork}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, cryptoNetwork: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {paymentMethod === 'ach' && (
                                        <div className="space-y-2">
                                            <Label>Account Holder Name</Label>
                                            <Input
                                                placeholder="Full Name"
                                                value={paymentDetails.accountName}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                                            />
                                            <Label>Routing Number</Label>
                                            <Input
                                                placeholder="9 digits"
                                                value={paymentDetails.routingNumber}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, routingNumber: e.target.value })}
                                            />
                                            <Label>Account Number</Label>
                                            <Input
                                                placeholder="Account Number"
                                                value={paymentDetails.accountNumber}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {paymentMethod === 'bank' && (
                                        <div className="space-y-2">
                                            <Label>Beneficiary Name</Label>
                                            <Input
                                                placeholder="Full Name"
                                                value={paymentDetails.accountName}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                                            />
                                            <Label>Bank Name</Label>
                                            <Input
                                                placeholder="Bank Name"
                                                value={paymentDetails.bankName}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                                            />
                                            <Label>SWIFT/BIC Code</Label>
                                            <Input
                                                placeholder="SWIFT Code"
                                                value={paymentDetails.swiftCode}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, swiftCode: e.target.value })}
                                            />
                                            <Label>IBAN / Account Number</Label>
                                            <Input
                                                placeholder="IBAN or Account Number"
                                                value={paymentDetails.accountNumber}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => setWithdrawalStep(2)} className="w-full">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleWithdraw}
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Submit Withdrawal
                                        </Button>
                                    </div>
                                </div>
                            )}
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

            {/* Balance Action Dialogs */}
            {isModerator && (
                <>
                    <BalanceActionDialog
                        open={sendBalanceOpen}
                        onOpenChange={setSendBalanceOpen}
                        action="send"
                        onSuccess={fetchData}
                    />
                    <BalanceActionDialog
                        open={deductBalanceOpen}
                        onOpenChange={setDeductBalanceOpen}
                        action="deduct"
                        onSuccess={fetchData}
                    />
                    <PayoutDialog
                        open={payoutDialogOpen}
                        onOpenChange={setPayoutDialogOpen}
                        onSuccess={fetchData}
                    />
                </>
            )}
        </div>
    )
}
