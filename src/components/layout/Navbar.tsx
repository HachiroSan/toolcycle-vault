'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, User, Shield, Menu, Hexagon, Package, ChevronDown, ClipboardCopy } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
    name: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
}

const validPaths = [
    '/',
    '/return',
    '/inventory',
    '/profile',
    '/cart',
    '/admin/manage-inventory',
    '/admin/manage-admins',
];

export default function Navbar() {
    const pathname = usePathname();
    const { state: cartState } = useCart();
    const [cartItemCount, setCartItemCount] = useState(0);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        setCartItemCount(cartState.items.length);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [cartState.items]);

    // Move conditional return after hooks
    const isInvalidPath = !validPaths.includes(pathname) || pathname.startsWith('/return/');
    if (isInvalidPath) {
        return null;
    }

    const isAdmin = true;

    const navItems = [
        // { name: 'Dashboard', href: '/', icon: Layout },
        { name: 'Return', href: '/return', icon: ClipboardCopy },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    const adminItems = [
        { name: 'Manage Inventory', href: '/admin/manage-inventory' },
        { name: 'Manage Admin', href: '/admin/manage-admins' },
    ];

    const NavLink = ({ item, className = '' }: { item: NavItem; className?: string }) => (
        <Link href={item.href} className={`group ${className}`}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-all duration-200">
                {item.icon && (
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <span className="font-medium text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    {item.name}
                </span>
            </div>
        </Link>
    );

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled ? 'bg-background/95 backdrop-blur-md shadow-sm' : 'bg-background'
                }`}
            >
                <div className="h-1 w-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
                <nav className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Hexagon className="h-7 w-7 text-primary transition-all duration-500 group-hover:rotate-180" />
                            {/* <span className="tracking-widest font-custom text-xl from-primary via-primary/80 to-primary/60 bg-clip-text ">
                                TOOLCYCLE VAULT
                            </span> */}
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-2">
                            {navItems.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}

                            {isAdmin && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="gap-2 ml-2 neon-button">
                                            <Shield className="h-4 w-4" />
                                            <span className="text-sm">Admin</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                            Admin Controls
                                        </div>
                                        <DropdownMenuSeparator />
                                        {adminItems.map((item) => (
                                            <DropdownMenuItem key={item.name} asChild>
                                                <Link href={item.href} className="w-full">
                                                    {item.name}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {/* Mobile Navigation */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-6 w-6" />
                                    <VisuallyHidden.Root>Open Menu</VisuallyHidden.Root>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72">
                                <SheetHeader>
                                    <SheetTitle className="text-left">Menu</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-2 pt-6">
                                    {navItems.map((item) => (
                                        <NavLink key={item.name} item={item} className="w-full" />
                                    ))}

                                    {isAdmin && (
                                        <>
                                            <div className="h-px bg-border my-4" />
                                            <div className="px-3 py-2">
                                                <span className="text-sm font-semibold text-muted-foreground">
                                                    Admin Controls
                                                </span>
                                            </div>
                                            {adminItems.map((item) => (
                                                <NavLink
                                                    key={item.name}
                                                    item={{ ...item, icon: Shield }}
                                                    className="w-full"
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </nav>
            </header>

            {/* Sticky Cart Bubble */}
            <AnimatePresence>
                {cartItemCount > 0 && (
                    <Link
                        href="/cart"
                        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8
                            z-50 flex items-center gap-2
                            bg-background/95 backdrop-blur-sm
                            shadow-lg hover:shadow-xl
                            rounded-full
                            p-3 sm:p-4
                            transition-all duration-200 ease-in-out
                            hover:scale-105
                            border border-border/50
                            group"
                        aria-label={`View cart with ${cartItemCount} items`}
                    >
                        <div className="relative flex items-center">
                            <ShoppingCart
                                className="h-6 w-6 sm:h-5 sm:w-5 
                                group-hover:text-primary transition-colors"
                            />
                            <AnimatePresence mode="wait">
                                {cartItemCount > 0 && (
                                    <motion.div
                                        key={cartItemCount}
                                        initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                            y: -10,
                                            transition: {
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 20,
                                                mass: 0.8,
                                                duration: 0.2,
                                            },
                                        }}
                                        exit={{
                                            scale: 0.8,
                                            opacity: 0,
                                            y: -10,
                                            transition: {
                                                duration: 0.2,
                                            },
                                        }}
                                    >
                                        <Badge
                                            variant="secondary"
                                            className="absolute 
                                                -top-1.5 -right-1.5 sm:-top-2 sm:-right-2
                                                h-5 sm:h-4 min-w-5 sm:min-w-4 
                                                p-px
                                                flex items-center justify-center 
                                                bg-primary text-primary-foreground 
                                                text-xs font-semibold rounded-full
                                                ring-2 ring-background"
                                        >
                                            <motion.span
                                                key={cartItemCount}
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    transition: {
                                                        duration: 0.2,
                                                        delay: 0.1,
                                                    },
                                                }}
                                            >
                                                {cartItemCount}
                                            </motion.span>
                                        </Badge>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <motion.span
                            className="text-sm font-medium hidden sm:inline-block
                                group-hover:text-primary transition-colors"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            Cart
                        </motion.span>
                        <span className="sr-only">View Cart</span>
                    </Link>
                )}
            </AnimatePresence>
        </>
    );
}
