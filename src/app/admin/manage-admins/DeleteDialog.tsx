import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from './AdminPanel';

type DeleteDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    admin: User | null;
    onConfirm: () => void;
};

export const DeleteDialog = ({ isOpen, onClose, admin, onConfirm }: DeleteDialogProps) => (
    <AnimatePresence>
        {isOpen && (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <DialogHeader>
                            <DialogTitle>Delete Admin</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {admin?.name}? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2 mt-4">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={onConfirm}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </motion.div>
                </DialogContent>
            </Dialog>
        )}
    </AnimatePresence>
);
