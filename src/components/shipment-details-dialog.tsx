'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'

type ShipmentDetailsDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    shipment: {
        tracking_number: string
        shipping_label_url?: string | null
        shipping_carrier?: string | null
        outbound_tracking_number?: string | null
        shipping_instructions?: string | null
    }
}

export function ShipmentDetailsDialog({
    open,
    onOpenChange,
    shipment
}: ShipmentDetailsDialogProps) {
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied to clipboard`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Shipment Details</DialogTitle>
                    <DialogDescription>
                        Shipping information provided by the customer
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Tracking Number */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Package Tracking Number</Label>
                        <div className="font-medium flex items-center gap-2">
                            {shipment.tracking_number}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => copyToClipboard(shipment.tracking_number, 'Tracking number')}
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Shipping Label */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Shipping Label</Label>
                        {shipment.shipping_label_url ? (
                            <div className="flex items-center gap-2">
                                <a
                                    href={shipment.shipping_label_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all text-sm flex-1"
                                >
                                    {shipment.shipping_label_url}
                                </a>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => window.open(shipment.shipping_label_url!, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Open
                                </Button>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">No label provided</div>
                        )}
                    </div>

                    {/* Carrier */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Carrier</Label>
                            <div className="font-medium capitalize">
                                {shipment.shipping_carrier || 'Not specified'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Outbound Tracking</Label>
                            <div className="font-medium">
                                {shipment.outbound_tracking_number || 'Not provided'}
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Special Instructions</Label>
                        <div className="text-sm bg-muted p-3 rounded-md min-h-[60px]">
                            {shipment.shipping_instructions || 'No special instructions.'}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
