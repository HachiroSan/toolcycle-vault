import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Package2,
    TagIcon,
    Info,
    MoreHorizontal,
    PencilIcon,
    Trash2,
    Box,
    AlertCircle,
    Building2,
    Paintbrush,
    RulerIcon,
    GalleryThumbnails,
    Layers,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TableSkeleton } from './TableSkeleton';
import { InventoryItem } from './InventoryTable';
import { deleteItemWithInventory } from '@/actions/inventory';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { HoverCardArrow } from '@radix-ui/react-hover-card';
import { Badge } from '@/components/ui/badge';
import ImageUploadWidget from './Image';

interface InventoryResponse {
    success: boolean;
    message?: string;
    data: InventoryItem[];
    total: number;
}

interface InventoryTableContentProps {
    isLoading: boolean;
    inventoryData: InventoryResponse | undefined; // Changed from { data: InventoryItem[] } | null
    selectedItems: Set<string>;
    handleSelectAll: () => void;
    handleSelectItem: (itemId: string) => void;
    setSelectedDetailItem: (item: InventoryItem | null) => void;
    setShowDetails: (show: boolean) => void;
    setSelectedItem: (item: InventoryItem | null) => void;
}

export function InventoryTableContent({
    isLoading,
    inventoryData,
    selectedItems,
    handleSelectAll,
    handleSelectItem,
    setSelectedDetailItem,
    setShowDetails,
    setSelectedItem,
}: InventoryTableContentProps) {
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const queryClient = useQueryClient();

    if (isLoading) return <TableSkeleton />;

    const handleDelete = async () => {
        if (!itemToDelete) return;

        await toast.promise(deleteItemWithInventory(itemToDelete), {
            loading: 'Deleting item...',
            success: (response) => {
                if (response.success) {
                    queryClient.invalidateQueries({ queryKey: ['inventory'] });
                    setIsDeleteAlertOpen(false);
                    setItemToDelete(null);
                    return 'Item deleted successfully';
                }
                throw new Error(response.message);
            },
            error: 'Failed to delete item',
        });
    };

    const getStockColor = (available: number, total: number): string => {
        const ratio = available / total;
        if (ratio > 0.7) return 'text-green-500';
        if (ratio > 0.3) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="rounded-lg border bg-card mt-5">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableCell className="w-[40px] text-center">
                            <Checkbox
                                checked={
                                    (inventoryData?.data?.length ?? 0) > 0 &&
                                    selectedItems.size === (inventoryData?.data?.length ?? 0)
                                }
                                onCheckedChange={handleSelectAll}
                            />
                        </TableCell>
                        <TableCell className="w-[50px] text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <GalleryThumbnails className="h-4 w-4 text-muted-foreground" />
                                <span>Image</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Package2 className="h-4 w-4 text-muted-foreground" />
                                <span>Item</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <TagIcon className="h-4 w-4 text-muted-foreground" />
                                <span>Type</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                <span>Category</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <RulerIcon className="h-4 w-4 text-muted-foreground" />
                                <span>Length</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <RulerIcon className="h-4 w-4 text-muted-foreground" />
                                <span>Diameter</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>Flute</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Paintbrush className="h-4 w-4 text-muted-foreground" />
                                <span>Coating</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <span>Description</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Box className="h-4 w-4 text-muted-foreground" />
                                <span>Stock</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right">Actions</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inventoryData?.data?.map((item) => (
                        <TableRow key={item.$id} className="hover:bg-muted/50">
                            <TableCell className="w-[40px] text-center">
                                <Checkbox
                                    checked={selectedItems.has(item.$id)}
                                    onCheckedChange={() => handleSelectItem(item.$id)}
                                />
                            </TableCell>
                            <TableCell className="w-[50px] p-2">
                                <ImageUploadWidget
                                    itemId={item.$id}
                                    imageUrl={item.image_url ?? ''}
                                    onUploadSuccess={() => {}}
                                />
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="font-medium">{item.name}</div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant="secondary" className="bg-gray-200">
                                    {item.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                                {item.category ? (
                                    <Badge variant="outline" className="text-xs">
                                        {item.category}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="font-medium">{item.length ? `L${item.length}mm` : '-'}</div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="font-medium">{item.diameter ? `Ø${item.diameter}mm` : '-'}</div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="font-medium">{item.flute || '-'}</div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="font-medium">{item.coating || '-'}</div>
                            </TableCell>
                            <TableCell className="max-w-[300px] text-center">
                                {item.description && (
                                    <span className="text-sm text-muted-foreground truncate line-clamp-2 block">
                                        {item.description}
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                <HoverCard>
                                    <HoverCardTrigger asChild>
                                        <div className="relative group p-2 hover:bg-slate-50/5 rounded-lg transition-all ">
                                            {/* Circular Progress */}
                                            <div className="flex items-center justify-center space-x-3">
                                                <div className="relative w-12 h-12">
                                                    <svg className="w-12 h-12 transform -rotate-90">
                                                        <circle
                                                            className="text-slate-200"
                                                            strokeWidth="2"
                                                            stroke="currentColor"
                                                            fill="transparent"
                                                            r="20"
                                                            cx="24"
                                                            cy="24"
                                                        />
                                                        <circle
                                                            className={`${getStockColor(
                                                                item.inventory.available_quantity,
                                                                item.inventory.total_quantity
                                                            )}`}
                                                            strokeWidth="2"
                                                            strokeDasharray={`${
                                                                (item.inventory.available_quantity /
                                                                    item.inventory.total_quantity) *
                                                                125.6
                                                            } 125.6`}
                                                            strokeLinecap="round"
                                                            stroke="currentColor"
                                                            fill="transparent"
                                                            r="20"
                                                            cx="24"
                                                            cy="24"
                                                        />
                                                    </svg>
                                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium">
                                                        {Math.round(
                                                            (item.inventory.available_quantity /
                                                                item.inventory.total_quantity) *
                                                                100
                                                        )}
                                                        %
                                                    </div>
                                                </div>

                                                {/* Quick Stats */}
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-medium">
                                                        {item.inventory.available_quantity}/
                                                        {item.inventory.total_quantity}
                                                    </div>
                                                    <div className="text-xs text-blue-500">
                                                        {item.inventory.total_borrowed} borrowed
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Low Stock Warning */}
                                            {item.inventory.available_quantity <
                                                item.inventory.total_quantity * 0.2 && (
                                                <div className="absolute -top-1 -right-1">
                                                    <span className="flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent
                                        className="w-48 p-3 rounded-md bg-popover shadow-md border"
                                        side="top"
                                        sideOffset={5}
                                    >
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <span className="text-muted-foreground">Available</span>
                                            <span className="text-right font-medium">
                                                {new Intl.NumberFormat().format(item.inventory.available_quantity)}
                                            </span>
                                            <span className="text-muted-foreground">Borrowed</span>
                                            <span className="text-right font-medium text-primary">
                                                {new Intl.NumberFormat().format(item.inventory.total_borrowed)}
                                            </span>
                                            <span className="text-muted-foreground">Total</span>
                                            <span className="text-right font-medium">
                                                {new Intl.NumberFormat().format(item.inventory.total_quantity)}
                                            </span>
                                        </div>
                                        <HoverCardArrow className="fill-popover" />
                                    </HoverCardContent>
                                </HoverCard>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedDetailItem(item);
                                            setShowDetails(true);
                                        }}
                                        className="hover:bg-muted"
                                    >
                                        <Info className="h-4 w-4 mr-1" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => setSelectedItem(item)}
                                                className="flex items-center"
                                            >
                                                <PencilIcon className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setItemToDelete(item.$id);
                                                    setIsDeleteAlertOpen(true);
                                                }}
                                                className="flex items-center text-red-500 focus:text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <span>Are you absolutely sure?</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the item and its inventory
                            records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setIsDeleteAlertOpen(false);
                                setItemToDelete(null);
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
