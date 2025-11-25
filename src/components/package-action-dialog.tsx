'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Package, Undo2, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type PackageActionDialogProps = {
    shipmentId: string
    trackingNumber: string
    userBalance: number
    onSuccess: () => void
}

const HANDLING_FEE = 15.00 // Default handling fee ($10 to reshipper, $5 platform fee)

export function PackageActionDialog({ shipmentId, trackingNumber, userBalance, onSuccess }: PackageActionDialogProps) {
    const supabase = createBrowserClient()
    const [open, setOpen] = useState(false)
    const [selectedAction, setSelectedAction] = useState<'ship' | 'return' | 'discard' | null>(null)
    const [loading, setLoading] = useState(false)
    const [customFee, setCustomFee] = useState(HANDLING_FEE.toString())

    const handleAction = async () => {
        if (!selectedAction) return

        const fee = parseFloat(customFee)

        // Check balance for ship and return actions
        if ((selectedAction === 'ship' || selectedAction === 'return') && userBalance < fee) {
            toast.error(`Insufficient balance. You need $${fee.toFixed(2)} but only have $${userBalance.toFixed(2)}`)
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Determine new status based on action
            let newStatus: string
            switch (selectedAction) {
                case 'ship':
                    newStatus = 'in_transit'
                    break
                case 'return':
                    newStatus = 'returned'
                    break
                case 'discard':
                    newStatus = 'discarded'
                    break
                default:
                    throw new Error('Invalid action')
            }

            // Update shipment with action and status
            const { error: shipmentError } = await supabase
                .from('shipments')
                .update({
                    customer_action: selectedAction,
                    status: newStatus,
                    handling_fee: selectedAction === 'discard' ? 0 : fee,
                    action_taken_at: new Date().toISOString()
                })
                .eq('id', shipmentId)

            if (shipmentError) throw shipmentError

            // Deduct handling fee from balance (except for discard)
            if (selectedAction !== 'discard') {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('balance')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    const { error: balanceError } = await supabase
                        .from('profiles')
                        .update({ balance: profile.balance - fee })
                        .eq('id', user.id)

                    if (balanceError) throw balanceError

                    // Create transaction record
                    await supabase
                        .from('transactions')
                        .insert({
                            user_id: user.id,
                            type: 'withdrawal',
                            amount: fee,
                            status: 'completed',
                            payment_method: 'balance',
                            description: `Handling fee for ${selectedAction === 'ship' ? 'shipping' : 'returning'} package ${trackingNumber}`
                        })
                }
            }

            const actionText = selectedAction === 'ship' ? 'shipped' : selectedAction === 'return' ? 'returned' : 'discarded'
            toast.success(`Package marked for ${actionText}${selectedAction !== 'discard' ? ` - $${fee.toFixed(2)} charged` : ''}`)
            setOpen(false)
            onSuccess()
        } catch (error: any) {
            console.error('Error processing action:', error)
            toast.error(error.message || 'Failed to process action')
        } finally {
            setLoading(false)
        }
    }

    const getActionDetails = () => {
        switch (selectedAction) {
            case 'ship':
                return {
                    title: 'Ship Package',
                    description: 'Forward this package to your address',
                    icon: <Package className="h-5 w-5" />,
                    color: 'text-blue-500'
                }
            case 'return':
                return {
                    title: 'Return Package',
                    description: 'Send this package back to sender',
                    icon: <Undo2 className="h-5 w-5" />,
                    color: 'text-yellow-500'
                }
            case 'discard':
                return {
                    title: 'Discard Package',
                    description: 'Dispose of this package (no fee)',
                    icon: <Trash2 className="h-5 w-5" />,
                    color: 'text-red-500'
                }
            default:
                return null
        }
    }

    const actionDetails = getActionDetails()

    return (
        <>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                        setSelectedAction('ship')
                        setOpen(true)
                    }}
                >
                    <Package className="h-4 w-4 mr-1" />
                    Ship
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        setSelectedAction('return')
                        setOpen(true)
                    }}
                >
                    <Undo2 className="h-4 w-4 mr-1" />
                    Return
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setSelectedAction('discard')
                        setCustomFee('0')
                        setOpen(true)
                    }}
                >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Discard
                </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {actionDetails && (
                                <>
                                    <span className={actionDetails.color}>{actionDetails.icon}</span>
                                    {actionDetails.title}
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {actionDetails?.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Tracking Number:</span>
                                <span className="font-medium">{trackingNumber}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Your Balance:</span>
                                <span className="font-medium">${userBalance.toFixed(2)}</span>
                            </div>
                            {selectedAction !== 'discard' && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span>Handling Fee:</span>
                                        <span className="font-medium">${parseFloat(customFee).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                                        <span>Remaining Balance:</span>
                                        <span className={userBalance - parseFloat(customFee) < 0 ? 'text-red-500' : 'text-green-500'}>
                                            ${(userBalance - parseFloat(customFee)).toFixed(2)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {selectedAction !== 'discard' && (
                            <div className="space-y-2">
                                <Label htmlFor="handling_fee">Handling Fee (USD)</Label>
                                <Input
                                    id="handling_fee"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={customFee}
                                    onChange={(e) => setCustomFee(e.target.value)}
                                />
                            </div>
                        )}

                        {userBalance < parseFloat(customFee) && selectedAction !== 'discard' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-sm text-red-500">
                                    ⚠️ Insufficient balance. Please deposit funds before proceeding.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAction}
                            disabled={loading || (selectedAction !== 'discard' && userBalance < parseFloat(customFee))}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Confirm {selectedAction === 'ship' ? 'Shipping' : selectedAction === 'return' ? 'Return' : 'Discard'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
