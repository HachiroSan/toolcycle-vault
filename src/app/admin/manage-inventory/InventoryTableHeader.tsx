import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Trash2, RefreshCw, Plus, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface InventoryTableHeaderProps {
    setShowAddDialog: (show: boolean) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setPage: (page: number) => void;
    handleRefresh: () => void;
    isRefreshing: boolean;
    selectedItems: Set<string>;
    setIsDeleteDialogOpen: (open: boolean) => void;
}

export function InventoryTableHeader({
    setShowAddDialog,
    searchTerm,
    setSearchTerm,
    setPage,
    handleRefresh,
    isRefreshing,
    selectedItems,
    setIsDeleteDialogOpen,
}: InventoryTableHeaderProps) {
    const [localSearch, setLocalSearch] = useState(searchTerm);
    const debouncedSearch = useDebounce(localSearch, 300);

    useEffect(() => {
        setSearchTerm(debouncedSearch);
        setPage(1);
    }, [debouncedSearch]);

    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Add gap between header and content */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            aria-label={isRefreshing ? 'Refreshing inventory' : 'Refresh inventory'}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => setShowAddDialog(true)}
                            aria-label="Add new inventory item"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                        {selectedItems.size > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <Button
                                    variant="destructive"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    aria-label={`Delete ${selectedItems.size} selected items`}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete ({selectedItems.size})
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
                {/* Limit search bar width and use ring color matching the theme */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        type="search"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder="Search inventory items..."
                        className="w-full pl-10 focus:ring-ring"
                        aria-label="Search inventory items"
                    />
                </div>
            </div>
        </motion.div>
    );
}
