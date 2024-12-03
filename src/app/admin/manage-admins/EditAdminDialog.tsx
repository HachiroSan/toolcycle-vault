import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { editAdmin } from '@/actions/admin';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['admin', 'superadmin', 'student']),
});

type FormValues = z.infer<typeof formSchema>;

type Admin = {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'superadmin';
};

type EditAdminDialogProps = {
    isOpen: boolean;
    onSuccess?: () => void;
    onClose: () => void;
    admin: Admin | null;
};

export function EditAdminDialog({ isOpen, onClose, onSuccess, admin }: EditAdminDialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            role: 'admin',
        },
    });

    const { watch, reset } = form;
    const formValues = watch();

    // Watch for changes and compare with initial values
    const hasChanges = useMemo(() => {
        if (!admin) return false;

        return formValues.name !== admin.name || formValues.email !== admin.email || formValues.role !== admin.role;
    }, [admin, formValues]);

    useEffect(() => {
        if (admin) {
            reset({
                name: admin.name,
                email: admin.email,
                role: admin.role,
            });
        }
    }, [admin, reset]);

    const handleEditAdmin = async (values: FormValues) => {
        if (!admin?.id || !hasChanges) return;

        // Create object with only changed values
        const changes: Partial<FormValues> = {};
        if (values.name !== admin.name) changes.name = values.name;
        if (values.email !== admin.email) changes.email = values.email;
        if (values.role !== admin.role) changes.role = values.role;

        toast.promise(
            editAdmin({
                userId: admin.id,
                ...changes,
            }),
            {
                loading: 'Saving changes...',
                success: (response) => {
                    if (response.success) {
                        onSuccess?.();
                        onClose();
                        return 'Admin user updated successfully';
                    } else {
                        throw new Error(response.message);
                    }
                },
                error: (error) => {
                    return `Failed to update admin user: ${error.message}`;
                },
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Admin User</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleEditAdmin)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="superadmin">Super Admin</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="student">(Remove Admin Privilege)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!hasChanges}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
