'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getItemsWithInventory } from '@/actions/inventory';
import { InventoryItem } from './InventoryItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ItemWithInventory } from '@/data/inventory.type';
import { Search, SlidersHorizontal, RefreshCw, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export default function InventoryPanel() {
    const [items, setItems] = useState<ItemWithInventory[]>([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // No items available message
    const NoItems = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
            <div className="bg-gray-100 rounded-full p-6 mb-6">
                <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items available</h3>
            <p className="text-gray-500 max-w-md mb-6">
                {search
                    ? "We couldn't find any items matching your search. Try adjusting your filters or search terms."
                    : 'There are currently no items in the inventory. Check back later for updates.'}
            </p>
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
            </Button>
        </motion.div>
    );

    const loadItems = useCallback(
        async (reset = false) => {
            try {
                setIsLoading(true);
                const response = await getItemsWithInventory({
                    page: reset ? 1 : page,
                    search,
                    sortBy,
                    sortDirection,
                    status: 'active',
                });

                if (response.success && Array.isArray(response.data)) {
                    setItems((prev) =>
                        reset
                            ? (response.data as ItemWithInventory[])
                            : [...prev, ...(response.data as ItemWithInventory[])]
                    );
                    setHasMore(response.hasMore);
                    if (reset) setPage(1);
                }
            } catch (error) {
                console.error('Error loading items:', error);
                toast.error('Failed to load inventory items. Please try again.');
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [page, search, sortBy, sortDirection]
    );

    useEffect(() => {
        loadItems(true);
    }, [search, sortBy, sortDirection]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setItems([]); // Clear existing items to show skeleton
        loadItems(true);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-screen">
            <Card className="m-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">Borrow your item</CardTitle>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                            <Input
                                placeholder="Search available items..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 rounded-full border-2"
                            />
                        </div>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline">
                                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                                    Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Sort Options</SheetTitle>
                                </SheetHeader>
                                <div className="space-y-4 pt-4">
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name">Name</SelectItem>
                                            <SelectItem value="quantity">Availability</SelectItem>
                                            <SelectItem value="date">Date Added</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
                                        className="w-full"
                                    >
                                        Sort {sortDirection === 'asc' ? 'A to Z' : 'Z to A'}
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </motion.div>

                    <Separator className="my-6" />

                    <AnimatePresence mode="wait">
                        {(isLoading && items.length === 0) || isRefreshing ? (
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                            >
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                                ))}
                            </motion.div>
                        ) : items.length === 0 ? (
                            <NoItems />
                        ) : (
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                            >
                                {items.map((item) => (
                                    <motion.div
                                        key={item.$id}
                                        variants={fadeIn}
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <InventoryItem item={item} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {hasMore && (
                        <motion.div
                            className="mt-8 flex justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={isLoading || isRefreshing}
                                variant="outline"
                                size="lg"
                                className="min-w-[200px] rounded-full hover:shadow-lg transition-shadow"
                            >
                                {isLoading ? 'Loading...' : 'Load More Items'}
                            </Button>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
