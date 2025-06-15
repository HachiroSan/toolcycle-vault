import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Package2, TagIcon, Info, Box, Building2, Paintbrush, RulerIcon } from 'lucide-react';

export function TableSkeleton() {
    return (
        <div className="rounded-lg border bg-card mt-5">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableCell className="w-[40px] text-center">
                            <Skeleton className="h-4 w-4 mx-auto rounded" />
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Package2 className="h-4 w-4 text-muted-foreground/70" />
                                <span className="text-muted-foreground/70">Item</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <TagIcon className="h-4 w-4 text-muted-foreground/70" />
                                <span className="text-muted-foreground/70">Type</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Building2 className="h-4 w-4 text-muted-foreground/70" />
                                <span className="text-muted-foreground/70">Diameter</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Paintbrush className="h-4 w-4 text-muted-foreground/70" />
                                <span className="text-muted-foreground/70">Coating</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <RulerIcon className="h-4 w-4 text-muted-foreground/70" />
                                <span className="text-muted-foreground/70">Flute</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Info className="h-4 w-4 text-muted-foreground/70" />
                                <span className="text-muted-foreground/70">Description</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Box className="h-4 w-4 text-muted-foreground/70" />
                                <span className="text-muted-foreground/70">Stock</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <span className="text-muted-foreground/70">Actions</span>
                        </TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, index) => (
                        <TableRow key={index} className="group animate-pulse">
                            <TableCell className="w-[40px] text-center">
                                <Skeleton className="h-4 w-4 mx-auto rounded" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="h-4 w-28 mx-auto rounded" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="h-4 w-24 mx-auto rounded" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="h-4 w-20 mx-auto rounded" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="h-4 w-16 mx-auto rounded" />
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex flex-col space-y-1">
                                    <Skeleton className="h-3 w-32 mx-auto rounded" />
                                    <Skeleton className="h-3 w-24 mx-auto rounded" />
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center space-x-3">
                                    <div className="relative w-12 h-12">
                                        <Skeleton className="absolute inset-0 rounded-full" />
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <Skeleton className="h-4 w-12 rounded" />
                                        <Skeleton className="h-3 w-16 rounded" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
