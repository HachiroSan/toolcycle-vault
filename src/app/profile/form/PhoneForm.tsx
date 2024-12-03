'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { updatePhone } from '@/actions/auth';
import { toast } from 'sonner';

const formSchema = z.object({
    phoneNumber: z
        .string()
        .min(10, { message: 'Phone number must be at least 10 digits' })
        .max(15, { message: 'Phone number cannot exceed 15 digits' })
        .regex(/^\+[0-9\-\s()]*$/, {
            message: 'Phone number must start with + and contain only numbers, spaces, or (-)()',
        }),
    password: z.string().min(8, {
        message: 'Password must be at least 8 characters.',
    }),
});

type FormValues = z.infer<typeof formSchema>;

const ChangePhoneForm = ({ phone, onSuccess }: { phone: string; onSuccess?: () => void }) => {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            phoneNumber: '',
            password: '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);

        toast.promise(updatePhone(values.password, values.phoneNumber), {
            loading: 'Changing phone number...',
            success: (response) => {
                if (response.success) {
                    form.reset();
                    onSuccess?.();
                    return 'Phone number changed successfully';
                }
                throw new Error(response.message);
            },
            error: (err) => err.message || 'Failed to change phone number',
            finally: () => setIsLoading(false),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                    <FormLabel>Current Phone</FormLabel>
                    <FormControl>
                        <Input type="tel" value={phone || 'Not specified'} disabled />
                    </FormControl>
                </FormItem>

                <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Phone Number</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="Enter new phone number" {...field} />
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
                                <Input type="password" placeholder="Enter current password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Changing...' : 'Change Phone Number'}
                </Button>
            </form>
        </Form>
    );
};

export default ChangePhoneForm;
