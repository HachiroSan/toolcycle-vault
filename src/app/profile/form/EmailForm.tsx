'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateEmail } from '@/actions/auth';
import { toast } from 'sonner';
import { useState } from 'react';

const formSchema = z.object({
    newEmail: z.string().email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(8, {
        message: 'Password must be at least 8 characters.',
    }),
});

type FormValues = z.infer<typeof formSchema>;

const ChangeEmailForm = ({ currentEmail, onSuccess }: { currentEmail: string; onSuccess?: () => void }) => {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newEmail: '',
            password: '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);

        toast.promise(updateEmail(values.password, values.newEmail), {
            loading: 'Changing email...',
            success: (response) => {
                if (response.success) {
                    form.reset();
                    onSuccess?.();
                    return 'Email changed successfully';
                }
                throw new Error(response.message);
            },
            error: (err) => err.message || 'Failed to change email',
            finally: () => setIsLoading(false),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                    <FormLabel>Current Email</FormLabel>
                    <FormControl>
                        <Input type="email" value={currentEmail} disabled />
                    </FormControl>
                </FormItem>

                <FormField
                    control={form.control}
                    name="newEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="Enter new email" {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="Enter current password"
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Changing...' : 'Change Email'}
                </Button>
            </form>
        </Form>
    );
};

export default ChangeEmailForm;
