'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Trophy } from 'lucide-react'

type TopReshipper = {
    id: string
    full_name: string | null
    email: string | null
    shipment_count: number
    rank: number
}

type TopReshippersCardProps = {
    reshippers: TopReshipper[]
}

export function TopReshippersCard({ reshippers }: TopReshippersCardProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Top Reshippers</CardTitle>
                </div>
                <CardDescription>
                    Highest performing reshippers by volume
                </CardDescription>
            </CardHeader>
            <CardContent>
                {reshippers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No data available
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reshippers.map((reshipper) => (
                            <div key={reshipper.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium">
                                        #{reshipper.rank}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {reshipper.full_name || 'Unknown Reshipper'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {reshipper.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{reshipper.shipment_count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
