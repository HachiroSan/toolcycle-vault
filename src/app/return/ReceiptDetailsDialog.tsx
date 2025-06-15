import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Package2, User, Book, Loader2 } from 'lucide-react';
import { BorrowReceipt, ItemReturnCondition, ItemCondition } from '@/data/borrow.type';
import { BaseItem } from '@/data/inventory.type';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface ReceiptDetailsDialogProps {
    receipt: BorrowReceipt | null;
    items: BaseItem[];
    onClose: () => void;
    loading?: boolean;
    returnConditions?: ItemReturnCondition[];
}

export default function ReceiptDetailsDialog({ receipt, items, onClose, loading = false, returnConditions = [] }: ReceiptDetailsDialogProps) {
    if (!receipt) return null;

    // Utility functions for condition display
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

    const getItemReturnCondition = (itemId: string) => {
        return returnConditions.find(rc => rc.itemId === itemId);
    };

    return (
        <Dialog open={!!receipt} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex justify-between items-center">
                    <DialogTitle>Receipt Details</DialogTitle>
                    <Link href={`/return/${receipt.$id}`}>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                            <span className="text-sm">View Full Details</span>
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </Link>
                </DialogHeader>
                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ScrollArea className="flex-1">
                        <div className="space-y-6 p-4">
                            <div className="grid gap-4 grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Borrow Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status</span>
                                            <Badge>{receipt.status}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Due Date</span>
                                            <span>{new Date(receipt.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        {receipt.returnDate && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Return Date</span>
                                                <span>{new Date(receipt.returnDate).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Book className="w-4 h-4" />
                                            Course Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        {receipt.subject && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Subject</span>
                                                <span>{receipt.subject}</span>
                                            </div>
                                        )}
                                        {receipt.lecturer && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Lecturer</span>
                                                <span>{receipt.lecturer}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Package2 className="w-4 h-4" />
                                        Borrowed Items
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {items.map((item) => {
                                            const returnCondition = getItemReturnCondition(item.$id);
                                            return (
                                                <div
                                                    key={item.$id}
                                                    className="flex items-center justify-between p-3 rounded-lg border"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="font-medium">{item.name}</p>
                                                            {returnCondition && (
                                                                <Badge variant={getConditionBadgeVariant(returnCondition.condition)}>
                                                                    {getConditionDisplayText(returnCondition.condition)}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.type}
                                                            {item.size && ` • ${item.size}`}
                                                            {item.diameter && ` • ⌀${item.diameter}mm`}
                                                        </p>
                                                        {item.flute && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Flutes: {item.flute}
                                                            </p>
                                                        )}
                                                        {returnCondition?.notes && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                <span className="font-medium">Return Notes:</span> {returnCondition.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2 ml-4">
                                                        {item.material && <Badge variant="outline">{item.material}</Badge>}
                                                        {item.coating && <Badge variant="outline">{item.coating}</Badge>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
