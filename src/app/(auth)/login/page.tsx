'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })

            if (error) {
                setError(error.message)
                return
            }

            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* Left side - Palantir-inspired Design */}
            <div className="hidden lg:flex lg:w-1/2 bg-black p-12 items-center justify-center relative overflow-hidden">
                {/* Network grid background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem]" />
                </div>

                {/* Network nodes and connections */}
                <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <line x1="20%" y1="30%" x2="40%" y2="50%" stroke="white" strokeWidth="0.5" opacity="0.3" />
                    <line x1="40%" y1="50%" x2="60%" y2="40%" stroke="white" strokeWidth="0.5" opacity="0.3" />
                    <line x1="60%" y1="40%" x2="80%" y2="60%" stroke="white" strokeWidth="0.5" opacity="0.3" />
                    <line x1="30%" y1="70%" x2="50%" y2="80%" stroke="white" strokeWidth="0.5" opacity="0.3" />
                    <circle cx="20%" cy="30%" r="3" fill="white" opacity="0.6" />
                    <circle cx="40%" cy="50%" r="4" fill="white" opacity="0.8" />
                    <circle cx="60%" cy="40%" r="3" fill="white" opacity="0.6" />
                    <circle cx="80%" cy="60%" r="3" fill="white" opacity="0.6" />
                    <circle cx="30%" cy="70%" r="3" fill="white" opacity="0.6" />
                    <circle cx="50%" cy="80%" r="3" fill="white" opacity="0.6" />
                </svg>

                <div className="relative z-10 text-white space-y-10 max-w-md">
                    <div className="space-y-2">
                        <div>
                            <h1 className="text-2xl font-light tracking-widest">MERSHIP</h1>
                            <p className="text-[10px] text-zinc-500 tracking-widest">GLOBAL RESHIPPING PLATFORM</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="text-xs text-zinc-500 tracking-widest font-mono">PLATFORM // ACCESS</div>
                            <h2 className="text-4xl font-light leading-tight tracking-tight">
                                Global Package
                                <span className="block font-normal">Forwarding Network</span>
                            </h2>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed font-light">
                            Streamline international package delivery with precision.
                            Connect with verified reshippers across continents through our secure platform.
                        </p>
                    </div>

                    {/* Capabilities */}
                    <div className="space-y-4">
                        <div className="text-xs text-zinc-500 tracking-widest font-mono">CAPABILITIES</div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 text-xs">
                                <div className="mt-1 h-1 w-1 rounded-full bg-white" />
                                <div className="space-y-0.5">
                                    <div className="text-white font-light">Network Orchestration</div>
                                    <div className="text-zinc-500 text-[10px]">Real-time reshipper coordination</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-xs">
                                <div className="mt-1 h-1 w-1 rounded-full bg-white" />
                                <div className="space-y-0.5">
                                    <div className="text-white font-light">Package Intelligence</div>
                                    <div className="text-zinc-500 text-[10px]">Advanced tracking & analytics</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-xs">
                                <div className="mt-1 h-1 w-1 rounded-full bg-white" />
                                <div className="space-y-0.5">
                                    <div className="text-white font-light">Secure Operations</div>
                                    <div className="text-zinc-500 text-[10px]">End-to-end encrypted delivery</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-black p-4">
                <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4 lg:hidden">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                                <Package className="h-7 w-7 text-primary-foreground" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                        <CardDescription>
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    {...register('email')}
                                    disabled={isLoading}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('password')}
                                    disabled={isLoading}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </Button>

                            <div className="text-center text-sm">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-primary hover:underline font-medium">
                                    Sign up
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
