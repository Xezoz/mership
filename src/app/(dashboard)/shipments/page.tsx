'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Package, Loader2 } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { CreatePackageDialog } from '@/components/create-package-dialog'
import { ShippingLabelDialog } from '@/components/shipping-label-dialog'
import { Database } from '@/lib/supabase/database.types'
import { toast } from 'sonner'

type Shipment = Database['public']['Tables']['shipments']['Row']

type ShipmentWithProfiles = Shipment & {
    sender?: { full_name: string | null; email: string }
    recipient?: { full_name: string | null; email: string }
}

export default function ShipmentsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [shipments, setShipments] = useState<ShipmentWithProfiles[]>([])
    const [loading, setLoading] = useState(true)
    const [userBalance, setUserBalance] = useState(0)
    const [shippingDialogOpen, setShippingDialogOpen] = useState(false)
    const [selectedShipment, setSelectedShipment] = useState<{ id: string; trackingNumber: string } | null>(null)
    const supabase = createBrowserClient()
    const { isReshipper, isCustomer, isModerator } = useUserRole()

    const fetchShipments = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Fetch shipments - simplified query without joins
            let query = supabase
                .from('shipments')
                .select('*')
                .order('created_at', { ascending: false })

            // Apply filters based on role
            if (!isModerator) {
                query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            }

            const { data: shipmentsData, error: shipmentsError } = await query

            if (shipmentsError) {
                console.error('Error fetching shipments:', shipmentsError)
                toast.error('Failed to load shipments')
                setLoading(false)
                return
            }

            // Fetch profiles for senders and recipients manually
            let enrichedShipments: ShipmentWithProfiles[] = []
            if (shipmentsData && shipmentsData.length > 0) {
                const userIds = new Set<string>()
                shipmentsData.forEach(s => {
                    if (s.sender_id) userIds.add(s.sender_id)
                    if (s.recipient_id) userIds.add(s.recipient_id)
                })

                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', Array.from(userIds))

                if (profilesError) {
                    console.error('Error fetching profiles:', profilesError)
                }

                const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])

                const enrichedShipments = shipmentsData.map(shipment => ({
                    ...shipment,
                    sender: shipment.sender_id ? profilesMap.get(shipment.sender_id) : null,
                    recipient: shipment.recipient_id ? profilesMap.get(shipment.recipient_id) : null
                }))

                setShipments(enrichedShipments)
            } else {
                setShipments([])
            }
        } catch (error) {
            console.error('Error fetching shipments:', error)
            toast.error('Failed to load shipments')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchShipments()
        fetchUserBalance()

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('shipments_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, fetchShipments)
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase])

    const fetchUserBalance = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', user.id)
                .single()

            if (data) setUserBalance(data.balance)
        } catch (error) {
            console.error('Error fetching balance:', error)
        }
    }

    const handleStatusUpdate = async (shipmentId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('shipments')
                .update({ status: newStatus })
                .eq('id', shipmentId)

            if (error) {
                console.error('Shipment update error:', error)
                throw error
            }

            // Get shipment details for notification
            const shipment = shipments.find(s => s.id === shipmentId)
            if (shipment && shipment.sender_id) {
                // Create notification for customer
                try {
                    const { error: notifError } = await supabase
                        .from('notifications')
                        .insert({
                            user_id: shipment.sender_id,
                            type: 'status_updated',
                            title: 'Package Status Updated',
                            message: `Your package (${shipment.tracking_number}) status has been updated to ${newStatus}`,
                            related_shipment_id: shipmentId,
                            read: false
                        })

                    if (notifError) {
                        console.error('Notification creation error:', notifError)
                        // Don't throw - notification failure shouldn't block status update
                    }
                } catch (notifError) {
                    console.error('Notification error:', notifError)
                    // Continue anyway
                }
            }

            toast.success('Status updated successfully')
            fetchShipments()
        } catch (error: any) {
            console.error('Error updating status:', error)
            toast.error(error?.message || 'Failed to update status')
        }
    }

    const handleCustomerAction = async (shipmentId: string, action: 'ship' | 'discard', trackingNumber: string) => {
        // For ship action, open the shipping label dialog
        if (action === 'ship') {
            setSelectedShipment({ id: shipmentId, trackingNumber })
            setShippingDialogOpen(true)
            return
        }

        // For discard, process immediately
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Update shipment
            const { error: shipmentError } = await supabase
                .from('shipments')
                .update({
                    customer_action: action,
                    status: 'discarded',
                    handling_fee: 0,
                    action_taken_at: new Date().toISOString()
                })
                .eq('id', shipmentId)

            if (shipmentError) throw shipmentError

            // Create notification for customer
            await supabase
                .from('notifications')
                .insert({
                    user_id: user.id,
                    title: 'Package Discarded',
                    message: `Package ${trackingNumber} has been marked for discard.`,
                    type: 'info',
                    read: false
                })

            // Fetch shipment to get recipient (reshipper) for notification
            const { data: shipmentData } = await supabase
                .from('shipments')
                .select('recipient_id')
                .eq('id', shipmentId)
                .single()

            if (shipmentData?.recipient_id) {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: shipmentData.recipient_id,
                        title: 'Shipment Update',
                        message: `Customer has requested to discard package ${trackingNumber}.`,
                        type: 'warning',
                        read: false
                    })
            }

            toast.success('Package marked for discarded')
            fetchShipments()
            fetchUserBalance()
        } catch (error: any) {
            console.error('Error processing action:', error)
            toast.error(error.message || 'Failed to process action')
        }
    }


    const getStatusColor = (status: string) => {
        return 'bg-secondary text-secondary-foreground'
    }

    const filteredShipments = shipments.filter((shipment) =>
        shipment.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: shipments.length,
        pending: shipments.filter(s => s.status === 'pending').length,
        in_transit: shipments.filter(s => s.status === 'in_transit' || s.status === 'received').length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Shipments</h2>
                    <p className="text-muted-foreground">
                        {isCustomer ? 'Manage your expected packages' : 'Manage assigned packages'}
                    </p>
                </div>
                {isCustomer && <CreatePackageDialog onSuccess={fetchShipments} />}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.in_transit}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.delivered}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by tracking number, product, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Shipments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {isCustomer ? 'My Expected Packages' : 'Assigned Packages'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredShipments.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery ? 'No shipments found' : 'No shipments yet'}
                            </p>
                            {isCustomer && !searchQuery && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Click "Add Expected Package" to get started
                                </p>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tracking Number</TableHead>
                                    <TableHead>Product</TableHead>
                                    {isCustomer && <TableHead>Reshipper</TableHead>}
                                    {(isReshipper || isModerator) && <TableHead>Customer</TableHead>}
                                    {isModerator && <TableHead>Assigned Reshipper</TableHead>}
                                    <TableHead>Route</TableHead>
                                    <TableHead>Status</TableHead>
                                    {(isReshipper || isModerator) && <TableHead>Actions</TableHead>}
                                    {isCustomer && <TableHead>Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredShipments.map((shipment) => (
                                    <TableRow key={shipment.id}>
                                        <TableCell className="font-medium">
                                            {shipment.tracking_number}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{shipment.product_name || 'N/A'}</p>
                                                {shipment.product_value && (
                                                    <p className="text-sm text-muted-foreground">
                                                        ${shipment.product_value.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        {isCustomer && (
                                            <TableCell>
                                                {shipment.recipient?.full_name || shipment.recipient?.email || 'N/A'}
                                            </TableCell>
                                        )}
                                        {(isReshipper || isModerator) && (
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{shipment.sender?.full_name || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">{shipment.sender?.email}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {isModerator && (
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{shipment.recipient?.full_name || 'Unassigned'}</span>
                                                    <span className="text-xs text-muted-foreground">{shipment.recipient?.email}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div className="text-sm">
                                                <p>{shipment.origin}</p>
                                                <p className="text-muted-foreground">→ {shipment.destination}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(shipment.status)}>
                                                {shipment.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        {(isReshipper || isModerator) && (
                                            <TableCell>
                                                <Select
                                                    value={shipment.status}
                                                    onValueChange={(value) => handleStatusUpdate(shipment.id, value)}
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="received">Received</SelectItem>
                                                        <SelectItem value="in_transit">In Transit</SelectItem>
                                                        <SelectItem value="delivered">Delivered</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        )}
                                        {isCustomer && (
                                            <TableCell>
                                                {shipment.status === 'received' && !shipment.customer_action ? (
                                                    <Select
                                                        onValueChange={(value) => handleCustomerAction(shipment.id, value as 'ship' | 'discard', shipment.tracking_number)}
                                                    >
                                                        <SelectTrigger className="w-[140px]">
                                                            <SelectValue placeholder="Choose action" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ship">Ship</SelectItem>
                                                            <SelectItem value="discard">Discard</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : shipment.customer_action ? (
                                                    <Badge variant="outline" className="capitalize">
                                                        {shipment.customer_action}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Shipping Label Dialog */}
            {selectedShipment && (
                <ShippingLabelDialog
                    open={shippingDialogOpen}
                    onOpenChange={setShippingDialogOpen}
                    shipmentId={selectedShipment.id}
                    trackingNumber={selectedShipment.trackingNumber}
                    userBalance={userBalance}
                    onSuccess={() => {
                        fetchShipments()
                        fetchUserBalance()
                    }}
                />
            )}
        </div>
    )
}
