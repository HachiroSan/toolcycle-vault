import { Button } from '@/components/ui/button';

interface BorrowTableFooterProps {
    page: number;
    setPage: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    isLoading?: boolean;
}

export function BorrowTableFooter({ page, setPage, totalItems, itemsPerPage, isLoading }: BorrowTableFooterProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="flex justify-between items-center mt-6 text-sm">
            <div className="text-muted-foreground">
                Showing {Math.min((page - 1) * itemsPerPage + 1, totalItems)} to{' '}
                {Math.min(page * itemsPerPage, totalItems)} of {totalItems} items
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    onClick={() => setPage(page - 1)} 
                    disabled={page === 1 || isLoading}
                    size="sm"
                >
                    Previous
                </Button>
                <span className="text-muted-foreground px-2">
                    Page {page} of {totalPages}
                </span>
                <Button 
                    variant="outline" 
                    onClick={() => setPage(page + 1)} 
                    disabled={page === totalPages || isLoading}
                    size="sm"
                >
                    Next
                </Button>
            </div>
        </div>
    );
} 