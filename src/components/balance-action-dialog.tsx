'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

type BalanceActionDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    action: 'send' | 'deduct'
    onSuccess: () => void
}

export function BalanceActionDialog({ open, onOpenChange, action, onSuccess }: BalanceActionDialogProps) {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Profile[]>([])
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error('Please enter an email or name to search')
            return
        }

        setSearching(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                .in('role', ['customer', 'reshipper'])
                .limit(10)

            if (error) throw error
            setSearchResults(data || [])

            if (data && data.length === 0) {
                toast.info('No users found matching your search')
            }
        } catch (error) {
            console.error('Error searching users:', error)
            toast.error('Failed to search users')
        } finally {
            setSearching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedUser) {
            toast.error('Please select a user')
            return
        }

        const amountNum = parseFloat(amount)
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        if (action === 'deduct' && amountNum > selectedUser.balance) {
            toast.error(`User only has $${selectedUser.balance.toFixed(2)} available`)
            return
        }

        if (!description.trim()) {
            toast.error('Please provide a description')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const newBalance = action === 'send'
                ? selectedUser.balance + amountNum
                : selectedUser.balance - amountNum

            // Update user balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', selectedUser.id)

            if (balanceError) throw balanceError

            // Create transaction record
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: selectedUser.id,
                    type: action === 'send' ? 'deposit' : 'withdrawal',
                    amount: amountNum,
                    status: 'completed',
                    payment_method: 'admin',
                    description: `${action === 'send' ? 'Balance added' : 'Balance deducted'} by moderator: ${description}`
                })

            if (txError) throw txError

            // Create notification for user
            await supabase
                .from('notifications')
                .insert({
                    user_id: selectedUser.id,
                    title: action === 'send' ? 'Balance Added' : 'Balance Deducted',
                    message: `${action === 'send' ? '+' : '-'}$${amountNum.toFixed(2)}: ${description}`,
                    type: action === 'send' ? 'success' : 'warning',
                    read: false
                })

            toast.success(`Successfully ${action === 'send' ? 'sent' : 'deducted'} $${amountNum.toFixed(2)} ${action === 'send' ? 'to' : 'from'} ${selectedUser.full_name || selectedUser.email}`)

            // Reset form
            setSearchQuery('')
            setSearchResults([])
            setSelectedUser(null)
            setAmount('')
            setDescription('')
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            console.error(`Error ${action}ing balance:`, error)
            toast.error(`Failed to ${action} balance`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{action === 'send' ? 'Send Balance' : 'Deduct Balance'}</DialogTitle>
                    <DialogDescription>
                        {action === 'send' ? 'Credit a user\'s account' : 'Remove funds from a user\'s account'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User Search */}
                    {!selectedUser && (
                        <div className="space-y-2">
                            <Label>Search User</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter email or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                                />
                                <Button type="button" onClick={handleSearch} disabled={searching}>
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="border rounded-md max-h-48 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setSearchResults([])
                                            }}
                                            className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-0"
                                        >
                                            <div className="font-medium">{user.full_name || 'No name'}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Balance: ${user.balance.toFixed(2)} • Role: {user.role}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selected User */}
                    {selectedUser && (
                        <div className="space-y-2">
                            <Label>Selected User</Label>
                            <div className="border rounded-md p-3 bg-muted/50">
                                <div className="font-medium">{selectedUser.full_name || 'No name'}</div>
                                <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                                <div className="text-xs text-muted-foreground">
                                    Current Balance: ${selectedUser.balance.toFixed(2)}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedUser(null)}
                                    className="mt-2"
                                >
                                    Change User
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Reason / Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Enter reason for this action..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !selectedUser}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {action === 'send' ? 'Send Balance' : 'Deduct Balance'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
