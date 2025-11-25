'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NotificationsPopover } from '@/components/notifications-popover'

export function Header() {
    return (
        <header className="hidden md:flex h-16 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center gap-4 flex-1">
                <h1 className="text-xl font-semibold">Documents</h1>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full pl-9"
                    />
                </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-3 flex-1 justify-end">
                <NotificationsPopover />
            </div>
        </header>
    )
}
