'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemWithInventory } from '@/data/inventory.type';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { Package2, ShoppingCart, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2 },
};

export function InventoryItem({ item }: { item: ItemWithInventory }) {
    const { addToCart, removeFromCart, state } = useCart();
    const [isHovering, setIsHovering] = useState(false);

    const isInCart = state.items.some((cartItem) => cartItem.item.$id === item.$id);
    const isAvailable = item.inventory.available_quantity > 0;

    const handleCartAction = () => {
        if (isInCart) {
            removeFromCart(item.$id);
        } else if (isAvailable) {
            addToCart({
                item,
                quantity: 1,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
        }
    };

    const getButtonText = () => {
        if (isInCart) {
            return isHovering ? (
                <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Remove from Cart
                </>
            ) : (
                'In Cart'
            );
        }
        if (!isAvailable) {
            return 'Out of Stock';
        }
        return isHovering ? <>Select</> : <>Borrow</>;
    };

    return (
        <motion.div {...fadeIn}>
            <Card className="w-full h-full flex flex-col overflow-hidden group">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold truncate">{item.name}</CardTitle>
                        <AnimatePresence>
                            <motion.div {...fadeIn}>
                                <Badge
                                    variant={isInCart ? 'secondary' : isAvailable ? 'success' : 'destructive'}
                                    className="ml-2"
                                >
                                    {isInCart ? 'In Cart' : isAvailable ? 'Available' : 'Out of Stock'}
                                </Badge>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        {item.brand && <span>{item.brand}</span>}
                        {item.type && <span>• {item.type}</span>}
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between text-sm">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-help">
                                        <Package2 className="h-4 w-4 text-primary" />
                                        <span>{item.inventory.available_quantity} available</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Available for borrowing</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {item.description && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 cursor-help text-muted-foreground hover:text-foreground transition-colors">
                                            <Info className="h-4 w-4" />
                                            <span>Details</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{item.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="pt-2">
                    <div
                        className="w-full"
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        <Button
                            onClick={handleCartAction}
                            disabled={!isAvailable && !isInCart}
                            className={cn(
                                'w-full transition-all duration-200',
                                isInCart && !isHovering && 'bg-green-600 hover:bg-green-700', // Add green when in cart
                                isInCart && isHovering && 'bg-destructive hover:bg-destructive/90' // Keep red for remove state
                            )}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${isInCart}-${isHovering}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center justify-center"
                                >
                                    {isInCart ? (
                                        isHovering ? (
                                            <>
                                                <X className="mr-2 h-4 w-4" />
                                                Remove
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                In Cart
                                            </>
                                        )
                                    ) : (
                                        <>{getButtonText()}</>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
