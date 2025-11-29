'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NotificationsPopover } from '@/components/notifications-popover'
import { ModeToggle } from '@/components/mode-toggle'

export function Header() {
    return (
        <header className="hidden md:flex h-16 items-center justify-between border-b border-white/5 bg-black px-6">
            <div className="flex items-center gap-4 flex-1">
                {/* Title removed as requested */}
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full pl-9 bg-white/5 border-white/10 text-sm font-light"
                    />
                </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-3 flex-1 justify-end">
                <ModeToggle />
                <NotificationsPopover />
            </div>
        </header>
    )
}
