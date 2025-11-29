'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Send, MoreVertical, Loader2, MessageSquare, MapPin, Check, Ban, Copy, CheckCircle2, Shield, Headphones } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Message = Database['public']['Tables']['messages']['Row']

interface Conversation {
    id: string
    customer_id: string
    reshipper_id: string
    last_message?: string
    last_message_at?: string
    unread_count?: number
    other_user?: Profile
}

export default function InboxPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [reshippers, setReshippers] = useState<Profile[]>([])
    const [moderators, setModerators] = useState<Profile[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [selectedReshipper, setSelectedReshipper] = useState<Profile | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [messageInput, setMessageInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const supabase = createBrowserClient()
    const { role, isCustomer, isReshipper, isModerator, loading: roleLoading } = useUserRole()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
    }, [supabase])

    // Fetch Conversations (for both roles)
    useEffect(() => {
        // Wait for role to load before fetching
        if (roleLoading) return

        const fetchConversations = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data, error } = await supabase
                    .from('conversations')
                    .select('*')
                    .or(`customer_id.eq.${user.id},reshipper_id.eq.${user.id}`)
                    .order('last_message_at', { ascending: false })

                if (error) throw error

                const conversationsWithDetails = await Promise.all(data.map(async (conv: Conversation) => {
                    const otherUserId = conv.customer_id === user.id ? conv.reshipper_id : conv.customer_id
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', otherUserId)
                        .single()

                    return {
                        ...conv,
                        other_user: profile || { id: otherUserId, email: 'Unknown', full_name: 'Unknown User', avatar_url: null, role: 'customer' as const, created_at: '', updated_at: '' }
                    }
                }))

                // Sort by last message time (most recent first)
                const sortedConversations = conversationsWithDetails.sort((a, b) => {
                    const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
                    const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
                    return timeB - timeA // Most recent first
                })

                // Deduplicate conversations based on other_user.id to ensure one convo per user
                const uniqueConversationsMap = new Map()
                sortedConversations.forEach(conv => {
                    const otherId = conv.other_user?.id
                    if (otherId && !uniqueConversationsMap.has(otherId)) {
                        uniqueConversationsMap.set(otherId, conv)
                    }
                })
                const uniqueConversations = Array.from(uniqueConversationsMap.values())

                console.log('Inbox Debug:', {
                    role,
                    isModerator,
                    totalConvs: uniqueConversations.length,
                    convs: uniqueConversations.map(c => ({
                        id: c.id,
                        other_user_id: c.other_user?.id,
                        other_user_role: c.other_user?.role,
                        other_user_name: c.other_user?.full_name
                    }))
                })

                setConversations(uniqueConversations)
            } catch (error) {
                console.error('Error fetching conversations:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchConversations()

        const subscription = supabase
            .channel('conversations_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations)
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, roleLoading, role, isModerator])

    // Fetch Reshippers and Moderators (only for customers)
    useEffect(() => {
        // Wait for role to load
        if (roleLoading) return
        if (!isCustomer && !isReshipper && !isModerator) return

        const fetchAvailableUsers = async () => {
            let query = supabase.from('profiles').select('*')

            if (isCustomer) {
                query = query.in('role', ['reshipper', 'moderator'])
            } else if (isReshipper) {
                query = query.eq('role', 'moderator')
            } else if (isModerator) {
                query = query.eq('role', 'reshipper')
            } else {
                return // Should not happen
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching available users:', error)
            } else if (data) {
                console.log('Available Users Debug:', {
                    isModerator,
                    isReshipper,
                    isCustomer,
                    fetchedUsers: data.map(u => ({ id: u.id, name: u.full_name, role: u.role }))
                })
                setReshippers(data.filter(p => p.role === 'reshipper'))
                setModerators(data.filter(p => p.role === 'moderator'))
            }
        }

        fetchAvailableUsers()
    }, [isCustomer, isReshipper, isModerator, supabase, roleLoading])

    // Fetch Messages for Selected Conversation
    useEffect(() => {
        if (!selectedConversation) {
            setMessages([])
            return
        }

        // Clear messages when switching conversations
        setMessages([])

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', selectedConversation.id)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching messages:', error)
            } else if (data) {
                setMessages(data)
            }
        }

        fetchMessages()

        // Set up polling as fallback (every 2 seconds)
        const pollInterval = setInterval(fetchMessages, 2000)

        // Set up realtime subscription
        const channel = supabase
            .channel(`conversation:${selectedConversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${selectedConversation.id}`
            }, (payload: { new: Message }) => {
                console.log('Received new message via realtime:', payload.new)
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some(msg => msg.id === payload.new.id)) {
                        return prev
                    }
                    return [...prev, payload.new]
                })
            })
            .subscribe((status) => {
                console.log('Realtime subscription status:', status)
            })

        return () => {
            clearInterval(pollInterval)
            channel.unsubscribe()
        }
    }, [selectedConversation, supabase])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleStartConversation = async (reshipper: Profile) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Check if conversation already exists
            const existing = conversations.find(c => c.reshipper_id === reshipper.id)
            if (existing) {
                setSelectedConversation(existing)
                setSelectedReshipper(null)
                return
            }

            // Create new conversation
            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    customer_id: user.id,
                    reshipper_id: reshipper.id,
                    last_message: '',
                })
                .select()
                .single()

            if (error) throw error

            const newConv = { ...data, other_user: reshipper }
            setConversations([newConv, ...conversations])
            setSelectedConversation(newConv)
            setSelectedReshipper(null)
        } catch (error) {
            console.error('Error starting conversation:', error)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!messageInput.trim() || !selectedConversation) return

        const messageContent = messageInput
        setMessageInput('') // Clear input immediately
        setSending(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: newMessage, error } = await supabase.from('messages').insert({
                conversation_id: selectedConversation.id,
                sender_id: user.id,
                content: messageContent,
            }).select().single()

            if (error) throw error

            // Add the actual message from database (not optimistic)
            if (newMessage) {
                setMessages((prev) => {
                    // Check if message already exists
                    if (prev.some(msg => msg.id === newMessage.id)) {
                        return prev
                    }
                    return [...prev, newMessage]
                })
            }

            await supabase.from('conversations').update({
                last_message: messageContent,
                last_message_at: new Date().toISOString(),
            }).eq('id', selectedConversation.id)

        } catch (error) {
            console.error('Error sending message:', error)
            // Restore message input on error
            setMessageInput(messageContent)
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 md:flex-row">
            {/* Left Sidebar */}
            <Card className="w-full md:w-80 flex flex-col">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search..." className="pl-9" />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                        {/* Show Reshippers/Support List (Customers, Reshippers, Moderators) */}
                        {(isCustomer || isReshipper || isModerator) && (
                            <>
                                {/* Support Section */}
                                {moderators.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">Support Team</div>
                                        {moderators.map((mod) => {
                                            // Find existing conversation with this moderator
                                            const existingConv = conversations.find(c =>
                                                c.customer_id === mod.id || c.reshipper_id === mod.id
                                            )

                                            return (
                                                <button
                                                    key={mod.id}
                                                    onClick={() => handleStartConversation(mod)}
                                                    className="flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50"
                                                >
                                                    <Avatar>
                                                        <AvatarImage src={mod.avatar_url || undefined} />
                                                        <AvatarFallback>{mod.full_name?.[0] || 'S'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold">{mod.full_name || 'Support Agent'}</span>
                                                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {existingConv?.last_message || 'Start a conversation'}
                                                        </p>
                                                    </div>
                                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            )
                                        })}
                                    </>
                                )}

                                {/* Reshippers Section */}
                                {reshippers.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground mt-2">Available Reshippers</div>
                                        {reshippers.map((reshipper) => {
                                            // Find existing conversation with this reshipper
                                            const existingConv = conversations.find(c =>
                                                c.customer_id === reshipper.id || c.reshipper_id === reshipper.id
                                            )

                                            return (
                                                <button
                                                    key={reshipper.id}
                                                    onClick={() => handleStartConversation(reshipper)}
                                                    className="flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50"
                                                >
                                                    <Avatar>
                                                        <AvatarImage src={reshipper.avatar_url || undefined} />
                                                        <AvatarFallback>{reshipper.full_name?.[0] || reshipper.email?.[0]?.toUpperCase() || 'R'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 overflow-hidden">
                                                        <span className="font-semibold">{reshipper.full_name || 'Reshipper'}</span>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {existingConv?.last_message || 'Start a conversation'}
                                                        </p>
                                                    </div>
                                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            )
                                        })}
                                    </>
                                )}
                            </>
                        )}

                        {/* Show Conversations - Filter out moderators and reshippers for customers */}
                        {conversations.length === 0 && !isCustomer && !isReshipper && !isModerator && (
                            <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet</div>
                        )}
                        {conversations
                            .filter(conv => {
                                console.log('Filter check:', {
                                    convId: conv.id,
                                    otherUserRole: conv.other_user?.role,
                                    isModerator,
                                    isReshipper,
                                    isCustomer,
                                    willShow: isModerator ? conv.other_user?.role !== 'reshipper' : true
                                })

                                // For customers: exclude conversations with moderators and reshippers
                                if (isCustomer) {
                                    return conv.other_user?.role !== 'moderator' && conv.other_user?.role !== 'reshipper'
                                }
                                // For reshippers: exclude conversations with moderators (Support)
                                if (isReshipper) {
                                    return conv.other_user?.role !== 'moderator'
                                }
                                // For moderators: exclude reshippers (shown in Available Reshippers)
                                if (isModerator) {
                                    return conv.other_user?.role !== 'reshipper'
                                }
                                return true
                            })
                            .map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${selectedConversation?.id === conv.id ? 'bg-muted' : ''}`}
                                >
                                    <Avatar>
                                        <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                                        <AvatarFallback>{conv.other_user?.full_name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">{conv.other_user?.full_name || 'User'}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {(() => {
                                                    if (!conv.last_message_at) return 'No messages'
                                                    const date = new Date(conv.last_message_at)
                                                    const now = new Date()
                                                    const diffMs = now.getTime() - date.getTime()
                                                    const diffMins = Math.floor(diffMs / 60000)
                                                    const diffHours = Math.floor(diffMs / 3600000)
                                                    const diffDays = Math.floor(diffMs / 86400000)

                                                    if (diffMins < 1) return 'Just now'
                                                    if (diffMins < 60) return `${diffMins}m ago`
                                                    if (diffHours < 24) return `${diffHours}h ago`
                                                    if (diffDays < 7) return `${diffDays}d ago`
                                                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
                                                })()}
                                            </span>
                                        </div>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {conv.last_message || 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Chat Window */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {selectedConversation ? (
                    <>
                        <div className="flex items-center justify-between border-b p-4">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={selectedConversation.other_user?.avatar_url || undefined} />
                                    <AvatarFallback>{selectedConversation.other_user?.full_name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{selectedConversation.other_user?.full_name || 'User'}</h3>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {selectedConversation.other_user?.role === 'moderator' ? 'Support Team' : selectedConversation.other_user?.role}
                                    </p>
                                </div>
                            </div>
                            {isCustomer && selectedConversation.other_user?.role === 'reshipper' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setShowProfile(true)}>
                                            View Profile
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUserId
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-muted'}`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`mt-1 text-[10px] ${isMe ? 'text-white/70 dark:text-black/70' : 'text-muted-foreground'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <div className="border-t p-4">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    className="flex-1"
                                    disabled={sending}
                                />
                                <Button type="submit" size="icon" disabled={sending} className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-muted-foreground">
                        {isCustomer ? 'Select a reshipper to start messaging' : 'Select a conversation to start messaging'}
                    </div>
                )}
            </Card>

            {/* Profile Dialog */}
            <Dialog open={showProfile} onOpenChange={setShowProfile}>
                <DialogContent className="max-w-2xl">
                    {selectedConversation?.other_user && selectedConversation.other_user.role === 'reshipper' && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                                        <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                                        <AvatarFallback>{selectedConversation.other_user.full_name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <DialogTitle className="text-2xl flex items-center gap-2">
                                            {selectedConversation.other_user.full_name || 'Reshipper'}
                                            {selectedConversation.other_user.is_verified && (
                                                <CheckCircle2 className="h-5 w-5 text-foreground" />
                                            )}
                                        </DialogTitle>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{selectedConversation.other_user.is_verified ? 'Verified ' : ''}Reshipper</span>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                {selectedConversation.other_user.about && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">About</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedConversation.other_user.about}
                                        </p>
                                    </div>
                                )}

                                {selectedConversation.other_user.about && <Separator />}

                                {(selectedConversation.other_user.address_street || selectedConversation.other_user.address_city) && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Shipping Address
                                        </h4>
                                        <div className="rounded-md bg-muted p-3 text-sm font-mono">
                                            <p>{selectedConversation.other_user.full_name || 'Reshipper'}</p>
                                            {selectedConversation.other_user.address_street && <p>{selectedConversation.other_user.address_street}</p>}
                                            {(selectedConversation.other_user.address_city || selectedConversation.other_user.address_state || selectedConversation.other_user.address_zip) && (
                                                <p>
                                                    {selectedConversation.other_user.address_city}
                                                    {selectedConversation.other_user.address_state && `, ${selectedConversation.other_user.address_state}`}
                                                    {selectedConversation.other_user.address_zip && ` ${selectedConversation.other_user.address_zip}`}
                                                </p>
                                            )}
                                            {selectedConversation.other_user.address_country && <p>{selectedConversation.other_user.address_country}</p>}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full gap-2"
                                            onClick={() => {
                                                const address = [
                                                    selectedConversation.other_user?.full_name,
                                                    selectedConversation.other_user?.address_street,
                                                    `${selectedConversation.other_user?.address_city}${selectedConversation.other_user?.address_state ? ', ' + selectedConversation.other_user?.address_state : ''} ${selectedConversation.other_user?.address_zip || ''}`.trim(),
                                                    selectedConversation.other_user?.address_country
                                                ].filter(Boolean).join('\n')
                                                navigator.clipboard.writeText(address)
                                            }}
                                        >
                                            <Copy className="h-3 w-3" /> Copy Address
                                        </Button>
                                    </div>
                                )}

                                {((selectedConversation.other_user.allowed_sites && selectedConversation.other_user.allowed_sites.length > 0) ||
                                    (selectedConversation.other_user.banned_items && selectedConversation.other_user.banned_items.length > 0)) && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedConversation.other_user.allowed_sites && selectedConversation.other_user.allowed_sites.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none flex items-center gap-2 text-foreground">
                                                        <Check className="h-4 w-4" /> Allowed Sites
                                                    </h4>
                                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                        {selectedConversation.other_user.allowed_sites.map((site) => (
                                                            <li key={site}>{site}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {selectedConversation.other_user.banned_items && selectedConversation.other_user.banned_items.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none flex items-center gap-2 text-destructive">
                                                        <Ban className="h-4 w-4" /> Banned Items
                                                    </h4>
                                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                        {selectedConversation.other_user.banned_items.map((item) => (
                                                            <li key={item}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
