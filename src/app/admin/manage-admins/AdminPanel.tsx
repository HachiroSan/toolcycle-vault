'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, UserPlus, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import AddAdminDialog from './AddAdminDialog';
import { EditAdminDialog } from './EditAdminDialog';
import { deleteAdmin, getAdmins } from '@/actions/admin';
import RoleBadge from '@/components/shared/RoleBadge';
import { DeleteDialog } from './DeleteDialog';
import { CldImage } from 'next-cloudinary';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PromoteAdminDialog } from './PromoteAdminDialog';

export type User = {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin' | 'superadmin';
    prefs?: {
        avatar_img_url?: string;
    };
};

const TableSkeleton = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell>
                        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                    </TableCell>
                    <TableCell>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const AdminTable = ({
    admins,
    onEdit,
    onDelete,
}: {
    admins: User[];
    onEdit: (admin: User) => void;
    onDelete: (admin: User) => void;
}) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <AnimatePresence>
                {admins.map((admin) => (
                    <motion.tr
                        key={admin.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TableCell>
                            <Avatar className="h-8 w-8">
                                {admin.prefs?.avatar_img_url ? (
                                    <CldImage
                                        src={admin.prefs.avatar_img_url}
                                        width={32}
                                        height={32}
                                        alt={admin.name}
                                        crop="fill"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <AvatarFallback>{admin.name?.charAt(0) || '?'}</AvatarFallback>
                                )}
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                            <RoleBadge role={admin.role} />
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="icon" onClick={() => onEdit(admin)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => onDelete(admin)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </TableCell>
                    </motion.tr>
                ))}
            </AnimatePresence>
        </TableBody>
    </Table>
);

export default function AdminPanel() {
    const [admins, setAdmins] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);

    const fetchAdmins = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await getAdmins();
            if (response.success && response.data) {
                const mappedAdmins: User[] = response.data.users.map((user) => ({
                    id: user.$id,
                    name: user.name,
                    email: user.email,
                    role: user.labels[0] as 'admin' | 'superadmin',
                    prefs: user.prefs,
                }));
                setAdmins(mappedAdmins);
            } else {
                setError(response.message || 'Failed to fetch admins');
            }
        } catch {
            setError('Failed to fetch admins');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const handleDeleteConfirm = useCallback(() => {
        if (!currentAdmin) return;

        setIsDeleteDialogOpen(false);
        toast.promise(deleteAdmin(currentAdmin.id), {
            loading: 'Deleting admin...',
            success: (response) => {
                if (response.success) {
                    setAdmins((prev) => prev.filter((admin) => admin.id !== currentAdmin.id));
                    setCurrentAdmin(null);
                    return 'Admin deleted successfully';
                }
                throw new Error(response.message);
            },
            error: (err) => `Failed to delete admin: ${err.message}`,
            finally: () => setCurrentAdmin(null),
        });
    }, [currentAdmin]);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Admin Management</CardTitle>
                    <CardDescription>Manage your administrators</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end items-center mb-6 gap-2">
                        <Button onClick={fetchAdmins} variant="outline" size="sm" className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={() => setIsPromoteDialogOpen(true)}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Promote User
                        </Button>
                        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add New Admin
                        </Button>
                    </div>

                    {error ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-500 p-4 bg-red-50 rounded-md mb-4"
                        >
                            Error: {error}
                        </motion.div>
                    ) : isLoading ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <TableSkeleton />
                        </motion.div>
                    ) : (
                        <AdminTable
                            admins={admins}
                            onEdit={(admin) => {
                                setCurrentAdmin(admin);
                                setIsEditDialogOpen(true);
                            }}
                            onDelete={(admin) => {
                                setCurrentAdmin(admin);
                                setIsDeleteDialogOpen(true);
                            }}
                        />
                    )}

                    <AddAdminDialog
                        isOpen={isAddDialogOpen}
                        onClose={() => setIsAddDialogOpen(false)}
                        onSuccess={fetchAdmins}
                    />

                    <PromoteAdminDialog
                        isOpen={isPromoteDialogOpen}
                        onClose={() => setIsPromoteDialogOpen(false)}
                        onSuccess={fetchAdmins}
                    />

                    {currentAdmin && (
                        <>
                            <EditAdminDialog
                                isOpen={isEditDialogOpen}
                                onClose={() => setIsEditDialogOpen(false)}
                                onSuccess={fetchAdmins}
                                admin={currentAdmin}
                            />

                            <DeleteDialog
                                isOpen={isDeleteDialogOpen}
                                onClose={() => setIsDeleteDialogOpen(false)}
                                admin={currentAdmin}
                                onConfirm={handleDeleteConfirm}
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
