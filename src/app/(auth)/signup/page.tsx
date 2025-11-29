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

const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    })

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                setError(error.message)
                return
            }

            setSuccess(true)
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                                <Package className="h-7 w-7 text-primary-foreground" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                        <CardDescription>
                            We've sent you a confirmation link. Please check your email to verify your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/login')} className="w-full">
                            Back to login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
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
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-white">
                                <Package className="h-6 w-6 text-black" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-light tracking-widest">MERSHIP</h1>
                                <p className="text-[10px] text-zinc-500 tracking-widest">GLOBAL RESHIPPING PLATFORM</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="text-xs text-zinc-500 tracking-widest font-mono">PLATFORM // ONBOARDING</div>
                            <h2 className="text-4xl font-light leading-tight tracking-tight">
                                Join the Network
                                <span className="block font-normal">of Global Reshipping</span>
                            </h2>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed font-light">
                            Access enterprise-grade reshipping infrastructure.
                            Send packages across borders with advanced security and precision.
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

            {/* Right side - Signup Form */}
            <div className="flex-1 flex items-center justify-center bg-black p-4">
                <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4 lg:hidden">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                                <Package className="h-7 w-7 text-primary-foreground" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                        <CardDescription>
                            Enter your details to get started
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
                                <Label htmlFor="password">Password</Label>
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

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('confirmPassword')}
                                    disabled={isLoading}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Creating account...' : 'Create account'}
                            </Button>

                            <div className="text-center text-sm">
                                Already have an account?{' '}
                                <Link href="/login" className="text-primary hover:underline font-medium">
                                    Sign in
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
