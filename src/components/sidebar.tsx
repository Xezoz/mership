'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUserRole } from '@/hooks/use-user-role'
import { Menu, MessageSquare, CreditCard, Truck, Users, LayoutDashboard } from 'lucide-react'
import { Logo } from '@/components/logo'
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
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
                <span className="font-semibold text-xl">MERSHIP</span>
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
                            <div className="flex h-16 items-center border-b px-6">
                                <span className="font-semibold text-xl">MERSHIP</span>
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
                                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                )}
                                            >
                                                <item.icon className="h-4 w-4" />
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
                <div className="flex h-16 items-center border-b px-6">
                    <Logo />
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
                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
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
