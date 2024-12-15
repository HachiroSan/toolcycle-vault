import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createItem } from '@/actions/inventory';

// Define available types as a const array for type safety and reusability
const ITEM_TYPES = ['turning', 'milling', 'other'] as const;
type ItemType = (typeof ITEM_TYPES)[number];

// Improved schema with better validation logic
const inventoryFormSchema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        type: z.enum(['turning', 'milling', 'other'] as const),
        customType: z.string().optional(),
        size: z.string().optional(),
        length: z.coerce
            .number()
            .min(0, 'Length must be positive')
            .max(100, 'Length must not exceed 100cm')
            .optional()
            .nullable()
            .transform((val) => (val === null ? undefined : val)),
        brand: z.string().optional(),
        coating: z.string().optional(),
        material: z.string().optional(),
        description: z.string().optional(),
        total_quantity: z.coerce
            .number()
            .min(1, 'Quantity must be at least 1')
            .transform((val) => Math.max(1, val)), // Ensure minimum of 1
    })
    .superRefine((data, ctx) => {
        if (data.type === 'other' && (!data.customType || data.customType.length < 2)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Type is required',
                path: ['customType'],
            });
        }
    });

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

interface AddInventoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddInventoryDialog({ isOpen, onClose }: AddInventoryDialogProps) {
    const queryClient = useQueryClient();
    const form = useForm<InventoryFormValues>({
        resolver: zodResolver(inventoryFormSchema),
        defaultValues: {
            name: '',
            type: 'turning', // Set a default type
            customType: '',
            size: '',
            length: undefined,
            brand: '',
            coating: '',
            material: '',
            description: '',
            total_quantity: 1,
        },
        mode: 'onChange', // Enable real-time validation
    });

    const {
        watch,
        formState: { isValid, isSubmitting, isDirty },
    } = form;
    const selectedType = watch('type');

    const mutation = useMutation({
        mutationFn: async (values: InventoryFormValues) => {
            const finalValues = {
                ...values,
                type: values.type === 'other' ? values.customType! : values.type,
            };

            (Object.keys(finalValues) as Array<keyof InventoryFormValues>).forEach((key) => {
                if (finalValues[key] === undefined || key === 'customType') {
                    delete finalValues[key];
                }
            });

            return toast.promise(createItem(finalValues), {
                loading: 'Creating item...',
                success: (response) => {
                    if (response.success) {
                        queryClient.invalidateQueries({ queryKey: ['inventory'] });
                        form.reset();
                        onClose();
                        return 'Item created successfully';
                    }
                    throw new Error(response.message || 'Failed to create item');
                },
                error: (error: Error) => {
                    console.error(error);
                    return error.message || 'Failed to create item';
                },
            });
        },
    });

    const onSubmit = async (values: InventoryFormValues) => {
        await mutation.mutateAsync(values);
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    form.reset();
                    onClose();
                }
            }}
        >
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter item name"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    form.trigger('name');
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select
                                            onValueChange={(value: ItemType) => {
                                                field.onChange(value);
                                                if (value !== 'other') {
                                                    form.setValue('customType', '');
                                                }
                                                form.trigger(['type', 'customType']);
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ITEM_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedType === 'other' && (
                                <FormField
                                    control={form.control}
                                    name="customType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Custom Type</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter custom type"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        form.trigger(['type', 'customType']);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="size"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Size</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter size" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="length"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Length (cm)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Enter length"
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value ? Number(e.target.value) : undefined;
                                                    field.onChange(value);
                                                    form.trigger('length');
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="total_quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Quantity</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Enter quantity"
                                                {...field}
                                                min={1}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                        ? Math.max(1, Number(e.target.value))
                                                        : 1;
                                                    field.onChange(value);
                                                    form.trigger('total_quantity');
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brand</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter brand" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="coating"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coating</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter coating" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="material"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Material</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter material" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea maxLength={200} placeholder="Enter description" {...field} />
                                    </FormControl>
                                    <div className="text-right text-sm text-muted-foreground">
                                        {field.value?.length || 0}/200 characters
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                    onClose();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!isDirty || !isValid || isSubmitting || mutation.isPending}>
                                {mutation.isPending ? 'Adding...' : 'Add Item'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
