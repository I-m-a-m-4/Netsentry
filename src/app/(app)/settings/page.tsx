'use client';

import * as React from 'react';
import Image from 'next/image';
import PageTitle from '@/components/shared/page-title';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { Briefcase, Loader2, Upload, Palette, Monitor, Smartphone, Tablet, Shield, LogOut, MapPin, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from '@/firebase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useAcademy } from '@/context/academy-context';
import { ThemeSwitcher } from '@/components/settings/theme-switcher';
import { Switch } from '@/components/ui/switch';

function SettingsPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-80" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-6">
                                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-20 w-full" /></div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="aspect-square w-full" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

import { usePWA } from '@/context/pwa-context';
import { Skeleton } from '@/components/ui/skeleton';

function SettingsPageContent() {
    const { academy, currentUserProfile, triggerRefresh, addToQueue, mutateBusiness } = useAcademy();
    const { promptInstall, isInstallable } = usePWA();

    const firestore = useFirestore();
    const { toast } = useToast();

    // General state
    const [isSaving, setIsSaving] = React.useState<Record<string, boolean>>({});

    // Form fields state
    const [businessName, setBusinessName] = React.useState('');
    const [businessAddress, setBusinessAddress] = React.useState('');
    const [businessPhone, setBusinessPhone] = React.useState('');
    const [businessEmail, setBusinessEmail] = React.useState('');
    const [, setLogoFile] = React.useState<File | null>(null);
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
    const [isTauri, setIsTauri] = React.useState(false);

    React.useEffect(() => {
        const checkTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
        setIsTauri(!!checkTauri);
    }, []);

    // Operating Hours state
    const [operatingHoursEnabled, setOperatingHoursEnabled] = React.useState(false);
    const [openTime, setOpenTime] = React.useState('08:00');
    const [closeTime, setCloseTime] = React.useState('18:00');
    const [preventSalesOutsideHours, setPreventSalesOutsideHours] = React.useState(false);

    // Effect to populate form fields when academy data loads
    React.useEffect(() => {
        if (academy?.settings) {
            setBusinessName((academy.name || '').replace(/\s+Business$/i, ''));
            setBusinessAddress(academy.address || '');
            setBusinessPhone(academy.settings?.phone || '');
            setBusinessEmail(academy.settings?.email || '');
            setLogoPreview(academy.settings?.logoUrl || null);

            // Operating Hours
            setOperatingHoursEnabled(academy.settings?.operatingHours?.enabled || false);
            setOpenTime(academy.settings?.operatingHours?.openTime || '08:00');
            setCloseTime(academy.settings?.operatingHours?.closeTime || '18:00');
            setPreventSalesOutsideHours(academy.settings?.operatingHours?.preventSalesOutsideHours || false);
        }
    }, [academy]);

    // Sessions state
    const [sessions, setSessions] = React.useState<any[]>([]);
    const [isRevoking, setIsRevoking] = React.useState<Record<string, boolean>>({});
    const [showAllSessions, setShowAllSessions] = React.useState(false);

    React.useEffect(() => {
        if (!currentUserProfile?.id || !firestore) return;

        const sessionsRef = collection(firestore, 'users', currentUserProfile.id, 'sessions');
        const q = query(sessionsRef, orderBy('lastSeen', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessionsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSessions(sessionsData);
        }, (error) => {
            console.error("Error listening to sessions:", error);
        });

        return () => unsubscribe();
    }, [currentUserProfile?.id, firestore]);

    const handleRevokeSession = async (sessionId: string) => {
        if (!currentUserProfile?.id) return;
        setIsRevoking(prev => ({ ...prev, [sessionId]: true }));
        try {
            const sessionRef = doc(firestore, 'users', currentUserProfile.id, 'sessions', sessionId);
            await updateDoc(sessionRef, { revoked: true });
            toast({
                variant: 'success',
                title: 'Access Revoked',
                description: 'The device has been successfully logged out.'
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Revoke Failed',
                description: 'Could not revoke session access.'
            });
        } finally {
            setIsRevoking(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    const getDeviceIcon = (userAgent: string) => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobi')) return <Smartphone className="h-4 w-4" />;
        if (ua.includes('tablet') || ua.includes('ipad')) return <Tablet className="h-4 w-4" />;
        return <Monitor className="h-4 w-4" />;
    };

    const formatUA = (userAgent: string) => {
        if (userAgent.includes('Windows')) return 'Windows PC';
        if (userAgent.includes('Mac OS')) return 'MacBook / MacOS';
        if (userAgent.includes('iPhone')) return 'iPhone';
        if (userAgent.includes('Android')) return 'Android Device';
        if (userAgent.includes('Linux')) return 'Linux PC';
        return 'Unknown Device';
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processLogoFile(file);
        }
    };

    const handleNativeLogoUpload = async () => {
        try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const { readFile } = await import('@tauri-apps/plugin-fs');
            
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Image',
                    extensions: ['png', 'jpg', 'jpeg', 'webp']
                }]
            });

            if (selected && !Array.isArray(selected)) {
                const fileData = await readFile(selected);
                const fileName = selected.split(/[\\/]/).pop() || 'logo.png';
                const ext = fileName.split('.').pop()?.toLowerCase();
                const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
                
                const blob = new Blob([fileData], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                processLogoFile(file);
            }
        } catch (err) {
            console.error('Native upload failed:', err);
        }
    };

    const processLogoFile = (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Image Too Large', description: 'Please select an image smaller than 2MB.' });
            return;
        }
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSettingsSubmit = async (formName: string, dataToSave: Record<string, any>) => {
        if (!academy?.id || !businessName) return;
        setIsSaving(prev => ({ ...prev, [formName]: true }));

        let finalData = { ...dataToSave };

        try {
            if (isTauri) {
                addToQueue({
                    type: 'update-settings',
                    payload: finalData,
                }, `Update ${formName} settings`);
                
                toast({ 
                  variant: "success", 
                  title: `${formName.charAt(0).toUpperCase() + formName.slice(1)} Settings Queued`, 
                  description: `Settings will be synced when online.` 
                });
            } else {
                const businessDocRef = doc(firestore, 'businessInstances', academy.id);
                await updateDoc(businessDocRef, finalData);
                toast({ variant: "success", title: `${formName.charAt(0).toUpperCase() + formName.slice(1)} Settings Saved`, description: `Your settings have been updated.` });
            }
            
            triggerRefresh();
            if (mutateBusiness) mutateBusiness();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: `Could not save your settings.` });
        } finally {
            setIsSaving(prev => ({ ...prev, [formName]: false }));
        }
    };

    const processedSessions = React.useMemo(() => {
        const groups = new Map<string, any>();

        sessions.forEach(session => {
            const deviceType = formatUA(session.userAgent || 'Unknown');
            const platform = session.deviceInfo?.platform || 'Unknown OS';
            const key = `${deviceType}-${platform}`.toLowerCase();

            const currentSessionIdKey = `zeneva_session_id_${currentUserProfile?.id}`;
            const currentSessionId = typeof window !== 'undefined' ? sessionStorage.getItem(currentSessionIdKey) : null;
            const isCurrent = session.id === currentSessionId;

            if (isCurrent || !groups.has(key)) {
                groups.set(key, session);
            }
        });

        return Array.from(groups.values()).sort((a, b) => {
            const currentSessionIdKey = `zeneva_session_id_${currentUserProfile?.id}`;
            const currentSessionId = typeof window !== 'undefined' ? sessionStorage.getItem(currentSessionIdKey) : null;
            if (a.id === currentSessionId) return -1;
            if (b.id === currentSessionId) return 1;
            return (b.lastSeen?.seconds || 0) - (a.lastSeen?.seconds || 0);
        });
    }, [sessions, currentUserProfile?.id]);

    return (
        <div className="space-y-6">
            <PageTitle title="Portal Settings" subtitle="Configure your Pinnacle Academia preferences." />

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Academy Profile</CardTitle>
                        <CardDescription>Manage your academy's fundamental information and branding.</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className='md:col-span-2 space-y-4'>
                                <div><Label htmlFor="businessName">Academy Name</Label><Input id="businessName" value={businessName} onChange={e => setBusinessName(e.target.value)} /></div>
                                <div><Label htmlFor="businessAddress">Academy Address</Label><Textarea id="businessAddress" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} /></div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div><Label htmlFor="businessPhone">Academy Phone</Label><Input id="businessPhone" type="tel" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} /></div>
                                    <div><Label htmlFor="businessEmail">Academy Email</Label><Input id="businessEmail" type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} /></div>
                                </div>
                            </div>
                            <div>
                                <Label>Academy Logo</Label>
                                <div 
                                    className="mt-1 w-full aspect-square rounded-md border-2 border-dashed flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors"
                                    onClick={() => isTauri && handleNativeLogoUpload()}
                                >
                                    {logoPreview ? <Image src={logoPreview} alt="Logo preview" fill className="object-cover" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                                    {!isTauri && (
                                        <Input id="logo-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoChange} />
                                    )}
                                    {isTauri && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                            <span className="text-white text-xs font-bold">Pick Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="button" onClick={() => handleSettingsSubmit('profile', { name: businessName, address: businessAddress, "settings.phone": businessPhone, "settings.email": businessEmail })} disabled={isSaving["profile"]}>
                            {isSaving["profile"] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Profile
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Security & Devices</CardTitle>
                        <CardDescription>Manage your active login sessions and registered devices.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
                            {processedSessions.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    No active sessions found.
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4">
                                        {(showAllSessions ? processedSessions : processedSessions.slice(0, 3)).map((session) => {
                                            const currentSessionIdKey = `zeneva_session_id_${currentUserProfile?.id}`;
                                            const currentSessionId = typeof window !== 'undefined' ? sessionStorage.getItem(currentSessionIdKey) : null;
                                            const isCurrent = session.id === currentSessionId;

                                            return (
                                                <div key={session.id} className={cn(
                                                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                                                    session.revoked ? "opacity-50 grayscale" : "bg-card",
                                                    isCurrent && "border-primary ring-1 ring-primary/20 shadow-sm"
                                                )}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "p-2 rounded-full",
                                                            isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {getDeviceIcon(session.userAgent || '')}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                 <span className="font-medium">{formatUA(session.userAgent || '')}</span>
                                                                {isCurrent && <Badge variant="default" className="text-[10px] h-4 px-1">This Device</Badge>}
                                                                {session.revoked && <Badge variant="destructive" className="text-[10px] h-4 px-1">Revoked</Badge>}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                                                <span>{session.deviceInfo?.platform || 'Unknown OS'}</span>
                                                                <span className="hidden sm:inline opacity-30">•</span>
                                                                <span>Last active: {session.lastSeen instanceof Timestamp ? formatDistanceToNow(session.lastSeen.toDate(), { addSuffix: true }) : 'Just now'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {!session.revoked && !isCurrent && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-muted-foreground hover:text-destructive"
                                                            disabled={isRevoking[session.id]}
                                                            onClick={() => handleRevokeSession(session.id)}
                                                        >
                                                            {isRevoking[session.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {processedSessions.length > 3 && (
                                        <Button 
                                            variant="outline" 
                                            className="w-full mt-2 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                                            onClick={() => setShowAllSessions(!showAllSessions)}
                                        >
                                            {showAllSessions ? (
                                                <>Show Less</>
                                            ) : (
                                                <>Show More ({processedSessions.length - 3} more)</>
                                            )}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Operating Hours</CardTitle>
                        <CardDescription>Set your academy opening and closing hours to track or prevent sales outside these times.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base text-stone-900">Enable Working Hours Tracking</Label>
                                <p className="text-sm text-muted-foreground">Monitor or restrict sales recorded outside of academy hours.</p>
                            </div>
                            <Switch checked={operatingHoursEnabled} onCheckedChange={setOperatingHoursEnabled} />
                        </div>

                        {operatingHoursEnabled && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="openTime">Opening Time</Label>
                                        <Input
                                            id="openTime"
                                            type="time"
                                            value={openTime}
                                            onChange={e => setOpenTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="closeTime">Closing Time</Label>
                                        <Input
                                            id="closeTime"
                                            type="time"
                                            value={closeTime}
                                            onChange={e => setCloseTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4 bg-orange-50/50 border-orange-100">
                                    <div className="space-y-0.5 pr-8">
                                        <Label className="text-base text-orange-900">Enforce Strict Hours</Label>
                                        <p className="text-sm text-orange-700/70">
                                            If enabled, operators will be blocked from completing sales outside these hours. Otherwise, sales will just be flagged in the logs.
                                        </p>
                                    </div>
                                    <Switch checked={preventSalesOutsideHours} onCheckedChange={setPreventSalesOutsideHours} />
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="button"
                            onClick={() => handleSettingsSubmit('operating-hours', {
                                'settings.operatingHours': {
                                    enabled: operatingHoursEnabled,
                                    openTime,
                                    closeTime,
                                    preventSalesOutsideHours
                                }
                            })}
                            disabled={isSaving["operating-hours"]}
                        >
                            {isSaving["operating-hours"] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Working Hours
                        </Button>
                    </CardFooter>
                </Card>

                {isInstallable && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-primary" />App Installation</CardTitle>
                            <CardDescription>Install Pinnacle Academia on this device for a native experience.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="default" className="w-full" onClick={promptInstall}>
                                <Download className="mr-2 h-4 w-4" />
                                Install App
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="pt-6 mt-6 border-t border-border/10">
                    <Card className="border-border/15 dark:border-border/25 shadow-none hover:shadow-sm transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />Appearance & Theme</CardTitle>
                            <CardDescription>Customize the visual interface of Pinnacle Academia.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ThemeSwitcher />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { isLoading: isPosLoading, academy } = useAcademy();
    if (isPosLoading && !academy) {
        return <SettingsPageSkeleton />;
    }
    return <SettingsPageContent />;
}
