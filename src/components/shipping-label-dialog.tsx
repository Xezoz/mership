'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'

type ShippingLabelDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    shipmentId: string
    trackingNumber: string
    userBalance: number
    onSuccess: () => void
}

const HANDLING_FEE = 19.99

export function ShippingLabelDialog({
    open,
    onOpenChange,
    shipmentId,
    trackingNumber,
    userBalance,
    onSuccess
}: ShippingLabelDialogProps) {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        shipping_label_url: '',
        shipping_carrier: '',
        outbound_tracking_number: '',
        shipping_instructions: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.shipping_label_url) {
            toast.error('Please provide a shipping label URL')
            return
        }

        if (userBalance < HANDLING_FEE) {
            toast.error(`Insufficient balance. You need $${HANDLING_FEE.toFixed(2)} but only have $${userBalance.toFixed(2)}`)
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Update shipment with shipping info
            const { error: shipmentError } = await supabase
                .from('shipments')
                .update({
                    customer_action: 'ship',
                    status: 'in_transit',
                    handling_fee: HANDLING_FEE,
                    action_taken_at: new Date().toISOString(),
                    shipping_label_url: formData.shipping_label_url,
                    shipping_carrier: formData.shipping_carrier || null,
                    outbound_tracking_number: formData.outbound_tracking_number || null,
                    shipping_instructions: formData.shipping_instructions || null
                })
                .eq('id', shipmentId)

            if (shipmentError) throw shipmentError

            // Deduct handling fee from balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', user.id)
                .single()

            if (profile) {
                const { error: balanceError } = await supabase
                    .from('profiles')
                    .update({ balance: profile.balance - HANDLING_FEE })
                    .eq('id', user.id)

                if (balanceError) throw balanceError

                // Create transaction record
                await supabase
                    .from('transactions')
                    .insert({
                        user_id: user.id,
                        type: 'withdrawal',
                        amount: HANDLING_FEE,
                        status: 'completed',
                        payment_method: 'balance',
                        description: `Handling fee for shipping package ${trackingNumber}`
                    })
            }

            // Fetch shipment details to get reshipper
            const { data: shipmentData, error: shipmentFetchError } = await supabase
                .from('shipments')
                .select('recipient_id')
                .eq('id', shipmentId)
                .single()

            if (shipmentFetchError) {
                console.error('Error fetching shipment data:', shipmentFetchError)
            }

            // Credit reshipper with $10
            if (shipmentData?.recipient_id) {
                console.log('Processing payment for reshipper:', shipmentData.recipient_id)

                const { data: reshipperProfile, error: profileError } = await supabase
                    .from('profiles')
                    .select('balance')
                    .eq('id', shipmentData.recipient_id)
                    .single()

                if (profileError) {
                    console.error('Error fetching reshipper profile:', profileError)
                }

                if (reshipperProfile) {
                    const newBalance = reshipperProfile.balance + 10.00
                    console.log('Updating reshipper balance from', reshipperProfile.balance, 'to', newBalance)

                    // Add $10 to reshipper balance
                    const { error: balanceUpdateError } = await supabase
                        .from('profiles')
                        .update({ balance: newBalance })
                        .eq('id', shipmentData.recipient_id)

                    if (balanceUpdateError) {
                        console.error('Error updating reshipper balance:', balanceUpdateError)
                    } else {
                        console.log('Successfully updated reshipper balance')
                    }

                    // Create transaction for reshipper
                    const { error: transactionError } = await supabase
                        .from('transactions')
                        .insert({
                            user_id: shipmentData.recipient_id,
                            type: 'deposit',
                            amount: 10.00,
                            status: 'completed',
                            payment_method: 'platform',
                            description: `Reshipper fee for package ${trackingNumber}`
                        })

                    if (transactionError) {
                        console.error('Error creating reshipper transaction:', transactionError)
                    }
                }

                // Create notification for reshipper
                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: shipmentData.recipient_id,
                        title: 'Payment Received',
                        message: `You received $10.00 for processing package ${trackingNumber}.`,
                        type: 'payment_received',
                        read: false
                    })

                if (notificationError) {
                    console.error('Error creating reshipper notification:', notificationError)
                }
            } else {
                console.log('No reshipper found for this shipment')
            }

            // Credit moderator with platform revenue ($19.99 - $10 reshipper - $0.90 Whop fees = $9.09)
            const MODERATOR_SHARE = 9.09
            const { data: moderatorProfile, error: modError } = await supabase
                .from('profiles')
                .select('id, balance')
                .eq('role', 'moderator')
                .limit(1)
                .single()

            if (!modError && moderatorProfile) {
                console.log('Processing platform revenue for moderator:', moderatorProfile.id)

                // Credit moderator balance
                const { error: modBalanceError } = await supabase
                    .from('profiles')
                    .update({ balance: moderatorProfile.balance + MODERATOR_SHARE })
                    .eq('id', moderatorProfile.id)

                if (modBalanceError) {
                    console.error('Error updating moderator balance:', modBalanceError)
                } else {
                    console.log('Successfully credited moderator with $', MODERATOR_SHARE)

                    // Create transaction record for moderator
                    await supabase
                        .from('transactions')
                        .insert({
                            user_id: moderatorProfile.id,
                            type: 'deposit',
                            amount: MODERATOR_SHARE,
                            status: 'completed',
                            payment_method: 'platform',
                            description: `Platform revenue from package ${trackingNumber} ($19.99 - $10 reshipper - $0.90 fees)`
                        })
                }
            } else {
                console.log('No moderator account found for revenue distribution')
            }

            // Create notification for customer
            await supabase
                .from('notifications')
                .insert({
                    user_id: user.id,
                    title: 'Package Shipped',
                    message: `Package ${trackingNumber} has been marked for shipping. $${HANDLING_FEE.toFixed(2)} handling fee charged.`,
                    type: 'success',
                    read: false
                })

            toast.success(`Package marked for shipping - $${HANDLING_FEE.toFixed(2)} charged`)
            onOpenChange(false)
            setFormData({
                shipping_label_url: '',
                shipping_carrier: '',
                outbound_tracking_number: '',
                shipping_instructions: ''
            })
            onSuccess()
        } catch (error: any) {
            console.error('Error processing shipping:', error)
            toast.error(error.message || 'Failed to process shipping')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Ship Package</DialogTitle>
                    <DialogDescription>
                        Upload shipping label and provide shipping details
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Tracking Number:</span>
                            <span className="font-medium">{trackingNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Your Balance:</span>
                            <span className="font-medium">${userBalance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Handling Fee:</span>
                            <span className="font-medium">${HANDLING_FEE.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold border-t pt-2">
                            <span>Remaining Balance:</span>
                            <span className={userBalance - HANDLING_FEE < 0 ? 'text-red-500' : 'text-green-500'}>
                                ${(userBalance - HANDLING_FEE).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shipping_label_url">Shipping Label URL *</Label>
                        <Input
                            id="shipping_label_url"
                            type="url"
                            placeholder="https://example.com/label.pdf"
                            value={formData.shipping_label_url}
                            onChange={(e) => setFormData({ ...formData, shipping_label_url: e.target.value })}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Upload your label to a file hosting service and paste the URL here
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shipping_carrier">Shipping Carrier</Label>
                        <Select
                            value={formData.shipping_carrier}
                            onValueChange={(value) => setFormData({ ...formData, shipping_carrier: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select carrier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="usps">USPS</SelectItem>
                                <SelectItem value="ups">UPS</SelectItem>
                                <SelectItem value="fedex">FedEx</SelectItem>
                                <SelectItem value="dhl">DHL</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="outbound_tracking_number">Tracking Number (Optional)</Label>
                        <Input
                            id="outbound_tracking_number"
                            placeholder="Tracking number for this label"
                            value={formData.outbound_tracking_number}
                            onChange={(e) => setFormData({ ...formData, outbound_tracking_number: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shipping_instructions">Special Instructions</Label>
                        <Textarea
                            id="shipping_instructions"
                            placeholder="Any special handling instructions..."
                            value={formData.shipping_instructions}
                            onChange={(e) => setFormData({ ...formData, shipping_instructions: e.target.value })}
                            rows={3}
                        />
                    </div>

                    {userBalance < HANDLING_FEE && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-500">
                                ⚠️ Insufficient balance. Please deposit funds before proceeding.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || userBalance < HANDLING_FEE}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Confirm Shipping
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
