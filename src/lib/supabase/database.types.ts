export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            messages: {
                Row: {
                    content: string
                    created_at: string
                    id: string
                    read: boolean
                    recipient_id: string
                    sender_id: string
                }
                Insert: {
                    content: string
                    created_at?: string
                    id?: string
                    read?: boolean
                    recipient_id: string
                    sender_id: string
                }
                Update: {
                    content?: string
                    created_at?: string
                    id?: string
                    read?: boolean
                    recipient_id?: string
                    sender_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_recipient_id_fkey"
                        columns: ["recipient_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    created_at: string
                    id: string
                    message: string
                    read: boolean
                    type: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    message: string
                    read?: boolean
                    type: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    message?: string
                    read?: boolean
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    about: string | null
                    address_city: string | null
                    address_country: string | null
                    address_state: string | null
                    address_street: string | null
                    address_zip: string | null
                    allowed_sites: string[] | null
                    avatar_url: string | null
                    balance: number
                    banned_items: string[] | null
                    created_at: string
                    email: string | null
                    full_name: string | null
                    id: string
                    is_verified: boolean | null
                    membership_tier: string | null
                    role: Database["public"]["Enums"]["user_role"]
                }
                Insert: {
                    about?: string | null
                    address_city?: string | null
                    address_country?: string | null
                    address_state?: string | null
                    address_street?: string | null
                    address_zip?: string | null
                    allowed_sites?: string[] | null
                    avatar_url?: string | null
                    balance?: number
                    banned_items?: string[] | null
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    id: string
                    is_verified?: boolean | null
                    membership_tier?: string | null
                    role?: Database["public"]["Enums"]["user_role"]
                }
                Update: {
                    about?: string | null
                    address_city?: string | null
                    address_country?: string | null
                    address_state?: string | null
                    address_street?: string | null
                    address_zip?: string | null
                    allowed_sites?: string[] | null
                    avatar_url?: string | null
                    balance?: number
                    banned_items?: string[] | null
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    is_verified?: boolean | null
                    membership_tier?: string | null
                    role?: Database["public"]["Enums"]["user_role"]
                }
                Relationships: []
            }
            shipments: {
                Row: {
                    created_at: string
                    customer_action: string | null
                    delivery_address: string | null
                    destination: string | null
                    id: string
                    item_description: string | null
                    origin: string | null
                    product_name: string | null
                    product_value: number | null
                    recipient_id: string | null
                    sender_id: string
                    shipping_carrier: string | null
                    shipping_label_url: string | null
                    status: string
                    tracking_number: string
                    updated_at: string
                    weight: number | null
                }
                Insert: {
                    created_at?: string
                    customer_action?: string | null
                    delivery_address?: string | null
                    destination?: string | null
                    id?: string
                    item_description?: string | null
                    origin?: string | null
                    product_name?: string | null
                    product_value?: number | null
                    recipient_id?: string | null
                    sender_id: string
                    shipping_carrier?: string | null
                    shipping_label_url?: string | null
                    status?: string
                    tracking_number: string
                    updated_at?: string
                    weight?: number | null
                }
                Update: {
                    created_at?: string
                    customer_action?: string | null
                    delivery_address?: string | null
                    destination?: string | null
                    id?: string
                    item_description?: string | null
                    origin?: string | null
                    product_name?: string | null
                    product_value?: number | null
                    recipient_id?: string | null
                    sender_id?: string
                    shipping_carrier?: string | null
                    shipping_label_url?: string | null
                    status?: string
                    tracking_number?: string
                    updated_at?: string
                    weight?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "shipments_recipient_id_fkey"
                        columns: ["recipient_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "shipments_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            transactions: {
                Row: {
                    amount: number
                    created_at: string
                    description: string | null
                    id: string
                    status: string
                    type: string
                    user_id: string
                }
                Insert: {
                    amount: number
                    created_at?: string
                    description?: string | null
                    id?: string
                    status?: string
                    type: string
                    user_id: string
                }
                Update: {
                    amount?: number
                    created_at?: string
                    description?: string | null
                    id?: string
                    status?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: "customer" | "reshipper" | "moderator"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never