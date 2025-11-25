'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Reshipper = {
    id: string
    full_name: string | null
    email: string
    address_city: string | null
    address_country: string | null
}

export function CreatePackageDialog({ onSuccess }: { onSuccess?: () => void }) {
    const supabase = createBrowserClient()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [reshippers, setReshippers] = useState<Reshipper[]>([])
    const [formData, setFormData] = useState({
        recipient_id: '',
        tracking_number: '',
        product_name: '',
        product_description: '',
        product_value: '',
        notes: '',
        origin: '',
        destination: ''
    })

    useEffect(() => {
        if (open) {
            fetchReshippers()
        }
    }, [open])

    const fetchReshippers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, address_city, address_country')
                .eq('role', 'reshipper')
                .order('full_name')

            if (error) throw error
            setReshippers(data || [])
        } catch (error) {
            console.error('Error fetching reshippers:', error)
            toast.error('Failed to load reshippers')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Create shipment
            const { data: shipment, error: shipmentError } = await supabase
                .from('shipments')
                .insert({
                    sender_id: user.id,
                    recipient_id: formData.recipient_id,
                    tracking_number: formData.tracking_number,
                    product_name: formData.product_name,
                    product_description: formData.product_description,
                    product_value: formData.product_value ? parseFloat(formData.product_value) : null,
                    notes: formData.notes || null,
                    origin: formData.origin,
                    destination: formData.destination,
                    status: 'pending',
                    weight: 0,
                    cost: 0
                })
                .select()
                .single()

            if (shipmentError) throw shipmentError

            // Create notification for reshipper
            const selectedReshipper = reshippers.find(r => r.id === formData.recipient_id)
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: formData.recipient_id,
                    type: 'package_assigned',
                    title: 'New Package Assigned',
                    message: `You have been assigned a new package with tracking number ${formData.tracking_number}`,
                    related_shipment_id: shipment.id,
                    read: false
                })

            if (notifError) console.error('Notification error:', notifError)

            toast.success('Package created successfully!')
            setOpen(false)
            setFormData({
                recipient_id: '',
                tracking_number: '',
                product_name: '',
                product_description: '',
                product_value: '',
                notes: '',
                origin: '',
                destination: ''
            })
            onSuccess?.()
        } catch (error: any) {
            console.error('Error creating package:', error)
            toast.error(error.message || 'Failed to create package')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expected Package
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Expected Package</DialogTitle>
                    <DialogDescription>
                        Add a package you're expecting and assign it to a reshipper
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Reshipper Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="reshipper">Select Reshipper *</Label>
                        <Select
                            value={formData.recipient_id}
                            onValueChange={(value) => setFormData({ ...formData, recipient_id: value })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a reshipper" />
                            </SelectTrigger>
                            <SelectContent>
                                {reshippers.map((reshipper) => (
                                    <SelectItem key={reshipper.id} value={reshipper.id}>
                                        {reshipper.full_name || reshipper.email}
                                        {reshipper.address_city && reshipper.address_country &&
                                            ` (${reshipper.address_city}, ${reshipper.address_country})`
                                        }
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tracking Number */}
                    <div className="space-y-2">
                        <Label htmlFor="tracking_number">Tracking Number *</Label>
                        <Input
                            id="tracking_number"
                            value={formData.tracking_number}
                            onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                            placeholder="e.g., 1Z999AA10123456784"
                            required
                        />
                    </div>

                    {/* Origin & Destination */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="origin">Origin *</Label>
                            <Input
                                id="origin"
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                placeholder="e.g., New York, USA"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="destination">Destination *</Label>
                            <Input
                                id="destination"
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                placeholder="e.g., London, UK"
                                required
                            />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                        <Label htmlFor="product_name">Product Name *</Label>
                        <Input
                            id="product_name"
                            value={formData.product_name}
                            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                            placeholder="e.g., iPhone 15 Pro"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="product_description">Product Description</Label>
                        <Textarea
                            id="product_description"
                            value={formData.product_description}
                            onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                            placeholder="Additional details about the product..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="product_value">Product Value (USD)</Label>
                        <Input
                            id="product_value"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.product_value}
                            onChange={(e) => setFormData({ ...formData, product_value: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any special instructions or notes..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Package
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
