'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useDebounce } from '@/hooks/useDebounce';
import { deleteMultipleItems, getItemsWithInventory } from '@/actions/inventory';
import { toast } from 'sonner';
import { inventoryItemSchema } from '@/data/inventory.type';
import { InventoryTableHeader } from './InventoryTableHeader';
import { InventoryTableContent } from './InventoryTableContent';
import { InventoryTableFooter } from './InventoryTableFooter';
import AddInventoryDialog from './AddInventoryDialog';
import EditItemDialog from './EditItemDialog';
import { ItemDetailsDialog } from './ItemDetailsDialog';
import DeleteDialog from './DeleteDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

interface InventoryResponse {
    success: boolean;
    message?: string;
    data: InventoryItem[];
    total: number;
}

const ITEMS_PER_PAGE = 10;

export default function InventoryTable() {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetails, setShowDetails] = useState(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState<InventoryItem | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 500);

    const queryClient = useQueryClient();

    const {
        data: inventoryData,
        isLoading: isQueryLoading,
        error,
    } = useQuery<InventoryResponse>({
        queryKey: ['inventory', page, debouncedSearch],
        queryFn: async () => {
            const response = await getItemsWithInventory({
                page,
                limit: ITEMS_PER_PAGE,
                search: debouncedSearch,
                status: 'active',
            });
            if (!response.success) {
                throw new Error(response.message);
            }
            return {
                ...response,
                data: response.data ?? [],
            };
        },
    });

    // Combine both loading states
    const isLoading = isQueryLoading || isRefreshing;

    const handleSelectItem = (itemId: string) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (!inventoryData?.data) return;
        setSelectedItems((prev) =>
            prev.size === inventoryData.data.length ? new Set() : new Set(inventoryData.data.map((item) => item.$id))
        );
    };

    const handleDeleteSelected = () => {
        setIsDeleteDialogOpen(false);
        toast.promise(deleteMultipleItems(Array.from(selectedItems)), {
            loading: 'Deleting items...',
            success: (response) => {
                if (response.success) {
                    setSelectedItems(new Set());
                    queryClient.invalidateQueries({ queryKey: ['inventory'] });
                    return 'Items deleted successfully';
                }
                throw new Error(response.message);
            },
            error: 'Failed to delete items',
        });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await queryClient.invalidateQueries({ queryKey: ['inventory'] });
            await queryClient.refetchQueries({ queryKey: ['inventory'] });
        } finally {
            setIsRefreshing(false);
        }
    };

    if (error instanceof Error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    return (
        <motion.div>
            <InventoryTableHeader
                setShowAddDialog={setShowAddDialog}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setPage={setPage}
                handleRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                selectedItems={selectedItems}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            />
            <InventoryTableContent
                isLoading={isLoading}
                inventoryData={inventoryData}
                selectedItems={selectedItems}
                handleSelectAll={handleSelectAll}
                handleSelectItem={handleSelectItem}
                setSelectedDetailItem={setSelectedDetailItem}
                setShowDetails={setShowDetails}
                setSelectedItem={setSelectedItem}
            />
            <InventoryTableFooter
                page={page}
                setPage={setPage}
                totalItems={inventoryData?.total ?? 0}
                itemsPerPage={ITEMS_PER_PAGE}
            />
            <AddInventoryDialog isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} />
            {selectedItem && (
                <EditItemDialog item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} />
            )}
            <ItemDetailsDialog item={selectedDetailItem} isOpen={showDetails} onClose={() => setShowDetails(false)} />
            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                itemCount={selectedItems.size}
                onConfirm={handleDeleteSelected}
                onCancel={() => setIsDeleteDialogOpen(false)}
            />
        </motion.div>
    );
}
