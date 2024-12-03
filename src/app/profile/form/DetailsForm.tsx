'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateName, updatePrefs } from '@/actions/auth';

const editDetailsSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    program: z.string().optional(),
    studentId: z.string().optional(),
});

type EditDetailsFormData = z.infer<typeof editDetailsSchema>;

interface UserDetails {
    name?: string;
    program?: string;
    studentId?: string;
}

interface EditDetailsFormProps {
    userDetails?: UserDetails;
    onSuccess?: () => void;
}

const EditDetailsForm: React.FC<EditDetailsFormProps> = ({ userDetails = {} as UserDetails, onSuccess }) => {
    const form = useForm<EditDetailsFormData>({
        resolver: zodResolver(editDetailsSchema),
        defaultValues: {
            name: userDetails?.name ?? '',
            program: userDetails?.program ?? '',
            studentId: userDetails?.studentId ?? '',
        },
    });

    const hasFormChanges = () => {
        const formValues = form.getValues();
        return (
            formValues.name !== (userDetails?.name ?? '') ||
            formValues.program !== (userDetails?.program ?? '') ||
            formValues.studentId !== (userDetails?.studentId ?? '')
        );
    };

    const onSubmit = async (values: EditDetailsFormData) => {
        try {
            // Handle name update
            if (values.name !== userDetails?.name) {
                toast.promise(updateName(values.name), {
                    loading: 'Updating name...',
                    success: () => {
                        onSuccess?.();
                        return 'Name updated successfully';
                    },
                    error: (err) => err.message || 'Failed to update name',
                });
            }

            // Handle program and studentId updates
            const prefUpdates: Record<string, string> = {};
            if (values.program !== userDetails?.program) {
                prefUpdates.program = values.program ?? '';
            }
            if (values.studentId !== userDetails?.studentId) {
                prefUpdates.studentId = values.studentId ?? '';
            }

            if (Object.keys(prefUpdates).length > 0) {
                toast.promise(updatePrefs(prefUpdates), {
                    loading: 'Updating preferences...',
                    success: () => {
                        onSuccess?.();
                        return 'Preferences updated successfully';
                    },
                    error: (err) => err.message || 'Failed to update preferences',
                });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update profile');
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Add your name" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Student ID</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Add your student ID" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="program"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Program</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Add your program" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={!hasFormChanges()}>
                    Update Profile
                </Button>
            </form>
        </Form>
    );
};

export default EditDetailsForm;
