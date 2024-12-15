'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserReceiptSummary } from '@/actions/user-dashboard';
import { Calendar, Package2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { CldImage } from 'next-cloudinary';
import { BorrowReceipt } from '@/data/borrow.type';

interface ReceiptSummary {
    totalBorrowedItems: number;
    totalReturnedItems: number;
    activeBorrowReceipts: number;
    returnedReceipts: number;
    overdueReceipts: number;
    nearestDueDate: string | null;
    nearestDueReceipt: BorrowReceipt | null;
}

export default function DashboardPanel() {
    const [summary, setSummary] = useState<ReceiptSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { user } = useUser();

    const fetchSummary = async () => {
        setIsRefreshing(true);
        try {
            const response = await getUserReceiptSummary();
            if (response.success) {
                setSummary(response.data!);
            }
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with refresh button */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
                <Button variant="outline" size="sm" onClick={fetchSummary} disabled={isRefreshing} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <Card>
                    <CardContent className="flex items-center gap-6 py-4">
                        <Avatar className="h-12 w-12">
                            {user?.prefs?.avatar_img_url ? (
                                <CldImage
                                    src={user.prefs.avatar_img_url}
                                    width={48}
                                    height={48}
                                    crop="fill"
                                    gravity="face"
                                    alt={'User'}
                                    className="h-full w-full object-cover"
                                    loading="eager"
                                    priority
                                />
                            ) : (
                                <AvatarImage src="/avatar-placeholder.png" alt={'User'} />
                            )}
                            <AvatarFallback>
                                <User className="h-6 w-6" />
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <h3 className="font-semibold">Welcome back, {user?.name || 'User'}!</h3>
                            <p className="text-sm text-muted-foreground">
                                Member since {format(new Date(user?.$createdAt || Date.now()), 'MMMM yyyy')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Borrows</CardTitle>
                            <Package2 className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary?.activeBorrowReceipts || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary?.totalBorrowedItems || 0} items currently borrowed
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Returned Items</CardTitle>
                            <RefreshCw className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary?.returnedReceipts || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary?.totalReturnedItems || 0} items returned successfully
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Next Due Date</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary?.nearestDueDate
                                    ? format(new Date(summary.nearestDueDate), 'MMM dd')
                                    : 'No due dates'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary?.nearestDueDate
                                    ? format(new Date(summary.nearestDueDate), 'EEEE, MMMM dd, yyyy')
                                    : 'All items returned'}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card
                        className={`hover:shadow-md transition-shadow ${
                            summary?.overdueReceipts ? 'border-red-200 bg-red-50' : ''
                        }`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Items</CardTitle>
                            <AlertCircle
                                className={`h-4 w-4 ${
                                    summary?.overdueReceipts ? 'text-red-500' : 'text-muted-foreground'
                                }`}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary?.overdueReceipts || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary?.overdueReceipts ? 'Action required: Items overdue' : 'No overdue items'}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
