'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Users, Star, MapPin, Mail, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

type Reshipper = {
    id: string
    full_name: string | null
    email: string
    address_city: string | null
    address_state: string | null
    address_country: string | null
    address_street: string | null
    address_zip: string | null
    rating: number
    review_count: number
    total_shipments: number
    is_verified: boolean
    avatar_url: string | null
    about: string | null
    allowed_sites: string[] | null
    banned_items: string[] | null
}

import { useDebounce } from '@/hooks/use-debounce'

export default function ReshippersPage() {
    const supabase = createBrowserClient()
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearch = useDebounce(searchQuery, 500)
    const [selectedReshipper, setSelectedReshipper] = useState<Reshipper | null>(null)
    const [reshippers, setReshippers] = useState<Reshipper[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReshippers()
    }, [debouncedSearch])

    const fetchReshippers = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'reshipper')
                .order('rating', { ascending: false })

            if (debouncedSearch) {
                const searchTerm = `%${debouncedSearch}%`
                query = query.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},address_city.ilike.${searchTerm},address_country.ilike.${searchTerm}`)
            }

            const { data, error } = await query

            if (error) throw error
            setReshippers(data || [])
        } catch (error) {
            console.error('Error fetching reshippers:', error)
        } finally {
            setLoading(false)
        }
    }

    const stats = {
        total: reshippers.length,
        verified: reshippers.filter(r => r.is_verified).length,
        topRated: reshippers.filter(r => r.rating >= 4.8).length,
        avgRating: reshippers.length > 0
            ? (reshippers.reduce((sum, r) => sum + r.rating, 0) / reshippers.length).toFixed(1)
            : '0.0',
    }

    if (loading) {
        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reshippers</h2>
                    <p className="text-muted-foreground">Loading reshippers...</p>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reshippers</h2>
                    <p className="text-muted-foreground">
                        Find trusted reshippers for your packages
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reshippers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Available now</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.verified}</div>
                        <p className="text-xs text-muted-foreground">Trusted partners</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Rated</CardTitle>
                        <Star className="h-4 w-4 text-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.topRated}</div>
                        <p className="text-xs text-muted-foreground">4.8+ Rating</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                        <Star className="h-4 w-4 text-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgRating}</div>
                        <p className="text-xs text-muted-foreground">Out of 5.0</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Reshippers Grid */}
            {reshippers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No reshippers found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reshippers.map((reshipper) => (
                        <Card key={reshipper.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={reshipper.avatar_url || ''} />
                                            <AvatarFallback>
                                                {reshipper.full_name?.[0] || reshipper.email[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{reshipper.full_name || 'User'}</h3>
                                                {reshipper.is_verified && (
                                                    <CheckCircle2 className="h-4 w-4 text-foreground" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {reshipper.address_city && reshipper.address_country
                                                    ? `${reshipper.address_city}, ${reshipper.address_country}`
                                                    : 'Location not set'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-foreground" />
                                        <span className="font-medium">{reshipper.rating.toFixed(1)}</span>
                                        <span className="text-muted-foreground">({reshipper.review_count} reviews)</span>
                                    </div>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    {reshipper.total_shipments} shipments completed
                                </div>

                                {reshipper.about && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {reshipper.about}
                                    </p>
                                )}
                            </CardContent>

                            <CardFooter>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setSelectedReshipper(reshipper)}
                                        >
                                            View Details
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                {reshipper.full_name || 'User'}
                                                {reshipper.is_verified && (
                                                    <CheckCircle2 className="h-5 w-5 text-foreground" />
                                                )}
                                            </DialogTitle>
                                            <DialogDescription>
                                                Reshipper Profile Details
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-6">
                                            {/* Contact Info */}
                                            <div>
                                                <h4 className="font-semibold mb-2">Contact Information</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        <span>{reshipper.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                            {reshipper.address_street && `${reshipper.address_street}, `}
                                                            {reshipper.address_city && `${reshipper.address_city}, `}
                                                            {reshipper.address_state && `${reshipper.address_state} `}
                                                            {reshipper.address_zip && `${reshipper.address_zip}, `}
                                                            {reshipper.address_country || 'Address not set'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* About */}
                                            {reshipper.about && (
                                                <>
                                                    <div>
                                                        <h4 className="font-semibold mb-2">About</h4>
                                                        <p className="text-sm text-muted-foreground">{reshipper.about}</p>
                                                    </div>
                                                    <Separator />
                                                </>
                                            )}

                                            {/* Allowed Sites */}
                                            {reshipper.allowed_sites && reshipper.allowed_sites.length > 0 && (
                                                <>
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Allowed Sites</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {reshipper.allowed_sites.map((site, idx) => (
                                                                <Badge key={idx} variant="secondary">
                                                                    {site}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <Separator />
                                                </>
                                            )}

                                            {/* Banned Items */}
                                            {reshipper.banned_items && reshipper.banned_items.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold mb-2">Banned Items</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {reshipper.banned_items.map((item, idx) => (
                                                            <Badge key={idx} variant="destructive">
                                                                {item}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
