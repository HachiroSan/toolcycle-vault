'use server';

import { verifyAdmin } from './admin';
import { Query } from 'node-appwrite';
import { BorrowReceipt } from '@/data/borrow.type';
import { startOfMonth, endOfMonth, eachMonthOfInterval, format } from 'date-fns';
import { createAdminClient } from '@/lib/appwrite/config';

interface MonthlyStats {
    month: string;
    totalReceipts: number;
    activeReceipts: number;
    returnedReceipts: number;
    overdueReceipts: number;
}

interface ReceiptsSummaryResponse {
    success: boolean;
    message?: string;
    data?: {
        monthlyStats: MonthlyStats[];
        totalStats: {
            totalReceipts: number;
            activeReceipts: number;
            returnedReceipts: number;
            overdueReceipts: number;
            totalBorrowedItems: number;
            totalReturnedItems: number;
        };
    };
}

export async function getReceiptsSummary(): Promise<ReceiptsSummaryResponse> {
    try {
        // Verify admin access
        const currentUser = await verifyAdmin(['admin', 'superadmin']);
        if (!currentUser.isAdmin) {
            throw new Error('Unauthorized: Requires admin privileges');
        }

        const { databases } = await createAdminClient();

        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const receiptsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!;

        // Get all receipts from the last 6 months
        const sixMonthsAgo = startOfMonth(new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000));
        const now = new Date();

        const receipts = await databases.listDocuments<BorrowReceipt>(databaseId, receiptsCollectionId, [
            Query.greaterThan('$createdAt', sixMonthsAgo.toISOString()),
        ]);

        // Generate array of last 6 months
        const months = eachMonthOfInterval({
            start: sixMonthsAgo,
            end: now,
        });

        // Initialize monthly stats
        const monthlyStats: MonthlyStats[] = months.map((month) => ({
            month: format(month, 'MMM yyyy'),
            totalReceipts: 0,
            activeReceipts: 0,
            returnedReceipts: 0,
            overdueReceipts: 0,
        }));

        // Initialize total stats
        const totalStats = {
            totalReceipts: 0,
            activeReceipts: 0,
            returnedReceipts: 0,
            overdueReceipts: 0,
            totalBorrowedItems: 0,
            totalReturnedItems: 0,
        };

        // Process each receipt
        receipts.documents.forEach((receipt) => {
            // Update total stats
            totalStats.totalReceipts++;
            totalStats.totalBorrowedItems += receipt.item_quantities.reduce((sum, qty) => sum + qty, 0);

            if (receipt.status === 'active') {
                totalStats.activeReceipts++;
                if (new Date(receipt.dueDate) < now) {
                    totalStats.overdueReceipts++;
                }
            } else if (receipt.status === 'returned') {
                totalStats.returnedReceipts++;
                totalStats.totalReturnedItems += receipt.item_quantities.reduce((sum, qty) => sum + qty, 0);
            }

            // Find corresponding month and update monthly stats
            const receiptDate = new Date(receipt.$createdAt);
            const monthIndex = months.findIndex(
                (month) => receiptDate >= startOfMonth(month) && receiptDate <= endOfMonth(month)
            );

            if (monthIndex !== -1) {
                monthlyStats[monthIndex].totalReceipts++;
                if (receipt.status === 'active') {
                    monthlyStats[monthIndex].activeReceipts++;
                    if (new Date(receipt.dueDate) < now) {
                        monthlyStats[monthIndex].overdueReceipts++;
                    }
                } else if (receipt.status === 'returned') {
                    monthlyStats[monthIndex].returnedReceipts++;
                }
            }
        });

        return {
            success: true,
            data: {
                monthlyStats,
                totalStats,
            },
        };
    } catch (error) {
        console.error('Error in getReceiptsSummary:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch receipts summary',
        };
    }
}

export async function getAllUserReceipts(page: number = 1, limit: number = 10): Promise<UserReceiptsResponse> {
    try {
        // Verify admin access
        const currentUser = await verifyAdmin(['admin', 'superadmin']);
        if (!currentUser.isAdmin) {
            throw new Error('Unauthorized: Requires admin privileges');
        }

        const { databases, users } = await createAdminClient();

        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const receiptsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!;

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Fetch receipts with pagination
        const receiptsData = await databases.listDocuments<BorrowReceipt>(databaseId, receiptsCollectionId, [
            Query.orderDesc('$createdAt'),
            Query.limit(limit),
            Query.offset(offset),
        ]);

        // Fetch user data for each receipt
        const receiptPromises = receiptsData.documents.map(async (receipt) => {
            try {
                const userData = await users.get(receipt.userId);

                return {
                    receipt,
                    user: {
                        id: userData.$id,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        prefs: userData.prefs,
                    },
                };
            } catch (error) {
                console.error(`Failed to fetch user data for receipt ${receipt.$id}:`, error);
                // Return receipt with minimal user data if user fetch fails
                return {
                    receipt,
                    user: {
                        id: receipt.userId,
                        name: 'Unknown User',
                        email: 'N/A',
                        role: 'N/A',
                    },
                };
            }
        });

        const userReceipts = await Promise.all(receiptPromises);

        return {
            success: true,
            data: {
                receipts: userReceipts,
                total: receiptsData.total,
            },
        };
    } catch (error) {
        console.error('Error in getAllUserReceipts:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch user receipts',
        };
    }
}
