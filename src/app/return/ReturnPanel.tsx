'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReceipts } from '@/actions/return';
import { getItems } from '@/actions/inventory';
import { BorrowReceipt } from '@/data/borrow.type';
import { BaseItem } from '@/data/inventory.type';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle2, AlertCircle, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ReceiptCard from './ReceiptCard';
import ReceiptDetailsDialog from './ReceiptDetailsDialog';

export default function ReturnPanel() {
    const [selectedReceipt, setSelectedReceipt] = useState<BorrowReceipt | null>(null);
    const [receiptItems, setReceiptItems] = useState<BaseItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch active and returned receipts
    const { data: activeReceipts, isLoading: activeLoading } = useQuery({
        queryKey: ['receipts', 'active'],
        queryFn: async () => {
            const response = await getReceipts('active');
            return response.success
                ? response.data?.filter((receipt) => new Date(receipt.dueDate) >= new Date()) || []
                : [];
        },
    });

    const { data: overdueReceipts, isLoading: overdueLoading } = useQuery({
        queryKey: ['receipts', 'overdue'],
        queryFn: async () => {
            const response = await getReceipts('active');
            return response.success
                ? response.data?.filter((receipt) => new Date(receipt.dueDate) < new Date()) || []
                : [];
        },
    });

    // Update the returned receipts query
    const { data: returnedReceipts, isLoading: returnedLoading } = useQuery({
        queryKey: ['receipts', 'returned'],
        queryFn: async () => {
            const response = await getReceipts('returned');
            if (!response.success) {
                return [];
            }
            // Pre-filter data at query time
            return (
                response.data?.filter(
                    (receipt) =>
                        !searchTerm ||
                        receipt.$id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        receipt.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        receipt.lecturer?.toLowerCase().includes(searchTerm.toLowerCase())
                ) || []
            );
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: 1, // Limit retries
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
    });

    // Fetch items when a receipt is selected
    useEffect(() => {
        const fetchItems = async () => {
            if (selectedReceipt) {
                const response = await getItems(selectedReceipt.item_ids);
                if (response.success) {
                    setReceiptItems(response.data || []);
                }
            }
        };
        fetchItems();
    }, [selectedReceipt]);

    // Filter receipts based on search term
    const filterReceipts = (receipts: BorrowReceipt[] = []) => {
        if (!searchTerm) return receipts;
        return receipts.filter(
            (receipt) =>
                receipt.$id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                receipt.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                receipt.lecturer?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    return (
        <div className="container max-w-7xl mx-auto p-6">
            <div className="space-y-2.5 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Borrow History</h1>
                <p className="text-muted-foreground">View and manage your borrowing sessions</p>
            </div>

            <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search by ID, subject, or lecturer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active" className="space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Active</span>
                    </TabsTrigger>
                    <TabsTrigger value="returned" className="space-x-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Returned</span>
                    </TabsTrigger>
                    <TabsTrigger value="overdue" className="space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Overdue</span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="space-y-4">
                    {activeLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filterReceipts(activeReceipts)?.length === 0 ? (
                        <Card className="p-8 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-semibold">No active borrows</p>
                            <p className="text-muted-foreground">All your items have been returned</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filterReceipts(activeReceipts)?.map((receipt) => (
                                <ReceiptCard
                                    key={receipt.$id}
                                    receipt={receipt}
                                    selectedReceipt={selectedReceipt}
                                    onSelect={() => setSelectedReceipt(receipt)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="returned" className="space-y-4">
                    {/* Similar structure as active tab */}
                    {returnedLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filterReceipts(returnedReceipts)?.length === 0 ? (
                        <Card className="p-8 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-semibold">No return history</p>
                            <p className="text-muted-foreground">You haven&apos;t returned any items yet</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filterReceipts(returnedReceipts)?.map((receipt) => (
                                <ReceiptCard
                                    key={receipt.$id}
                                    receipt={receipt}
                                    selectedReceipt={selectedReceipt}
                                    onSelect={() => setSelectedReceipt(receipt)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
                
                <TabsContent value="overdue" className="space-y-4">
                    {overdueLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filterReceipts(overdueReceipts)?.length === 0 ? (
                        <Card className="p-8 text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold">No overdue items</p>
                            <p className="text-muted-foreground">All your active borrows are within the due date</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filterReceipts(overdueReceipts)?.map((receipt) => (
                                <ReceiptCard
                                    key={receipt.$id}
                                    receipt={receipt}
                                    selectedReceipt={selectedReceipt}
                                    onSelect={() => setSelectedReceipt(receipt)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <ReceiptDetailsDialog
                receipt={selectedReceipt}
                items={receiptItems}
                onClose={() => setSelectedReceipt(null)}
                loading={!!selectedReceipt && receiptItems.length === 0}
            />
        </div>
    );
}
