'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ItemWithInventory } from '@/data/inventory.type';
import { CldImage } from 'next-cloudinary';
import { 
    Package2, 
    Building2, 
    TagIcon, 
    Paintbrush, 
    RulerIcon, 
    Calendar,
    Box,
    AlertCircle,
    Info
} from 'lucide-react';

interface BorrowItemDetailsDialogProps {
    item: ItemWithInventory | null;
    isOpen: boolean;
    onClose: () => void;
}

export function BorrowItemDetailsDialog({ item, isOpen, onClose }: BorrowItemDetailsDialogProps) {
    if (!item) return null;

    const isAvailable = item.inventory.available_quantity > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package2 className="h-5 w-5" />
                        Item Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Image Section */}
                    {item.image_url && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                            <CldImage
                                src={item.image_url}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                            />
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-2xl font-bold">{item.name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary">{item.type}</Badge>
                                {isAvailable ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                        Available
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">Out of Stock</Badge>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Brand:</span>
                                    <span>{item.brand}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Type:</span>
                                    <span>{item.type}</span>
                                </div>

                                {item.coating && (
                                    <div className="flex items-center gap-2">
                                        <Paintbrush className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Coating:</span>
                                        <span>{item.coating}</span>
                                    </div>
                                )}

                                {item.length && (
                                    <div className="flex items-center gap-2">
                                        <RulerIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Length:</span>
                                        <span>{item.length}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Box className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Available:</span>
                                    <span className={isAvailable ? 'text-green-600' : 'text-red-600'}>
                                        {item.inventory.available_quantity}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Currently Borrowed:</span>
                                    <span className="text-blue-600">
                                        {item.inventory.total_borrowed}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Box className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Total Stock:</span>
                                    <span>{item.inventory.total_quantity}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Description</span>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Availability Status */}
                        <Separator />
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-start gap-2">
                                {isAvailable ? (
                                    <>
                                        <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-green-700">Ready for Booking</p>
                                            <p className="text-sm text-muted-foreground">
                                                This item is available and ready to be booked for your use.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-red-700">Currently Unavailable</p>
                                            <p className="text-sm text-muted-foreground">
                                                All units of this item are currently borrowed. Check back later for availability.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 