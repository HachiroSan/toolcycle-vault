'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Package2,
    TagIcon,
    Info,
    Building2,
    Paintbrush,
    RulerIcon,
    GalleryThumbnails,
    Calendar,
    AlertCircle,
    ShoppingCart,
    Minus,
    Plus,
    ZoomIn,
    X,
    Check,
} from 'lucide-react';
import { CldImage } from 'next-cloudinary';
import { ItemWithInventory } from '@/data/inventory.type';
import { useCart } from '@/hooks/useCart';
import { BorrowTableSkeleton } from './BorrowTableSkeleton';
import { BorrowImagePreviewDialog } from './BorrowImagePreviewDialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { HoverCardArrow } from '@radix-ui/react-hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface BorrowResponse {
    success: boolean;
    message?: string;
    data: ItemWithInventory[];
    total: number;
}

interface BorrowTableContentProps {
    isLoading: boolean;
    inventoryData: BorrowResponse | undefined;
    onItemDetails: (item: ItemWithInventory) => void;
}

export function BorrowTableContent({ isLoading, inventoryData, onItemDetails }: BorrowTableContentProps) {
    const { addToCart, removeFromCart, updateQuantity, state } = useCart();
    const [imagePreview, setImagePreview] = useState<{
        isOpen: boolean;
        imageUrl: string | null;
        itemName: string;
    }>({
        isOpen: false,
        imageUrl: null,
        itemName: '',
    });

    if (isLoading) return <BorrowTableSkeleton />;

    const getCartItem = (itemId: string) => {
        return state.items.find((cartItem) => cartItem.item.$id === itemId);
    };

    const isBooked = (itemId: string) => {
        return state.items.some((cartItem) => cartItem.item.$id === itemId);
    };

    const handleBooking = (item: ItemWithInventory) => {
        const cartItem = getCartItem(item.$id);
        if (cartItem) {
            removeFromCart(item.$id);
        } else if (item.inventory.available_quantity > 0) {
            addToCart({
                item,
                quantity: 1,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
        }
    };

    const handleQuantityChange = (item: ItemWithInventory, change: number) => {
        const cartItem = getCartItem(item.$id);
        if (cartItem) {
            const newQuantity = cartItem.quantity + change;
            if (newQuantity <= 0) {
                removeFromCart(item.$id);
            } else if (newQuantity <= item.inventory.available_quantity) {
                updateQuantity(item.$id, newQuantity);
            }
        }
    };



    const handleImageClick = (imageUrl: string, itemName: string) => {
        setImagePreview({
            isOpen: true,
            imageUrl,
            itemName,
        });
    };

    const closeImagePreview = () => {
        setImagePreview({
            isOpen: false,
            imageUrl: null,
            itemName: '',
        });
    };

    return (
        <div className="rounded-lg border bg-card mt-5">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableCell className="w-[80px] text-center">
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
                                <RulerIcon className="h-4 w-4 text-muted-foreground" />
                                <span>Diameter</span>
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
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>Flute</span>
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
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Availability</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center min-w-[320px]">Actions</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inventoryData?.data?.map((item) => {
                        const cartItem = getCartItem(item.$id);
                        const itemBooked = isBooked(item.$id);
                        const isAvailable = item.inventory.available_quantity > 0;

                        return (
                            <TableRow key={item.$id} className="hover:bg-muted/50">
                                <TableCell className="w-[80px] p-2">
                                    <div className="flex items-center justify-center">
                                        {item.image_url ? (
                                            <button
                                                onClick={() => handleImageClick(item.image_url!, item.name)}
                                                className="relative w-16 h-16 rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-105"
                                                title={`Click to view ${item.name} image`}
                                            >
                                                <CldImage
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    fill
                                                    sizes="64px"
                                                    className="object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <ZoomIn className="h-4 w-4 text-white" />
                                                    </div>
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                                <Package2 className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
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
                                    <div className="font-medium">{item.diameter ? `⌀${item.diameter}mm` : '-'}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="font-medium">{item.coating || '-'}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="font-medium">{item.flute || '-'}</div>
                                </TableCell>
                                <TableCell className="max-w-[200px] text-center">
                                    {item.description ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="text-sm text-muted-foreground truncate line-clamp-2 block cursor-help">
                                                        {item.description}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>{item.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <HoverCard>
                                        <HoverCardTrigger asChild>
                                            <div className="flex items-center justify-center">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-2 cursor-help">
                                                                {isAvailable ? (
                                                                    <>
                                                                        <Calendar className="h-4 w-4 text-green-500" />
                                                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                                            Available ({item.inventory.available_quantity})
                                                                        </Badge>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                                        <Badge variant="destructive">
                                                                            Out of Stock
                                                                        </Badge>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {isAvailable ? 'Available for booking' : 'Currently unavailable'}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-48 p-3 rounded-md bg-popover shadow-md border" side="top">
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
                                <TableCell className="text-center min-w-[320px]">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onItemDetails(item)}
                                            className="hover:bg-muted flex-shrink-0"
                                        >
                                            <Info className="h-4 w-4 mr-1" />
                                            Details
                                        </Button>
                                        
                                        <div className="flex items-center gap-1 min-w-[120px] justify-center">
                                            <AnimatePresence mode="wait">
                                                {cartItem ? (
                                                    <motion.div
                                                        key="quantity-controls"
                                                        initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                                        animate={{ opacity: 1, scale: 1, width: "auto" }}
                                                        exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleQuantityChange(item, -1)}
                                                            className="h-8 w-8 p-0 flex-shrink-0"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="mx-2 min-w-[2ch] text-center font-medium">
                                                            {cartItem.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleQuantityChange(item, 1)}
                                                            disabled={cartItem.quantity >= item.inventory.available_quantity}
                                                            className="h-8 w-8 p-0 flex-shrink-0"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </motion.div>
                                                ) : null}
                                            </AnimatePresence>
                                        </div>

                                        {itemBooked ? (
                                            <div className="flex items-center gap-1">
                                                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-md border border-green-200 min-w-[80px] justify-center">
                                                    <Check className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Booked</span>
                                                </div>
                                                <Button
                                                    onClick={() => handleBooking(item)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 flex-shrink-0"
                                                    title="Remove from cart"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => handleBooking(item)}
                                                disabled={!isAvailable}
                                                className="min-w-[80px] flex-shrink-0 hover:bg-primary/90 transition-colors duration-200"
                                            >
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                Book
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <BorrowImagePreviewDialog
                imageUrl={imagePreview.imageUrl}
                itemName={imagePreview.itemName}
                isOpen={imagePreview.isOpen}
                onClose={closeImagePreview}
            />
        </div>
    );
} 