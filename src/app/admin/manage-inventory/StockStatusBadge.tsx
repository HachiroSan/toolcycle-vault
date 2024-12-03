import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface StockStatusBadgeProps {
    availableQuantity: number;
}

export function StockStatusBadge({ availableQuantity }: StockStatusBadgeProps) {
    let status: 'In Stock' | 'Low' | 'Out';
    let variant: 'default' | 'warning' | 'destructive' | 'success';

    if (availableQuantity > 10) {
        status = 'In Stock';
        variant = 'success';
    } else if (availableQuantity > 0) {
        status = 'Low';
        variant = 'warning';
    } else {
        status = 'Out';
        variant = 'destructive';
    }

    return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Badge variant={variant}>{status}</Badge>
        </motion.div>
    );
}
