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
                console.log('useUserRole: fetching user...')
                const { data: { user }, error: userError } = await supabase.auth.getUser()
                if (userError) throw userError

                if (user) {
                    console.log('useUserRole: user found, fetching profile...', user.id)
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (profileError) throw profileError

                    if (profile) {
                        console.log('useUserRole: profile found, role:', profile.role)
                        setRole(profile.role)
                    }
                } else {
                    console.log('useUserRole: no user found')
                }
            } catch (error) {
                console.error('Error fetching user role:', error)
            } finally {
                console.log('useUserRole: finished loading')
                setLoading(false)
            }
        }

        fetchRole()
    }, [supabase])

    return { role, loading, isReshipper: role === 'reshipper', isCustomer: role === 'customer', isModerator: role === 'moderator' }
}
