'use client';

import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getReceipt, returnItems, getReturnConditions } from '@/actions/return';
import { getItems } from '@/actions/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Calendar, Package2, Book, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BorrowReceipt, ReturnBorrowRequest, ItemCondition } from '@/data/borrow.type';
import { BaseItem } from '@/data/inventory.type';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useDebounce } from '@/hooks/useDebounce';
import Confetti from 'react-confetti';

// Types
interface SelectedItemQuantity {
    itemId: string;
    quantity: number;
    condition: ItemCondition;
    notes?: string;
}

interface ItemCardProps {
    item: BaseItem;
    isSelected: boolean;
    remainingQuantity: number;
    onSelect: (itemId: string, checked: boolean) => void;
    onQuantityChange: (itemId: string, quantity: number) => void;
    onConditionChange: (itemId: string, condition: ItemCondition) => void;
    onNotesChange: (itemId: string, notes: string) => void;
    selectedItemQuantities: SelectedItemQuantity[];
    returnedItemCondition?: ItemCondition | null;
}

interface QuantityInputProps {
    currentQuantity: number;
    maxQuantity: number;
    onChange: (value: number) => void;
}

// Validation schemas
const quantitySchema = z.number().int().min(1);

// Utility function to get condition badge variant
const getConditionBadgeVariant = (condition: ItemCondition) => {
    switch (condition) {
        case 'good':
            return 'success';
        case 'damaged_or_broken':
            return 'warning';
        case 'lost':
        case 'missing':
            return 'destructive';
        default:
            return 'secondary';
    }
};

// Utility function to get condition display text
const getConditionDisplayText = (condition: ItemCondition) => {
    switch (condition) {
        case 'good':
            return 'Good';
        case 'damaged_or_broken':
            return 'Damaged/Broken';
        case 'lost':
            return 'Lost';
        case 'missing':
            return 'Missing';
        default:
            return condition;
    }
};

// Quantity Input Component
// Quantity Input Component
const QuantityInput = memo(({ currentQuantity, maxQuantity, onChange }: QuantityInputProps) => {
    const [value, setValue] = useState(Math.min(currentQuantity, maxQuantity));
    const debouncedValue = useDebounce(value, 300);

    useEffect(() => {
        try {
            const parsedValue = parseInt(debouncedValue.toString(), 10);
            if (isNaN(parsedValue)) return;

            const validatedValue = quantitySchema.parse(parsedValue);
            const boundedValue = Math.min(validatedValue, maxQuantity);

            if (boundedValue !== currentQuantity) {
                onChange(boundedValue);
            }
        } catch {
            toast.error('Please enter a valid quantity');
        }
    }, [debouncedValue, maxQuantity, onChange, currentQuantity]);

    useEffect(() => {
        setValue(Math.min(currentQuantity, maxQuantity));
    }, [currentQuantity, maxQuantity]);

    return (
        <Input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            min={1}
            max={maxQuantity}
            className="mt-2 w-32"
        />
    );
});

QuantityInput.displayName = 'QuantityInput';

