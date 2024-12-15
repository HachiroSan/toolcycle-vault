import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
// import auth from "@/auth";
import { toast } from 'sonner';
import { createSession } from '@/actions/auth';
import { useUser } from '@/hooks/useUser';
import { isRedirectError } from 'next/dist/client/components/redirect';

const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string(),
});

const LoginForm = () => {
    const { refresh } = useUser();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: { email: string; password: string }) => {
        try {
            toast.loading('Signing in...', { id: 'login' });
            await createSession(values);
        } catch (error) {
            if (isRedirectError(error)) {
                toast.success('Signed in successfully.', { id: 'login' });
                refresh();
                return;
            }
            form.setError('root', {
                type: 'manual',
                message: error instanceof Error ? error.message : 'Failed to sign in.',
            });
            toast.error(error.message, { id: 'login' });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {form.formState.errors.root && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {form.formState.errors.root.message}
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input autoComplete="email" placeholder="Enter your email" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Sign In</Button>
            </form>
        </Form>
    );
};

export default LoginForm;
