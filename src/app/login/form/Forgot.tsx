'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { generateRecovery } from '@/actions/auth';
import { Response } from '@/data/response.type';

const formSchema = z.object({
    email: z.string().email({
        message: 'Please enter a valid email address.',
    }),
});

export default function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            toast.promise(generateRecovery(values.email), {
                loading: 'Sending reset link...',
                success: (response: Response) => {
                    if (response.success) {
                        form.reset();
                        return 'Reset link sent successfully. The link will expire in 1 hour.';
                    } else {
                        form.setError('root', {
                            type: 'manual',
                            message: response.message,
                        });
                        throw new Error(response.message);
                    }
                },
                error: (err) => `Failed to send reset link: ${err.message}`,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
            </form>
        </Form>
    );
}
