import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { createAdmin } from '@/actions/admin';

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    role: z.enum(['admin', 'superadmin']),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddAdminDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddAdminDialog({ isOpen, onClose, onSuccess }: AddAdminDialogProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            role: 'admin',
            password: '',
        },
    });

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let generatedPassword = '';
        for (let i = 0; i < 12; i++) {
            generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        form.setValue('password', generatedPassword);
    };

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);

        toast.promise(
            createAdmin(values.role as 'admin' | 'superadmin', {
                name: values.name,
                email: values.email,
                password: values.password,
            }),
            {
                loading: 'Adding admin...',
                success: (response) => {
                    if (response.success) {
                        form.reset();
                        onSuccess?.();
                        onClose();
                        return 'Admin added successfully';
                    }
                    throw new Error(response.message);
                },
                error: (err) => `Failed to add admin: ${err.message}`,
                finally: () => {
                    setIsLoading(false);
                    form.reset();
                    onClose();
                },
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Add New Admin</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="w-full" autoComplete="off" />
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
                                        <Input type="email" {...field} className="w-full" autoComplete="off" />
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
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="superadmin">Super Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                {...field}
                                                className="w-full pr-24"
                                                autoComplete="off"
                                            />
                                            <div className="absolute right-0 top-0 flex h-full items-center space-x-1 pr-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </FormControl>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={generatePassword}
                                        className="mt-2"
                                    >
                                        Generate Strong Password
                                    </Button>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Alert variant="default" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please save this password now. If needed later, the user can reset it through the login
                                page&apos;s &quot;Forgot Password&quot; option.
                            </AlertDescription>
                        </Alert>

                        <DialogFooter className="mt-6">
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? 'Adding...' : 'Add Admin'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
