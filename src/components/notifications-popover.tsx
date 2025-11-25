'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Database } from '@/lib/supabase/database.types'

type Notification = Database['public']['Tables']['notifications']['Row']

export function NotificationsPopover() {
    const supabase = createBrowserClient()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchNotifications()

        // Subscribe to real-time notifications
        const subscription = supabase
            .channel('notifications_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            }, () => {
                fetchNotifications()
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error

            setNotifications(data || [])
            setUnreadCount(data?.filter(n => !n.read).length || 0)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)

            fetchNotifications()
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false)

            fetchNotifications()
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'package_assigned':
                return '📦'
            case 'status_updated':
                return '🔄'
            case 'message_received':
                return '💬'
            case 'payment_received':
                return '💰'
            default:
                return '🔔'
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-96">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-muted/30' : ''
                                        }`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-sm">{notification.title}</p>
                                                {!notification.read && (
                                                    <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(notification.created_at).toLocaleDateString()} at{' '}
                                                {new Date(notification.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
