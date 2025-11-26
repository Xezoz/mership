'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export function SidebarUserFooter() {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<{
        full_name: string | null
        email: string
        role: string
        avatar_url: string | null
    } | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, email, avatar_url, role')
                    .eq('id', user.id)
                    .single()

                if (error) {
                    console.error('Error fetching profile:', error.message, error.code, error.details)
                    setLoading(false)
                    return
                }

                if (data) {
                    setProfile({
                        full_name: data.full_name,
                        email: data.email,
                        role: data.role || 'customer',
                        avatar_url: data.avatar_url
                    })
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [])

    if (loading) {
        return (
            <div className="p-4 border-t">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) return null



    return (
        <div className="p-4 border-t bg-card">
            <div className="flex items-center gap-3 mb-3">
                <Avatar>
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback>{profile.full_name?.[0] || profile.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">
                        {profile.full_name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                        {profile.email}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="w-full justify-center capitalize">
                    {profile.role}
                </Badge>
                <Button variant="ghost" size="icon" asChild className="h-6 w-6">
                    <Link href="/settings">
                        <Settings className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    )
}
