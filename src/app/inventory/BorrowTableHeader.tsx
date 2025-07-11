'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { RefreshCw, Search, ShoppingCart, X, Tag } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface BorrowTableHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setPage: (page: number) => void;
    handleRefresh: () => void;
    isRefreshing: boolean;
    onViewCart: () => void;
    currentCategory?: string;
    machineType?: string;
}

export function BorrowTableHeader({
    searchTerm,
    setSearchTerm,
    setPage,
    handleRefresh,
    isRefreshing,
    onViewCart,
    currentCategory,
    machineType,
}: BorrowTableHeaderProps) {
    const [localSearch, setLocalSearch] = useState(searchTerm);
    const debouncedSearch = useDebounce(localSearch, 300);
    const { state } = useCart();
    const router = useRouter();

    useEffect(() => {
        setSearchTerm(debouncedSearch);
        setPage(1);
    }, [debouncedSearch, setSearchTerm, setPage]);

    const handleClearCategory = () => {
        if (machineType) {
            router.push(`/inventory/${machineType}`);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-bold">Borrow your item</h2>
                        {currentCategory && (
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="secondary" className="gap-2">
                                    {currentCategory}
                                    <button
                                        onClick={handleClearCategory}
                                        className="ml-1 hover:bg-destructive/20 rounded-full p-1"
                                        aria-label="Clear category filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    in {machineType} tools
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            aria-label={isRefreshing ? 'Refreshing inventory' : 'Refresh inventory'}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        {state.items.length > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <Button
                                    variant="default"
                                    onClick={onViewCart}
                                    aria-label={`View cart with ${state.items.length} items`}
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Cart ({state.items.length})
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        type="search"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder="Search available items..."
                        className="w-full pl-10 focus:ring-ring"
                        aria-label="Search available items"
                    />
                </div>
            </div>
        </motion.div>
    );
} 