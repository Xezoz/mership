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
            {/* Left side - Futuristic Reshipping Design */}
            <div className="hidden lg:flex lg:w-1/2 bg-black p-12 items-center justify-center relative overflow-hidden">
                {/* Animated grid background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
                </div>

                {/* Geometric shipping route accents */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-20 right-20 w-64 h-64 border border-white/10 rotate-45" />
                <div className="absolute bottom-20 left-20 w-48 h-48 border border-white/5 rotate-12" />

                <div className="relative z-10 text-white space-y-8 max-w-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white border-2 border-white/20 shadow-lg shadow-white/10">
                            <Package className="h-8 w-8 text-black" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Mership</h1>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-5xl font-bold leading-tight tracking-tight">
                            Global Shipping,
                            <span className="block bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                Simplified
                            </span>
                        </h2>
                        <p className="text-lg text-zinc-400 leading-relaxed">
                            Your packages, reshipped worldwide. Connect with trusted reshippers and manage international deliveries effortlessly.
                        </p>
                    </div>

                    {/* Feature highlights */}
                    <div className="space-y-3 pt-4">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            <span className="text-zinc-300">International package forwarding</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            <span className="text-zinc-300">Trusted reshipper network</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            <span className="text-zinc-300">Real-time tracking & updates</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-background p-4">
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
