import { Button } from '@/components/ui/button';

interface InventoryTableFooterProps {
    page: number;
    setPage: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export function InventoryTableFooter({ page, setPage, totalItems, itemsPerPage }: InventoryTableFooterProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="flex justify-between items-center mt-4 text-sm">
            <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
                Previous
            </Button>
            <span>
                Page {page} of {totalPages}
            </span>
            <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                Next
            </Button>
        </div>
    );
}
