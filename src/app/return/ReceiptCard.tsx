import { motion } from 'framer-motion';
import { Package2, CalendarDays, Book, AlertCircle } from 'lucide-react'; // Add AlertCircle
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BorrowReceipt } from '@/data/borrow.type';

interface ReceiptCardProps {
    receipt: BorrowReceipt;
    selectedReceipt: BorrowReceipt | null;
    onSelect: (receipt: BorrowReceipt) => void;
}

export default function ReceiptCard({ receipt, selectedReceipt, onSelect }: ReceiptCardProps) {
    const isOverdue = (date: string) => {
        return new Date(date) < new Date() && receipt.status === 'active';
    };

    const overdue = isOverdue(receipt.dueDate);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card
                className={cn(
                    'cursor-pointer hover:shadow-md transition-all',
                    selectedReceipt?.$id === receipt.$id && 'ring-2 ring-primary',
                    overdue && 'border-red-200'
                )}
                onClick={() => onSelect(receipt)}
            >
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="font-semibold text-sm">{receipt.$id.toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(receipt.$createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <Badge variant={receipt.status === 'active' ? 'default' : 'secondary'}>{receipt.status}</Badge>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm">
                            <Package2 className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span>
                                {receipt.item_ids.length} {receipt.item_ids.length > 1 ? 'items' : 'item'}
                            </span>
                        </div>
                        {receipt.subject && (
                            <div className="flex items-center text-sm">
                                <Book className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span>{receipt.subject}</span>
                            </div>
                        )}
                        <div className="flex items-center text-sm">
                            <CalendarDays
                                className={cn('w-4 h-4 mr-2', overdue ? 'text-red-500' : 'text-muted-foreground')}
                            />
                            <span className={cn(overdue && 'text-red-500 font-medium')}>
                                Due: {new Date(receipt.dueDate).toLocaleDateString()}
                            </span>
                            {overdue && <AlertCircle className="w-4 h-4 ml-2 text-red-500" />}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