// Item Card Component
const ItemCard = memo(
    ({ item, isSelected, remainingQuantity, onSelect, onQuantityChange, onConditionChange, onNotesChange, selectedItemQuantities, returnedItemCondition }: ItemCardProps) => {
        const selectedItem = useMemo(
            () => selectedItemQuantities.find((sq) => sq.itemId === item.$id),
            [selectedItemQuantities, item.$id]
        );

        const currentQuantity = selectedItem?.quantity || remainingQuantity;
        const currentCondition = selectedItem?.condition || 'good';
        const currentNotes = selectedItem?.notes || '';

        const isFullyReturned = remainingQuantity === 0;

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                    'p-4 border rounded-lg transition-colors',
                    isSelected && 'border-primary bg-primary/5',
                    isFullyReturned && 'bg-muted'
                )}
            >
                <div className="flex items-start gap-4">
                    {!isFullyReturned ? (
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelect(item.$id, !!checked)}
                            aria-label={`Select ${item.name} for return`}
                        />
                    ) : (
                        <Badge variant="secondary" className="text-green-600">
                            Returned
                        </Badge>
                    )}
                    <div className="flex-1">
                        <div className="flex justify-between mb-2">
                            <p className="font-medium">{item.name}</p>
                            {isSelected ? (
                                <Badge variant={getConditionBadgeVariant(currentCondition)}>
                                    {getConditionDisplayText(currentCondition)}
                                </Badge>
                            ) : isFullyReturned && returnedItemCondition ? (
                                <Badge variant={getConditionBadgeVariant(returnedItemCondition)}>
                                    {getConditionDisplayText(returnedItemCondition)}
                                </Badge>
                            ) : (
                                <Badge variant="outline">{item.type}</Badge>
                            )}
                        </div>
                        {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                        {!isFullyReturned && (
                            <p className="text-sm text-muted-foreground">
                                Remaining quantity to return: {remainingQuantity}
                            </p>
                        )}
                        {isSelected && !isFullyReturned && (
                            <div className="space-y-3 mt-3">
                                <QuantityInput
                                    currentQuantity={currentQuantity}
                                    maxQuantity={remainingQuantity}
                                    onChange={(value) => onQuantityChange(item.$id, value)}
                                />
                                
                                <div className="space-y-2">
                                    <Label htmlFor={`condition-${item.$id}`} className="text-sm font-medium">
                                        Item Condition
                                    </Label>
                                    <Select
                                        value={currentCondition}
                                        onValueChange={(value: ItemCondition) => onConditionChange(item.$id, value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="good">Good Condition</SelectItem>
                                            <SelectItem value="damaged_or_broken">Damaged or Broken</SelectItem>
                                            <SelectItem value="lost">Lost</SelectItem>
                                            <SelectItem value="missing">Missing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`notes-${item.$id}`} className="text-sm font-medium">
                                        Notes (Optional)
                                    </Label>
                                    <Input
                                        id={`notes-${item.$id}`}
                                        placeholder="Add any additional notes..."
                                        value={currentNotes}
                                        onChange={(e) => onNotesChange(item.$id, e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }
);

ItemCard.displayName = 'ItemCard';

// Receipt Metadata Component
const ReceiptMetadata = memo(({ receipt }: { receipt: BorrowReceipt }) => (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="space-y-1">
            <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Due Date</span>
            </div>
            <p className="font-medium">{new Date(receipt?.dueDate).toLocaleDateString()}</p>
        </div>
        {receipt?.subject && (
            <div className="space-y-1">
                <div className="flex items-center text-sm">
                    <Book className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>Subject</span>
                </div>
                <p className="font-medium">{receipt.subject}</p>
            </div>
        )}
        {receipt?.lecturer && (
            <div className="space-y-1">
                <div className="flex items-center text-sm">
                    <Book className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>Lecturer</span>
                </div>
                <p className="font-medium">{receipt.lecturer}</p>
            </div>
        )}
        <div className="space-y-1">
            <div className="flex items-center text-sm">
                <Package2 className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Items</span>
            </div>
            <p className="font-medium">{receipt?.item_ids.length}</p>
        </div>
    </div>
));

ReceiptMetadata.displayName = 'ReceiptMetadata';

// Main Component
export default function ReceiptPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [selectedItemQuantities, setSelectedItemQuantities] = useState<SelectedItemQuantity[]>([]);
    const [isReturning, setIsReturning] = useState(false);
    const [showSuccessBanner, setShowSuccessBanner] = useState(false);

    // Queries
    const { data: receiptData, isLoading: receiptLoading } = useQuery({
        queryKey: ['receipt', params.receipt_id],
        queryFn: async () => {
            const response = await getReceipt(params.receipt_id as string);
            if (!response.data) {
                throw new Error('Receipt not found');
            }
            return { data: response.data as BorrowReceipt };
        },
        staleTime: 30000,
        retry: 2,
    });

    const receipt = receiptData?.data;

    const { data: itemsData, isLoading: itemsLoading } = useQuery({
        queryKey: ['items', receipt?.item_ids],
        queryFn: async () => {
            const response = await getItems(receipt?.item_ids || []);
            if (!response.data) {
                throw new Error('Items not found');
            }
            return { data: response.data };
        },
        enabled: !!receipt?.item_ids,
        staleTime: 30000,
        retry: 2,
    });

    const items = itemsData?.data || [];

    const { data: returnConditionsData } = useQuery({
        queryKey: ['returnConditions', receipt?.$id],
        queryFn: async () => {
            if (!receipt?.$id) return { data: [] };
            const response = await getReturnConditions(receipt.$id);
            return response.data ? { data: response.data } : { data: [] };
        },
        enabled: !!receipt?.$id,
        staleTime: 30000,
        retry: 2,
    });

    const returnConditions = useMemo(() => returnConditionsData?.data || [], [returnConditionsData?.data]);

    // Helper function to get return condition for an item
    const getReturnedItemCondition = useCallback((itemId: string): ItemCondition | null => {
        const condition = returnConditions.find(rc => rc.itemId === itemId);
        return condition?.condition || null;
    }, [returnConditions]);

    // Memoized functions
    const getRemainingQuantity = useCallback(
        (itemId: string) => {
            const index = receipt?.item_ids.findIndex((id) => id === itemId) ?? -1;
            if (index === -1) return 0;
            const totalQuantity = receipt?.item_quantities[index] ?? 0;
            const returnedQuantity = receipt?.returned_quantities?.[index] ?? 0;
            console.log('this is returned quantity', returnedQuantity);
            return Math.max(0, totalQuantity - returnedQuantity);
        },
        [receipt]
    );
    const handleItemSelect = useCallback((itemId: string, checked: boolean) => {
        setSelectedItems((prev) => (checked ? [...prev, itemId] : prev.filter((id) => id !== itemId)));
    }, []);

    const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
        setSelectedItemQuantities((prev) => {
            const existing = prev.findIndex((item) => item.itemId === itemId);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing].quantity = quantity;
                return updated;
            }
            return [...prev, { itemId, quantity, condition: 'good' as ItemCondition, notes: '' }];
        });
    }, []);

    const handleConditionChange = useCallback((itemId: string, condition: ItemCondition) => {
        setSelectedItemQuantities((prev) => {
            const existing = prev.findIndex((item) => item.itemId === itemId);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing].condition = condition;
                return updated;
            }
            return [...prev, { itemId, quantity: getRemainingQuantity(itemId), condition, notes: '' }];
        });
    }, [getRemainingQuantity]);

    const handleNotesChange = useCallback((itemId: string, notes: string) => {
        setSelectedItemQuantities((prev) => {
            const existing = prev.findIndex((item) => item.itemId === itemId);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing].notes = notes;
                return updated;
            }
            return [...prev, { itemId, quantity: getRemainingQuantity(itemId), condition: 'good' as ItemCondition, notes }];
        });
    }, [getRemainingQuantity]);

    // Return handler
    const handleReturn = async () => {
        if (selectedItems.length === 0) return;

        let previousData;
        try {
            setIsReturning(true);
            previousData = queryClient.getQueryData(['receipt', params.receipt_id]);

            const returnRequests: ReturnBorrowRequest[] = selectedItems.map((itemId) => {
                const itemQuantity = selectedItemQuantities.find((sq) => sq.itemId === itemId);
                // Use getRemainingQuantity instead of item_quantities
                const quantity = itemQuantity?.quantity || getRemainingQuantity(itemId);
                return {
                    itemId,
                    quantity: quantitySchema.parse(quantity),
                    condition: itemQuantity?.condition || 'good',
                    notes: itemQuantity?.notes,
                };
            });

            queryClient.setQueryData(['receipt', params.receipt_id], (old: { data: BorrowReceipt } | undefined) => {
                if (!old?.data) return old;

                const updatedReceipt = { ...old.data };
                returnRequests.forEach((req) => {
                    const index = updatedReceipt.item_ids.findIndex((id: string) => id === req.itemId);
                    if (index !== -1) {
                        updatedReceipt.returned_quantities[index] += req.quantity;
                    }
                });

                const allReturned = updatedReceipt.item_quantities.every(
                    (qty: number, idx: number) => qty === updatedReceipt.returned_quantities[idx]
                );

                if (allReturned) {
                    updatedReceipt.status = 'returned';
                }

                return { data: updatedReceipt };
            });

            if (!receipt) throw new Error('Receipt not found');
            const response = await returnItems(returnRequests, receipt.$id);

            if (!response.success) {
                throw new Error(response.message || 'Failed to return items');
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['receipt', params.receipt_id] }),
                queryClient.invalidateQueries({ queryKey: ['items', receipt?.item_ids] }),
                queryClient.invalidateQueries({ queryKey: ['receipts'] }),
                queryClient.invalidateQueries({ queryKey: ['returnConditions', receipt.$id] }),
            ]);

            setSelectedItems([]);
            setSelectedItemQuantities([]);

            setShowSuccessBanner(true);
            toast.success('Items returned successfully');
        } catch (error) {
            // Rollback on error
            queryClient.setQueryData(['receipt', params.receipt_id], previousData);
            toast.error(error instanceof Error ? error.message : 'Failed to return items');
        } finally {
            setIsReturning(false);
        }
    };

    // Loading state
    if (receiptLoading || itemsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Not found state
    if (!receipt) {
        return (
            <div className="container max-w-4xl py-8">
                <Card className="p-6 text-center">
                    <h2 className="font-semibold">Receipt not found</h2>
                    <p className="text-muted-foreground mt-2">
                        This receipt may not exist or you don&apos;t have access to it.
                    </p>
                    {window.history.length > 1 ? (
                        <Button variant="outline" className="mt-4" onClick={() => router.push('/return')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    ) : null}
                </Card>
            </div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {showSuccessBanner && (
                    <>
                        <Confetti
                            recycle={false}
                            numberOfPieces={1000}
                            gravity={0.05}
                            tweenDuration={30000}
                            colors={['#FF7F50', '#FF6EC7', '#FFD700', '#7FFF00', '#00BFFF']}
                        />
                    </>
                )}
            </AnimatePresence>
            <div className="container max-w-4xl py-8">
                {window.history.length > 1 ? (
                    <Button
                        variant="ghost"
                        className="mb-6"
                        onClick={() => router.back()}
                        aria-label="Go back to returns page"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                ) : null}

                <Card>
                    <CardHeader className="border-b">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Receipt # {receipt.$id.toUpperCase()}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Created on {new Date(receipt.$createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <Badge variant={receipt?.status === 'active' ? 'default' : 'secondary'}>
                                {receipt?.status}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <ReceiptMetadata receipt={receipt} />

                        {/* Items List */}
                        <div className="space-y-4">
                            <h3 className="font-semibold">Return Items</h3>
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {items?.map((item: BaseItem) => {
                                        const remainingQuantity = getRemainingQuantity(item.$id);
                                        const isSelected = selectedItems.includes(item.$id);
                                        const returnedCondition = getReturnedItemCondition(item.$id);

                                        return (
                                            <ItemCard
                                                key={item.$id}
                                                item={item}
                                                isSelected={isSelected}
                                                remainingQuantity={remainingQuantity}
                                                onSelect={handleItemSelect}
                                                onQuantityChange={handleQuantityChange}
                                                onConditionChange={handleConditionChange}
                                                onNotesChange={handleNotesChange}
                                                selectedItemQuantities={selectedItemQuantities}
                                                returnedItemCondition={returnedCondition}
                                            />
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Return Button */}
                        <div className="mt-8 flex justify-end">
                            <Button
                                size="lg"
                                disabled={selectedItems.length === 0 || isReturning}
                                onClick={handleReturn}
                                aria-label={`Return ${selectedItems.length} selected items`}
                            >
                                {isReturning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Returning...
                                    </>
                                ) : (
                                    `Return Selected Items (${selectedItems.length})`
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
