'use server';

import { cookies } from 'next/headers';
import { Query, Databases, Account } from 'node-appwrite';
import { createSessionClient } from '@/lib/appwrite/config';
import { BorrowReceipt } from '@/data/borrow.type';

// Helper function to handle unauthorized cases
function handleUnauthorized() {
    return { success: false, message: 'Unauthorized', data: undefined };
}

async function getSessionDatabases(): Promise<{ databases: Databases; account: Account } | null> {
    const sessionCookie = await cookies();
    const cookieStore = sessionCookie.get('session');
    if (!cookieStore) return null;
    return createSessionClient(cookieStore.value);
}

export async function getUserReceiptSummary() {
    const client = await getSessionDatabases();
    if (!client) return handleUnauthorized();

    const { account, databases } = client;
    const user = await account.get();

    try {
        const receipts = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!,
            [Query.equal('userId', user.$id)]
        );

        const now = new Date();

        const summary = {
            totalBorrowedItems: 0,
            totalReturnedItems: 0,
            activeBorrowReceipts: 0,
            returnedReceipts: 0,
            overdueReceipts: 0,
            nearestDueDate: null as string | null,
            nearestDueReceipt: null as BorrowReceipt | null,
        };

        // Get active receipts and sort by due date
        const activeReceipts = receipts.documents
            .filter((receipt) => receipt.status === 'active' && new Date(receipt.dueDate) >= now)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        // Set nearest due date if there are active receipts
        if (activeReceipts.length > 0) {
            summary.nearestDueDate = activeReceipts[0].dueDate;
            summary.nearestDueReceipt = activeReceipts[0] as BorrowReceipt;
        }

        // Calculate other metrics
        receipts.documents.forEach((receipt) => {
            const itemCount = receipt.item_ids.length;

            if (receipt.status === 'active') {
                summary.totalBorrowedItems += itemCount;
                summary.activeBorrowReceipts++;

                if (new Date(receipt.dueDate) < now) {
                    summary.overdueReceipts++;
                }
            } else if (receipt.status === 'returned') {
                summary.totalReturnedItems += itemCount;
                summary.returnedReceipts++;
            }
        });

        return {
            success: true,
            data: summary,
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch receipt summary',
        };
    }
}
