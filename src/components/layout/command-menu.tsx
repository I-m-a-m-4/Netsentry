'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Home, Package, ShoppingCart, Users, LifeBuoy, CreditCard, Settings, FileText, Bot } from 'lucide-react';
import { useAcademy } from '@/context/academy-context';

interface CommandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'vendor_operator', 'owner'] },
    { href: '/syllabus-tracker', label: 'Syllabus Tracker', icon: Package, roles: ['admin', 'manager', 'vendor_operator', 'owner'] },
    { href: '/cbt-simulator/select-subjects', label: 'CBT Exam Simulator', icon: ShoppingCart, roles: ['admin', 'manager', 'vendor_operator', 'owner'] },
    { href: '/student-profile', label: 'Student Profile', icon: Users, roles: ['admin', 'owner'] },
    { href: '/peers-mentors', label: 'Peers & Mentors', icon: Users, roles: ['admin', 'manager', 'vendor_operator', 'owner'] },
    { href: '/admission-calculator', label: 'Admission Calculator', icon: FileText, roles: ['admin', 'manager', 'owner'] },
    { href: '/syllabus-tracker/troubleshoot', label: 'AI Troubleshoot', icon: Bot, roles: ['admin', 'manager', 'owner'] },
    { href: '/billing', label: 'Billing', icon: CreditCard, roles: ['admin', 'owner'] },
    { href: '/settings', label: 'Portal Settings', icon: Settings, roles: ['admin', 'owner'] },
];


export default function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
    const router = useRouter();
    const { subjects, currentUserProfile } = useAcademy();
    const userRole = currentUserProfile?.role;

    const runCommand = React.useCallback((command: () => unknown) => {
        onOpenChange(false);
        command();
    }, [onOpenChange]);

    const visibleNavLinks = React.useMemo(() => {
        if (!userRole) return [];
        return navLinks.filter(link => link.roles.includes(userRole));
    }, [userRole]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Navigation">
                    {visibleNavLinks.map(link => (
                        <CommandItem key={link.href} value={link.label} onSelect={() => runCommand(() => router.push(link.href))}>
                           <link.icon className="mr-2 h-4 w-4" />
                           <span>{link.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
                {subjects && subjects.length > 0 && (
                    <>
                    <CommandSeparator />
                    <CommandGroup heading="Products">
                        {subjects.slice(0, 5).map(product => (
                            <CommandItem key={product.id} value={product.name} onSelect={() => runCommand(() => router.push(`/syllabus-tracker/details?id=${product.id}`))}>
                                <Package className="mr-2 h-4 w-4" />
                                <span>{product.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
