import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MinusIcon, PlusIcon, Trash2Icon, ChevronDownIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface InventoryItem {
    $id: string;
    name: string;
    inventory: {
        available_quantity: number;
    };
}

interface CartItemDetailsProps {
    description?: string | null;
    type?: string;
    diameter?: number | null;
    size?: string | null;
}

interface CartItemProps {
    item: InventoryItem;
    itemDetails?: CartItemDetailsProps;
    quantity: number;
    onUpdate: (itemId: string, updates: { quantity: number }) => void;
    onRemove: (itemId: string) => void;
}

export function CartItem({ item, itemDetails, quantity, onUpdate, onRemove }: CartItemProps) {
    const [itemQuantity, setItemQuantity] = useState(quantity);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setItemQuantity(quantity);
    }, [quantity]);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1 && newQuantity <= item.inventory.available_quantity) {
            setItemQuantity(newQuantity);
            onUpdate(item.$id, { quantity: newQuantity });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="w-full p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <span className="font-semibold flex-grow truncate">{item.name}</span>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(itemQuantity - 1)}
                                disabled={itemQuantity <= 1}
                            >
                                <MinusIcon className="h-4 w-4" />
                            </Button>

                            <Input
                                type="number"
                                min={1}
                                max={item.inventory.available_quantity}
                                value={itemQuantity}
                                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                                className="w-16 text-center p-2"
                            />

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(itemQuantity + 1)}
                                disabled={itemQuantity >= item.inventory.available_quantity}
                            >
                                <PlusIcon className="h-4 w-4" />
                            </Button>

                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                (Max: {item.inventory.available_quantity})
                            </span>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90"
                                onClick={() => onRemove(item.$id)}
                            >
                                <Trash2Icon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {itemDetails && (
                        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full flex justify-between">
                                    <span>Details</span>
                                    <ChevronDownIcon
                                        className={`h-4 w-4 transition-transform ${
                                            isOpen ? 'transform rotate-180' : ''
                                        }`}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 pl-4 space-y-2">
                                {itemDetails.description && (
                                    <p className="text-sm text-muted-foreground">{itemDetails.description}</p>
                                )}
                                <div className="flex gap-4 text-sm">
                                    {itemDetails.type && <span>Type: {itemDetails.type}</span>}
                                    {itemDetails.diameter && <span>⌀{itemDetails.diameter}mm</span>}
                                    {itemDetails.size && <span>Size: {itemDetails.size}</span>}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}
