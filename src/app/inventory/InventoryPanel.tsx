'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getItemsWithInventory } from '@/actions/inventory';
import { Button } from '@/components/ui/button';
import { ItemWithInventory } from '@/data/inventory.type';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { BorrowTableHeader } from './BorrowTableHeader';
import { BorrowTableContent } from './BorrowTableContent';
import { BorrowTableFooter } from './BorrowTableFooter';
import { BorrowItemDetailsDialog } from './BorrowItemDetailsDialog';

const ITEMS_PER_PAGE = 10;

interface InventoryResponse {
    success: boolean;
    message?: string;
    data: ItemWithInventory[];
    total: number;
    hasMore: boolean;
}

export default function InventoryPanel({ type }: { type?: string }) {
    const [inventoryData, setInventoryData] = useState<InventoryResponse | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [selectedDetailItem, setSelectedDetailItem] = useState<ItemWithInventory | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category') || '';

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
                    ? "We couldn't find any items matching your search. Try adjusting your search terms."
                    : category
                    ? `There are currently no items in the ${category} category. Check back later for updates.`
                    : 'There are currently no items in the inventory. Check back later for updates.'}
            </p>
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
                Refresh
            </Button>
        </motion.div>
    );

    const loadItems = useCallback(
        async (pageToLoad: number, resetPage = false) => {
            try {
                setIsLoading(true);
                const currentPage = resetPage ? 1 : pageToLoad;
                
                const response = await getItemsWithInventory({
                    page: currentPage,
                    limit: ITEMS_PER_PAGE,
                    search,
                    status: 'active',
                    type,
                    category,
                });

                if (response.success && Array.isArray(response.data)) {
                    const totalItems = response.total || response.data.length;
                    setInventoryData({
                        success: true,
                        data: response.data as ItemWithInventory[],
                        total: totalItems,
                        hasMore: response.hasMore || false,
                    });
                    if (resetPage) setPage(1);
                }
            } catch (error) {
                console.error('Error loading items:', error);
                toast.error('Failed to load inventory items. Please try again.');
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [search, type, category]
    );

    useEffect(() => {
        setPage(1);
        loadItems(1, true);
    }, [search, type, category]);

    useEffect(() => {
        loadItems(page);
    }, [page]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setInventoryData(undefined);
        loadItems(1, true);
    };

    const handleViewCart = () => {
        router.push('/cart');
    };

    const handleItemDetails = (item: ItemWithInventory) => {
        setSelectedDetailItem(item);
        setShowDetails(true);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-screen">
            <Card className="m-4">
                <CardContent className="p-6">
                    <BorrowTableHeader
                        searchTerm={search}
                        setSearchTerm={setSearch}
                        setPage={setPage}
                        handleRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                        onViewCart={handleViewCart}
                    />

                    {isLoading && !inventoryData ? (
                        <BorrowTableContent 
                            isLoading={true} 
                            inventoryData={undefined} 
                            onItemDetails={handleItemDetails}
                        />
                    ) : inventoryData?.data?.length === 0 ? (
                        <NoItems />
                    ) : (
                        <BorrowTableContent
                            isLoading={isLoading}
                            inventoryData={inventoryData}
                            onItemDetails={handleItemDetails}
                        />
                    )}

                    {inventoryData && inventoryData.total > 0 && (
                        <BorrowTableFooter
                            page={page}
                            setPage={setPage}
                            totalItems={inventoryData.total}
                            itemsPerPage={ITEMS_PER_PAGE}
                            isLoading={isLoading}
                        />
                    )}
                </CardContent>
            </Card>

            <BorrowItemDetailsDialog
                item={selectedDetailItem}
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
            />
        </motion.div>
    );
}
