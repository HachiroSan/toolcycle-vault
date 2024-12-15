'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Calendar, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as TooltipChart,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { getReceiptsSummary } from '@/actions/admin-dashboard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllUserReceipts } from '@/actions/admin-dashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CldImage } from 'next-cloudinary';

export default function DashboardPanel() {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [timeframe, setTimeframe] = useState('monthly');
    const [chartType, setChartType] = useState('line');

    interface Receipt {
        receipt: {
            $id: string;
            item_quantities: number[];
            dueDate: string;
            status: string;
            $createdAt: string;
        };
        user: {
            name: string;
            email: string;
        };
        month: string;
    }

    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoadingReceipts, setIsLoadingReceipts] = useState(true);

    interface AggregatedStats {
        label: string;
        activeReceipts: number;
        returnedReceipts: number;
        overdueReceipts: number;
    }

    const fetchReceipts = async () => {
        try {
            const response = await getAllUserReceipts();
            if (response.success && response.data) {
                setReceipts(response.data.receipts);
            }
        } catch (error) {
            console.error('Failed to fetch receipts:', error);
        } finally {
            setIsLoadingReceipts(false);
        }
    };

    // Simulated data aggregation based on timeframe
    const aggregateData = (data: { monthlyStats: AggregatedStats[] }, timeframe: string): AggregatedStats[] => {
        if (!data?.monthlyStats) return [];

        const stats = [...data.monthlyStats];
        const currentDate = new Date();

        switch (timeframe) {
            case 'daily':
                // Take only the last 14 days for better visualization
                const daysToShow = 14;
                const lastMonth = stats[stats.length - 1];
                const dailyActive = Math.round(lastMonth.activeReceipts / 30);
                const dailyReturned = Math.round(lastMonth.returnedReceipts / 30);
                const dailyOverdue = Math.round(lastMonth.overdueReceipts / 30);

                return Array.from({ length: daysToShow }, (_, i) => {
                    const date = new Date();
                    date.setDate(currentDate.getDate() - (daysToShow - 1 - i));
                    return {
                        label: date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                        }),
                        activeReceipts: dailyActive + Math.floor(Math.random() * 5),
                        returnedReceipts: dailyReturned + Math.floor(Math.random() * 5),
                        overdueReceipts: dailyOverdue + Math.floor(Math.random() * 2),
                        fullDate: date,
                    };
                });

            case 'weekly':
                // Show last 12 weeks
                const weeksToShow = 12;
                return Array.from({ length: weeksToShow }, (_, i) => {
                    const date = new Date();
                    date.setDate(currentDate.getDate() - (weeksToShow - 1 - i) * 7);
                    const weekNumber = Math.ceil(date.getDate() / 7);
                    return {
                        label: `${date.toLocaleDateString('en-US', {
                            month: 'short',
                        })} W${weekNumber}`,
                        activeReceipts: Math.round(stats[stats.length - 1].activeReceipts / 4),
                        returnedReceipts: Math.round(stats[stats.length - 1].returnedReceipts / 4),
                        overdueReceipts: Math.round(stats[stats.length - 1].overdueReceipts / 4),
                        fullDate: date,
                    };
                });

            case 'monthly':
                // Format monthly data with better labels
                return stats.map((month) => ({
                    label: new Date(month + ' 1, 2024').toLocaleDateString('en-US', {
                        month: 'short',
                        year: '2-digit',
                    }),
                    activeReceipts: month.activeReceipts,
                    returnedReceipts: month.returnedReceipts,
                    overdueReceipts: month.overdueReceipts,
                }));

            case 'quarterly':
                // Group into quarters with better formatting
                const quarters: AggregatedStats[] = [];
                for (let i = 0; i < stats.length; i += 3) {
                    const quarterStats = stats.slice(i, i + 3).reduce(
                        (acc, curr) => ({
                            activeReceipts: acc.activeReceipts + curr.activeReceipts,
                            returnedReceipts: acc.returnedReceipts + curr.returnedReceipts,
                            overdueReceipts: acc.overdueReceipts + curr.overdueReceipts,
                        }),
                        { activeReceipts: 0, returnedReceipts: 0, overdueReceipts: 0 }
                    );

                    const quarterDate = new Date(stats[i] + ' 1, 2024');
                    quarters.push({
                        label: `Q${Math.floor(i / 3) + 1} ${quarterDate.getFullYear()}`,
                        ...quarterStats,
                    });
                }
                return quarters;

            case 'yearly':
                return [
                    {
                        label: new Date().getFullYear().toString(),
                        ...stats.reduce(
                            (acc, curr) => ({
                                activeReceipts: acc.activeReceipts + curr.activeReceipts,
                                returnedReceipts: acc.returnedReceipts + curr.returnedReceipts,
                                overdueReceipts: acc.overdueReceipts + curr.overdueReceipts,
                            }),
                            { activeReceipts: 0, returnedReceipts: 0, overdueReceipts: 0 }
                        ),
                    },
                ];

            default:
                return stats;
        }
    };

    // Function to determine X-axis tick interval based on timeframe
    const getTickInterval = (timeframe: string, dataLength: number): number => {
        switch (timeframe) {
            case 'daily':
                return Math.ceil(dataLength / 7) - 1; // Show ~7 ticks
            case 'weekly':
                return Math.ceil(dataLength / 6) - 1; // Show ~6 ticks
            case 'monthly':
                return Math.ceil(dataLength / 12) - 1; // Show up to 12 months
            case 'quarterly':
                return 0; // Show all quarters
            case 'yearly':
                return 0; // Show all years
            default:
                return 0;
        }
    };

    const fetchSummary = async () => {
        setIsRefreshing(true);
        setIsLoading(true);
        try {
            const response = await getReceiptsSummary();
            if (response.success && response.data) {
                setSummary(response.data);
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
        fetchReceipts();
    }, []);

    const calculateTrend = (current, previous) => {
        if (!previous) return { trend: 0, isIncrease: false };
        const trend = ((current - previous) / previous) * 100;
        return { trend: Math.abs(trend).toFixed(1), isIncrease: trend > 0 };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Receipts',
            value: summary?.totalStats.totalReceipts,
            subValue: `${summary?.totalStats.totalBorrowedItems} items borrowed`,
            trend: calculateTrend(summary?.totalStats.totalReceipts, summary?.totalStats.totalReceipts - 10),
            color: 'blue',
        },
        {
            title: 'Active Receipts',
            value: summary?.totalStats.activeReceipts,
            subValue: 'Currently borrowed items',
            trend: calculateTrend(summary?.totalStats.activeReceipts, summary?.totalStats.activeReceipts - 5),
            icon: Calendar,
            color: 'green',
        },
        {
            title: 'Returned Items',
            value: summary?.totalStats.totalReturnedItems,
            subValue: 'Successfully returned',
            trend: calculateTrend(summary?.totalStats.totalReturnedItems, summary?.totalStats.totalReturnedItems - 8),
            color: 'indigo',
        },
        {
            title: 'Overdue Items',
            value: summary?.totalStats.overdueReceipts,
            subValue: 'Need attention',
            trend: calculateTrend(summary?.totalStats.overdueReceipts, summary?.totalStats.overdueReceipts - 2),
            icon: AlertCircle,
            isAlert: true,
            color: 'red',
        },
    ];

    return (
        <div className="space-y-6 p-6 bg-gray-50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Track your inventory and borrowing trends</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSummary}
                    disabled={isRefreshing}
                    className="gap-2 hover:bg-gray-100"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card
                            className={`
              hover:shadow-lg transition-all duration-300
              ${stat.isAlert && stat.value > 0 ? 'border-red-200 bg-red-50' : ''}
            `}
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                {stat.icon && <stat.icon className={`h-4 w-4 text-${stat.color}-500`} />}
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
                                    </div>
                                    {stat.trend && (
                                        <div
                                            className={`flex items-center text-sm ${
                                                stat.trend.isIncrease ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {stat.trend.isIncrease ? (
                                                <ArrowUpRight className="h-4 w-4" />
                                            ) : (
                                                <ArrowDownRight className="h-4 w-4" />
                                            )}
                                            <span className="ml-1">{stat.trend.trend}%</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Chart Section */}
            <Card className="mt-6">
                <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Borrowing Trends
                        </CardTitle>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={timeframe} onValueChange={setTimeframe}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                        <Tabs value={chartType} onValueChange={setChartType} className="w-[200px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="line">Line</TabsTrigger>
                                <TabsTrigger value="area">Area</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'line' ? (
                                <LineChart data={aggregateData(summary, timeframe)}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                                    <XAxis
                                        dataKey="label"
                                        interval={getTickInterval(timeframe, aggregateData(summary, timeframe).length)}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tick={{ fill: '#666', fontSize: 12 }}
                                        padding={{ left: 10, right: 10 }}
                                    />
                                    <YAxis tick={{ fill: '#666', fontSize: 12 }} width={50} />
                                    <TooltipChart
                                        formatter={(value) => [value, 'Items']}
                                        labelFormatter={(label) => `Period: ${label}`}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            padding: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="activeReceipts"
                                        stroke="#2563eb"
                                        name="Active"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="returnedReceipts"
                                        stroke="#16a34a"
                                        name="Returned"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="overdueReceipts"
                                        stroke="#dc2626"
                                        name="Overdue"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            ) : (
                                <AreaChart data={aggregateData(summary, timeframe)}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                                    <XAxis
                                        dataKey="label"
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tick={{ fill: '#666', fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                                    <TooltipChart
                                        formatter={(value) => [value, 'Items']}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="activeReceipts"
                                        stroke="#2563eb"
                                        fill="#2563eb"
                                        fillOpacity={0.1}
                                        name="Active"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="returnedReceipts"
                                        stroke="#16a34a"
                                        fill="#16a34a"
                                        fillOpacity={0.1}
                                        name="Returned"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="overdueReceipts"
                                        stroke="#dc2626"
                                        fill="#dc2626"
                                        fillOpacity={0.1}
                                        name="Overdue"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
            {/* Recent Borrows Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Borrows</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingReceipts ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Receipt ID</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {receipts.map((receipt) => (
                                        <TableRow
                                            key={receipt.receipt.$id}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => window.open(`/return/${receipt.receipt.$id}`, '_blank')}
                                        >
                                            <TableCell className="font-medium">
                                                {receipt.receipt.$id.toUpperCase()}
                                            </TableCell>
                                            <TableCell>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Avatar className="h-8 w-8">
                                                                {receipt.user.prefs?.avatar_img_url ? (
                                                                    <CldImage
                                                                        src={receipt.user.prefs?.avatar_img_url}
                                                                        width={32}
                                                                        height={32}
                                                                        alt={receipt.user.name || ''}
                                                                        crop="fill"
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <AvatarFallback>
                                                                        {receipt.user.name
                                                                            ?.split(' ')
                                                                            .map((n) => n[0])
                                                                            .slice(0, 2)
                                                                            .join('')
                                                                            .toUpperCase()}
                                                                    </AvatarFallback>
                                                                )}
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="p-2 bg-background shadow-lg rounded-lg border">
                                                            <div className="font-medium text-foreground">
                                                                {receipt.user.name}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {receipt.user.email}
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell>
                                                {receipt.receipt.item_quantities.reduce(
                                                    (a: number, b: number) => a + b,
                                                    0
                                                )}{' '}
                                                items
                                            </TableCell>
                                            <TableCell>
                                                {new Date(receipt.receipt.dueDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${
                                            receipt.receipt.status === 'active'
                                                ? 'bg-blue-100 text-blue-800'
                                                : receipt.receipt.status === 'returned'
                                                  ? 'bg-green-100 text-green-800'
                                                  : 'bg-red-100 text-red-800'
                                        }`}
                                                >
                                                    {receipt.receipt.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(receipt.receipt.$createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
