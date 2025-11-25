export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    role: 'customer' | 'reshipper'
                    about: string | null
                    address_street: string | null
                    address_city: string | null
                    address_state: string | null
                    address_zip: string | null
                    address_country: string | null
                    allowed_sites: string[] | null
                    banned_items: string[] | null
                    is_verified: boolean
                    rating: number
                    review_count: number
                    total_shipments: number
                    balance: number
                    created_at: string
                    updated_at: string
                    membership_tier: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'customer' | 'reshipper'
                    about?: string | null
                    address_street?: string | null
                    address_city?: string | null
                    address_state?: string | null
                    address_zip?: string | null
                    address_country?: string | null
                    allowed_sites?: string[] | null
                    banned_items?: string[] | null
                    is_verified?: boolean
                    rating?: number
                    review_count?: number
                    total_shipments?: number
                    balance?: number
                    membership_tier?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'customer' | 'reshipper'
                    about?: string | null
                    address_street?: string | null
                    address_city?: string | null
                    address_state?: string | null
                    address_zip?: string | null
                    address_country?: string | null
                    allowed_sites?: string[] | null
                    banned_items?: string[] | null
                    is_verified?: boolean
                    rating?: number
                    review_count?: number
                    total_shipments?: number
                    balance?: number
                    membership_tier?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            inventory: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    sku: string
                    quantity: number
                    price: number
                    category: string | null
                    status: 'in_stock' | 'low_stock' | 'out_of_stock'
                    image_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    sku: string
                    quantity: number
                    price: number
                    category?: string | null
                    status?: 'in_stock' | 'low_stock' | 'out_of_stock'
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    sku?: string
                    quantity?: number
                    price?: number
                    category?: string | null
                    status?: 'in_stock' | 'low_stock' | 'out_of_stock'
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            packages: {
                Row: {
                    id: string
                    user_id: string
                    tracking_id: string
                    sender: string | null
                    arrived_at: string
                    weight: string | null
                    dimensions: string | null
                    status: 'received' | 'processing' | 'ready_to_ship' | 'shipped'
                    has_photos: boolean
                    image_urls: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    tracking_id: string
                    sender?: string | null
                    arrived_at?: string
                    weight?: string | null
                    dimensions?: string | null
                    status?: 'received' | 'processing' | 'ready_to_ship' | 'shipped'
                    has_photos?: boolean
                    image_urls?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    tracking_id?: string
                    sender?: string | null
                    arrived_at?: string
                    weight?: string | null
                    dimensions?: string | null
                    status?: 'received' | 'processing' | 'ready_to_ship' | 'shipped'
                    has_photos?: boolean
                    image_urls?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            shipments: {
                Row: {
                    id: string
                    sender_id: string
                    recipient_id: string
                    tracking_number: string
                    status: 'pending' | 'received' | 'in_transit' | 'delivered' | 'cancelled' | 'returned' | 'discarded'
                    customer_action: 'ship' | 'return' | 'discard' | null
                    handling_fee: number
                    action_taken_at: string | null
                    origin: string
                    destination: string
                    weight: number
                    cost: number
                    product_name: string | null
                    product_description: string | null
                    product_value: number | null
                    notes: string | null
                    shipping_label_url: string | null
                    shipping_carrier: string | null
                    shipping_service: string | null
                    shipping_instructions: string | null
                    outbound_tracking_number: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    sender_id: string
                    recipient_id: string
                    tracking_number: string
                    status?: 'pending' | 'received' | 'in_transit' | 'delivered' | 'cancelled' | 'returned' | 'discarded'
                    customer_action?: 'ship' | 'return' | 'discard' | null
                    handling_fee?: number
                    action_taken_at?: string | null
                    origin: string
                    destination: string
                    weight?: number
                    cost?: number
                    product_name?: string | null
                    product_description?: string | null
                    product_value?: number | null
                    notes?: string | null
                    shipping_label_url?: string | null
                    shipping_carrier?: string | null
                    shipping_service?: string | null
                    shipping_instructions?: string | null
                    outbound_tracking_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    sender_id?: string
                    recipient_id?: string
                    tracking_number?: string
                    status?: 'pending' | 'received' | 'in_transit' | 'delivered' | 'cancelled' | 'returned' | 'discarded'
                    customer_action?: 'ship' | 'return' | 'discard' | null
                    handling_fee?: number
                    action_taken_at?: string | null
                    origin?: string
                    destination?: string
                    weight?: number
                    cost?: number
                    product_name?: string | null
                    product_description?: string | null
                    product_value?: number | null
                    notes?: string | null
                    shipping_label_url?: string | null
                    shipping_carrier?: string | null
                    shipping_service?: string | null
                    shipping_instructions?: string | null
                    outbound_tracking_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: 'package_assigned' | 'status_updated' | 'message_received' | 'payment_received'
                    title: string
                    message: string
                    read: boolean
                    related_shipment_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'package_assigned' | 'status_updated' | 'message_received' | 'payment_received'
                    title: string
                    message: string
                    read?: boolean
                    related_shipment_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'package_assigned' | 'status_updated' | 'message_received' | 'payment_received'
                    title?: string
                    message?: string
                    read?: boolean
                    related_shipment_id?: string | null
                    created_at?: string
                }
            }
            conversations: {
                Row: {
                    id: string
                    customer_id: string
                    reshipper_id: string
                    last_message: string | null
                    last_message_at: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    customer_id: string
                    reshipper_id: string
                    last_message?: string | null
                    last_message_at?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    customer_id?: string
                    reshipper_id?: string
                    last_message?: string | null
                    last_message_at?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string
                    type: 'deposit' | 'withdrawal' | 'payment' | 'refund'
                    amount: number
                    status: 'pending' | 'completed' | 'failed' | 'cancelled'
                    payment_method: string | null
                    payment_id: string | null
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'deposit' | 'withdrawal' | 'payment' | 'refund'
                    amount: number
                    status?: 'pending' | 'completed' | 'failed' | 'cancelled'
                    payment_method?: string | null
                    payment_id?: string | null
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'deposit' | 'withdrawal' | 'payment' | 'refund'
                    amount?: number
                    status?: 'pending' | 'completed' | 'failed' | 'cancelled'
                    payment_method?: string | null
                    payment_id?: string | null
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: 'customer' | 'reshipper'
        }
    }
}
