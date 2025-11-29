'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUserRole } from '@/hooks/use-user-role'
import { Menu, Package, MessageSquare, CreditCard, Truck, Users, LayoutDashboard } from 'lucide-react'
import { SidebarUserFooter } from '@/components/sidebar-user-footer'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export function Sidebar() {
    const pathname = usePathname()
    const { isCustomer, loading } = useUserRole()
    const [mobileOpen, setMobileOpen] = useState(false)

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Inbox', href: '/inbox', icon: MessageSquare },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Shipments', href: '/shipments', icon: Truck },
        ...(isCustomer ? [{ name: 'Reshippers', href: '/reshippers', icon: Users }] : []),
    ]



    if (loading) return <div className="hidden md:block w-64 bg-card border-r" />

    return (
        <>
            {/* Mobile Header with Menu Button */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white/5 bg-black px-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-white">
                        <Package className="h-5 w-5 text-black" />
                    </div>
                    <div>
                        <span className="text-sm font-light tracking-widest">MERSHIP</span>
                    </div>
                </div>
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <VisuallyHidden>
                            <SheetTitle>Navigation Menu</SheetTitle>
                            <SheetDescription>Main navigation menu for the application</SheetDescription>
                        </VisuallyHidden>
                        <div className="flex h-full flex-col">
                            {/* Logo */}
                            <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-white">
                                    <Package className="h-5 w-5 text-black" />
                                </div>
                                <div>
                                    <div className="text-sm font-light tracking-widest">MERSHIP</div>
                                    <div className="text-[9px] text-zinc-500 tracking-widest">RESHIPPING</div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 space-y-1 px-3 py-4">
                                <div className="space-y-1">
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={cn(
                                                    'flex items-center gap-3 rounded px-3 py-2 text-xs font-light transition-colors',
                                                    isActive
                                                        ? 'bg-white/5 text-white'
                                                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                {item.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </nav>

                            {/* User Footer */}
                            <div className="border-t p-4">
                                <SidebarUserFooter />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-64 flex-col bg-card border-r">
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-white">
                        <Package className="h-5 w-5 text-black" />
                    </div>
                    <div>
                        <div className="text-sm font-light tracking-widest">MERSHIP</div>
                        <div className="text-[9px] text-zinc-500 tracking-widest">RESHIPPING</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded px-3 py-2 text-xs font-light transition-colors',
                                        isActive
                                            ? 'bg-white/5 text-white'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                {/* User Footer */}
                <div className="border-t p-4">
                    <SidebarUserFooter />
                </div>
            </div>
        </>
    )
}
