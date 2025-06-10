'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CldImage } from 'next-cloudinary';

interface BorrowImagePreviewDialogProps {
    imageUrl: string | null;
    itemName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function BorrowImagePreviewDialog({ 
    imageUrl, 
    itemName, 
    isOpen, 
    onClose 
}: BorrowImagePreviewDialogProps) {
    if (!imageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle className="hidden">{itemName} - Image Preview</DialogTitle>
            <DialogContent className="max-w-3xl p-0">
                <div className="relative w-full aspect-square">
                    <CldImage
                        src={imageUrl}
                        alt={`${itemName} - Full size preview`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 768px"
                        priority
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
} 