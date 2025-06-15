import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt as ReceiptIcon, User } from 'lucide-react';
import { BorrowReceipt } from '@/data/borrow.type';
import { useUser } from '@/hooks/useUser';
import { BaseItem } from '@/data/inventory.type';
import { CheckoutSuccess } from './CheckoutSuccess';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface ReceiptProps {
    data: BorrowReceipt;
    items: BaseItem[];
}

export function Receipt({ data, items }: ReceiptProps) {
    const { user } = useUser();
    const [showAnimation, setShowAnimation] = useState(true);
    const totalItems = data.item_quantities.reduce((sum, quantity) => sum + quantity, 0);

    useEffect(() => {
        const warningTimer = setTimeout(() => {
            toast(
                <div className="space-y-2">
                    <h3 className="font-medium text-amber-900">Borrowing Guidelines</h3>
                    <ul className="text-sm space-y-1.5 text-amber-800">
                        <li>• Please handle all items with care</li>
                        <li>• Return items in their original condition</li>
                        <li>
                            • Return by{' '}
                            {new Date(data.dueDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </li>
                        <li>• Report any damage immediately</li>
                    </ul>
                </div>,
                {
                    duration: 8000,
                    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
                    className: 'bg-amber-50 border-amber-200',
                    position: 'top-center',
                }
            );
        }, 3500); // Show after success animation

        return () => clearTimeout(warningTimer);
    }, [data.dueDate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAnimation(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence mode="wait">
            {showAnimation ? (
                <motion.div key="animation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <CheckoutSuccess />
                </motion.div>
            ) : (
                <motion.div
                    key="receipt"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader className="text-center border-b">
                            <div className="flex justify-center mb-2">
                                <ReceiptIcon className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle>Receipt</CardTitle>
                            <p className="text-sm text-muted-foreground">Reference ID: {data.$id.toUpperCase()}</p>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                            {/* User Details Section */}
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="font-semibold flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    User Details
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p>Name:</p>
                                    <p>{user?.name}</p>
                                    <p>Email:</p>
                                    <p>{user?.email}</p>
                                    <p>Student ID:</p>
                                    <p>{user?.prefs.studentId}</p>
                                </div>
                            </motion.div>

                            {/* Borrow Details Section */}
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="font-semibold">Borrow Details</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p>Status:</p>
                                    <p className="capitalize">{data.status}</p>
                                    <p>Due Date:</p>
                                    <p>{new Date(data.dueDate).toLocaleDateString()}</p>
                                    {data.returnDate && (
                                        <>
                                            <p>Return Date:</p>
                                            <p>{new Date(data.returnDate).toLocaleDateString()}</p>
                                        </>
                                    )}
                                    {data.subject && (
                                        <>
                                            <p>Subject:</p>
                                            <p>{data.subject}</p>
                                        </>
                                    )}
                                    {data.lecturer && (
                                        <>
                                            <p>Lecturer:</p>
                                            <p>{data.lecturer}</p>
                                        </>
                                    )}
                                    {data.notes && (
                                        <>
                                            <p>Notes:</p>
                                            <p>{data.notes}</p>
                                        </>
                                    )}
                                </div>
                            </motion.div>

                            {/* Items Section */}
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3 className="font-semibold">Borrowed Items</h3>
                                <div className="divide-y">
                                    {items.map((item, index) => {
                                        const itemId = data.item_ids.find((id: string) => id === item.$id);
                                        return (
                                            <motion.div
                                                key={item.$id}
                                                className="py-3"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + index * 0.1 }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <p className="font-medium">
                                                            {item.name || `Item ${index + 1}`}
                                                        </p>
                                                        {item.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                        <div className="flex gap-2 text-sm text-muted-foreground">
                                                            {item.type && <span>{item.type}</span>}
                                                            {item.length && <span>• L{item.length}mm</span>}
                                                            {item.size && <span>• {item.size}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <p className="text-sm font-medium">
                                                            Qty: {data.item_quantities[index]}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">ID: {itemId}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>

                            <motion.div
                                className="border-t pt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <div className="flex justify-between font-semibold">
                                    <p>Total Items:</p>
                                    <p>{totalItems}</p>
                                </div>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
