'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import InventoryPanel from '../InventoryPanel';

const InventoryPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto p-6 pt-8">
                <div className="space-y-2.5 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/inventory" className="gap-2">
                                <ChevronLeft className="h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                    </div>
                    <nav className="flex items-center text-sm text-muted-foreground">
                        <span>User</span>
                        <span className="mx-2">/</span>
                        <span>Inventory</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-foreground">All</span>
                    </nav>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                </div>
                <InventoryPanel />
            </div>
        </div>
    );
};

export default InventoryPage;
