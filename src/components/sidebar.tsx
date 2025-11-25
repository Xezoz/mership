'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUserRole } from '@/hooks/use-user-role'
import {
    LayoutDashboard,
    Package,
    MessageSquare,
    CreditCard,
    Truck,
    Users,
    Menu,
    X
} from 'lucide-react'
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

    const NavLinks = () => (
        <>
            {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-secondary text-secondary-foreground'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                    </Link>
                )
            })}
        </>
    )

    if (loading) return <div className="hidden md:block w-64 bg-card border-r" />

    return (
        <>
            {/* Mobile Header with Menu Button */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Package className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-semibold">Mership</span>
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
                            <div className="flex h-16 items-center gap-2 border-b px-6">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                    <Package className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <span className="text-lg font-semibold">Mership</span>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 space-y-1 px-3 py-4">
                                <div className="space-y-1">
                                    <NavLinks />
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
                <div className="flex h-16 items-center gap-2 border-b px-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Package className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-semibold">Mership</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    <div className="space-y-1">
                        <NavLinks />
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
