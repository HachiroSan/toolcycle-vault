import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

const TableSkeleton = () => {
    return (
        <Card className="w-full">
            <div className="p-6 space-y-4">
                {/* Header Skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-8 w-[200px]" />
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-10 w-72" /> {/* Search input */}
                        <Skeleton className="h-10 w-32" /> {/* Add button */}
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="rounded-md border">
                    {/* Table Header */}
                    <div className="p-4 bg-muted/50">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-[200px]" /> {/* Name */}
                            <Skeleton className="h-4 w-[150px]" /> {/* Category */}
                            <Skeleton className="h-4 w-[100px] ml-auto" /> {/* Quantity */}
                            <Skeleton className="h-4 w-[100px]" /> {/* Price */}
                            <Skeleton className="h-4 w-[80px]" /> {/* Actions */}
                        </div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.3,
                                    delay: i * 0.1,
                                    ease: 'easeOut',
                                }}
                                className="p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-4 w-[150px]" />
                                    <Skeleton className="h-4 w-[100px] ml-auto" />
                                    <Skeleton className="h-4 w-[100px]" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Pagination Skeleton */}
                <div className="flex items-center justify-between pt-4">
                    <Skeleton className="h-4 w-[200px]" /> {/* Items count */}
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" /> {/* Previous button */}
                        <Skeleton className="h-9 w-24" /> {/* Next button */}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TableSkeleton;
