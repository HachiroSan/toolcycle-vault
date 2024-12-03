import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InventoryItem } from './InventoryTable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ItemDetailsDialogProps {
    item: InventoryItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ItemDetailsDialog({ item, isOpen, onClose }: ItemDetailsDialogProps) {
    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] p-5">
                <DialogHeader className="space-y-1.5">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        {item.name}
                        <Badge variant="secondary" className="text-xs">
                            {item.type}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-full max-h-[400px] pr-4">
                    <div className="space-y-4">
                        {/* Inventory Status Cards */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-card p-3 rounded-lg border shadow-sm">
                                <p className="text-xs text-muted-foreground mb-1">Total</p>
                                <p className="text-lg font-medium">{item.inventory.total_quantity}</p>
                            </div>
                            <div className="bg-card p-3 rounded-lg border shadow-sm">
                                <p className="text-xs text-muted-foreground mb-1">Available</p>
                                <p className="text-lg font-medium">{item.inventory.available_quantity}</p>
                            </div>
                            <div className="bg-card p-3 rounded-lg border shadow-sm">
                                <p className="text-xs text-muted-foreground mb-1">Borrowed</p>
                                <p className="text-lg font-medium">{item.inventory.total_borrowed}</p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-2">
                            {[
                                { label: 'Brand', value: item.brand },
                                { label: 'Size', value: item.size },
                                { label: 'Material', value: item.material },
                                { label: 'Coating', value: item.coating },
                            ].map(
                                ({ label, value }) =>
                                    value && (
                                        <div
                                            key={label}
                                            className="flex items-center py-1.5 group transition-colors hover:bg-muted/40 rounded px-2"
                                        >
                                            <span className="text-sm text-muted-foreground w-24">{label}</span>
                                            <span className="text-sm flex-1">{value}</span>
                                        </div>
                                    )
                            )}
                        </div>

                        {/* Description Section */}
                        {item.description && (
                            <div className="space-y-1.5 mt-4">
                                <span className="text-sm text-muted-foreground">Description</span>
                                <div className="bg-muted/30 rounded-lg p-3">
                                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
