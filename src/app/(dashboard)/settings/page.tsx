'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const supabase = createBrowserClient()
    const { role, isReshipper } = useUserRole()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        about: '',
        address_street: '',
        address_city: '',
        address_state: '',
        address_zip: '',
        address_country: '',
        allowed_sites: [] as string[],
        banned_items: [] as string[],
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const [newAllowedSite, setNewAllowedSite] = useState('')
    const [newBannedItem, setNewBannedItem] = useState('')

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (error) throw error

                if (data) {
                    setProfile({
                        full_name: data.full_name || '',
                        email: data.email || '',
                        about: data.about || '',
                        address_street: data.address_street || '',
                        address_city: data.address_city || '',
                        address_state: data.address_state || '',
                        address_zip: data.address_zip || '',
                        address_country: data.address_country || '',
                        allowed_sites: data.allowed_sites || [],
                        banned_items: data.banned_items || [],
                    })
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [supabase, router])

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    about: profile.about,
                    address_street: profile.address_street,
                    address_city: profile.address_city,
                    address_state: profile.address_state,
                    address_zip: profile.address_zip,
                    address_country: profile.address_country,
                    allowed_sites: profile.allowed_sites,
                    banned_items: profile.banned_items,
                })
                .eq('id', user.id)

            if (error) throw error

            alert('Profile updated successfully!')
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const addAllowedSite = () => {
        if (newAllowedSite.trim() && !profile.allowed_sites.includes(newAllowedSite.trim())) {
            setProfile({ ...profile, allowed_sites: [...profile.allowed_sites, newAllowedSite.trim()] })
            setNewAllowedSite('')
        }
    }

    const removeAllowedSite = (site: string) => {
        setProfile({ ...profile, allowed_sites: profile.allowed_sites.filter(s => s !== site) })
    }

    const addBannedItem = () => {
        if (newBannedItem.trim() && !profile.banned_items.includes(newBannedItem.trim())) {
            setProfile({ ...profile, banned_items: [...profile.banned_items, newBannedItem.trim()] })
            setNewBannedItem('')
        }
    }

    const removeBannedItem = (item: string) => {
        setProfile({ ...profile, banned_items: profile.banned_items.filter(i => i !== item) })
    }

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match')
            return
        }

        if (passwordData.newPassword.length < 6) {
            alert('Password must be at least 6 characters')
            return
        }

        setChangingPassword(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            })

            if (error) throw error

            alert('Password updated successfully!')
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error) {
            console.error('Error updating password:', error)
            alert('Failed to update password')
        } finally {
            setChangingPassword(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and profile</p>
            </div>

            <div className="grid gap-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                value={profile.full_name}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={profile.email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                        {isReshipper && (
                            <div className="space-y-2">
                                <Label htmlFor="about">About</Label>
                                <Textarea
                                    id="about"
                                    value={profile.about}
                                    onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                                    placeholder="Tell customers about your reshipper service..."
                                    rows={4}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Address</CardTitle>
                        <CardDescription>
                            {isReshipper
                                ? 'Your address where customers will ship their packages'
                                : 'Your address where we will forward your packages to'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address_street">Street Address</Label>
                            <Input
                                id="address_street"
                                value={profile.address_street}
                                onChange={(e) => setProfile({ ...profile, address_street: e.target.value })}
                                placeholder="123 Main Street"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="address_city">City</Label>
                                <Input
                                    id="address_city"
                                    value={profile.address_city}
                                    onChange={(e) => setProfile({ ...profile, address_city: e.target.value })}
                                    placeholder="New York"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address_state">State/Province</Label>
                                <Input
                                    id="address_state"
                                    value={profile.address_state}
                                    onChange={(e) => setProfile({ ...profile, address_state: e.target.value })}
                                    placeholder="NY"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="address_zip">ZIP/Postal Code</Label>
                                <Input
                                    id="address_zip"
                                    value={profile.address_zip}
                                    onChange={(e) => setProfile({ ...profile, address_zip: e.target.value })}
                                    placeholder="10001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address_country">Country</Label>
                                <Input
                                    id="address_country"
                                    value={profile.address_country}
                                    onChange={(e) => setProfile({ ...profile, address_country: e.target.value })}
                                    placeholder="United States"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Update your password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new_password">New Password</Label>
                            <Input
                                id="new_password"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirm New Password</Label>
                            <Input
                                id="confirm_password"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                placeholder="Confirm new password"
                            />
                        </div>
                        <Button
                            onClick={handlePasswordChange}
                            disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                            variant="outline"
                            className="w-full"
                        >
                            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Change Password
                        </Button>
                    </CardContent>
                </Card>

                {/* Reshipper-specific fields */}
                {isReshipper && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Allowed Sites</CardTitle>
                                <CardDescription>Shopping sites you accept packages from</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={newAllowedSite}
                                        onChange={(e) => setNewAllowedSite(e.target.value)}
                                        placeholder="e.g., Amazon, eBay"
                                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addAllowedSite()}
                                    />
                                    <Button onClick={addAllowedSite} variant="outline">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.allowed_sites.map((site) => (
                                        <Badge key={site} variant="secondary" className="gap-1">
                                            {site}
                                            <X
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() => removeAllowedSite(site)}
                                            />
                                        </Badge>
                                    ))}
                                    {profile.allowed_sites.length === 0 && (
                                        <p className="text-sm text-muted-foreground">No allowed sites added yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Banned Items</CardTitle>
                                <CardDescription>Items you do not accept for shipping</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={newBannedItem}
                                        onChange={(e) => setNewBannedItem(e.target.value)}
                                        placeholder="e.g., Weapons, Hazardous materials"
                                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addBannedItem()}
                                    />
                                    <Button onClick={addBannedItem} variant="outline">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.banned_items.map((item) => (
                                        <Badge key={item} variant="destructive" className="gap-1">
                                            {item}
                                            <X
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() => removeBannedItem(item)}
                                            />
                                        </Badge>
                                    ))}
                                    {profile.banned_items.length === 0 && (
                                        <p className="text-sm text-muted-foreground">No banned items added yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                <div className="flex justify-between items-center pt-6 border-t">
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            await supabase.auth.signOut()
                            router.push('/login')
                        }}
                    >
                        Sign Out
                    </Button>

                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
