'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

export function useUserRole() {
    const [role, setRole] = useState<UserRole | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (profile) {
                        setRole(profile.role)
                    }
                }
            } catch (error) {
                console.error('Error fetching user role:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchRole()
    }, [supabase])

    return { role, loading, isReshipper: role === 'reshipper', isCustomer: role === 'customer', isModerator: (role as any) === 'moderator' }
}
