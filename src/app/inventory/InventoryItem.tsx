import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemWithInventory } from '@/data/inventory.type';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { Wrench, Calendar, AlertCircle, Info, Package2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CldImage } from 'next-cloudinary';
import { cn } from '@/lib/utils';
import { DialogTitle } from '@radix-ui/react-dialog';

export function InventoryItem({ item }: { item: ItemWithInventory }) {
    const { addToCart, removeFromCart, state } = useCart();
    const [isHovering, setIsHovering] = useState(false);

    const isBooked = state.items.some((cartItem) => cartItem.item.$id === item.$id);
    const isAvailable = item.inventory.available_quantity > 0;

    const handleBooking = () => {
        if (isBooked) {
            removeFromCart(item.$id);
        } else if (isAvailable) {
            addToCart({
                item,
                quantity: 1,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="relative overflow-hidden bg-background border-2 hover:border-primary transition-colors duration-300">
                {/* Large Image Section */}
                <div className="relative aspect-video w-full overflow-hidden">
                    {item.image_url ? (
                        <Dialog>
                            <DialogTitle className="hidden" />
                            <DialogTrigger className="w-full h-full">
                                <div className="relative w-full h-full">
                                    <CldImage
                                        src={item.image_url}
                                        alt={item.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover transition-transform duration-300 hover:scale-110"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                                <div className="relative aspect-video w-full">
                                    <CldImage
                                        src={item.image_url}
                                        alt={item.name}
                                        fill
                                        className="object-contain"
                                        sizes="90vw"
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Package2 className="h-20 w-20 text-muted-foreground" />
                        </div>
                    )}

                    {/* Status Badge */}
                    <Badge
                        variant={isBooked ? 'secondary' : isAvailable ? 'success' : 'destructive'}
                        className="absolute top-4 right-4 z-10"
                    >
                        {isBooked ? 'Reserved' : isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                </div>

                {/* Machine Info */}
                <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="text-xl font-bold">{item.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                {item.diameter && (
                                    <div className="flex items-center gap-1">
                                        <Wrench className="h-4 w-4" />
                                        <span>⌀{item.diameter}mm</span>
                                    </div>
                                )}
                                {item.type && <span>• {item.type}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Machine Status and Actions */}
                    <div className="flex items-center justify-between mt-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-help">
                                        {isAvailable ? (
                                            <>
                                                <Calendar className="h-4 w-4 text-green-500" />
                                                <span className="text-sm text-green-500">Ready for Use</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                                <span className="text-sm text-red-500">Out Of Stock</span>
                                            </>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isAvailable ? 'Machine is available for booking' : 'Machine is currently in use'}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Button
                            onClick={handleBooking}
                            disabled={!isAvailable && !isBooked}
                            className={cn(
                                'transition-all duration-200',
                                isBooked && !isHovering && 'bg-green-600 hover:bg-green-700',
                                isBooked && isHovering && 'bg-destructive hover:bg-destructive/90'
                            )}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${isBooked}-${isHovering}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center gap-2"
                                >
                                    {isBooked ? isHovering ? <>Cancel Booking</> : <>Booked</> : <>Book</>}
                                </motion.div>
                            </AnimatePresence>
                        </Button>
                    </div>

                    {/* Technical Details */}
                    {item.description && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}
