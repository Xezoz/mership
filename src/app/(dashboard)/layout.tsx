import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden pt-16 md:pt-0">
                <Header />
                <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    )
}
