'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editItemWithInventory, deleteItemWithInventory } from '@/actions/inventory';
import { toast } from 'sonner';
import * as z from 'zod';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TURNING_CATEGORIES, MILLING_CATEGORIES } from '@/data/inventory.type';

// Define available types as a const array for type safety and reusability
const ITEM_TYPES = ['turning', 'milling', 'other'] as const;
type ItemType = (typeof ITEM_TYPES)[number];

const editFormSchema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        type: z.enum(['turning', 'milling', 'other'] as const),
        customType: z.string().optional(),
        category: z.string().optional(),
        length: z.coerce
            .number()
            .min(0, 'Length must be positive')
            .max(1000, 'Length must not exceed 1000mm')
            .optional()
            .nullable()
            .transform((val) => (val === null ? undefined : val)),
            diameter: z.coerce
        .number()
        .min(0, 'Diameter must be positive')
        .max(100, 'Diameter must not exceed 100mm')
        .optional()
        .nullable()
        .transform((val) => (val === null ? undefined : val)),
    flute: z.coerce
        .number()
        .min(1, 'Flute count must be at least 1')
        .max(20, 'Flute count must not exceed 20')
        .optional()
        .nullable()
        .transform((val) => (val === null ? undefined : val)),
        coating: z.string().optional(),
        material: z.string().optional(),
        description: z.string().optional(),
        total_quantity: z.coerce
            .number()
            .min(1, 'Quantity must be at least 1')
            .transform((val) => Math.max(1, val)),
    })
    .superRefine((data, ctx) => {
        if (data.type === 'other' && (!data.customType || data.customType.length < 2)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Type is required',
                path: ['customType'],
            });
        }
        
        // Make category mandatory for turning and milling
        if ((data.type === 'turning' || data.type === 'milling') && (!data.category || data.category.length === 0)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Category is required for this machine type',
                path: ['category'],
            });
        }
    });

type FormValues = z.infer<typeof editFormSchema>;

interface EditItemDialogProps {
    item: {
        $id: string;
        name: string;
        type: string;
        category?: string | null;
        length?: number | null;
        diameter?: number | null;
        flute?: number | null;
        coating?: string | null;
        material?: string | null;
        description?: string | null;
        inventory: {
            total_quantity: number;
        };
    };
    isOpen: boolean;
    onClose: () => void;
}

export default function EditItemDialog({ item, isOpen, onClose }: EditItemDialogProps) {
    const queryClient = useQueryClient();

    // Determine initial type selection
    const initialType = ITEM_TYPES.includes(item.type as ItemType) ? item.type : 'other';
    const initialCustomType = !ITEM_TYPES.includes(item.type as ItemType) ? item.type : '';

    const form = useForm<FormValues>({
        resolver: zodResolver(editFormSchema),
        defaultValues: {
            name: item.name,
            type: initialType as ItemType,
            customType: initialCustomType,
            category: item.category ?? '',
            length: item.length ?? undefined,
            diameter: item.diameter ?? undefined,
            flute: item.flute ?? undefined,
            coating: item.coating ?? undefined,
            material: item.material ?? undefined,
            description: item.description ?? undefined,
            total_quantity: item.inventory.total_quantity,
        },
        mode: 'onChange',
    });

    const {
        watch,
        formState: { isValid, isSubmitting, isDirty },
    } = form;
    const selectedType = watch('type');

    // Get categories based on selected type
    const getAvailableCategories = (type: ItemType) => {
        switch (type) {
            case 'turning':
                return TURNING_CATEGORIES;
            case 'milling':
                return MILLING_CATEGORIES;
            default:
                return [];
        }
    };

    const handleDelete = () => {
        toast.promise(deleteItemWithInventory(item.$id), {
            loading: 'Deleting item...',
            success: (response) => {
                if (response.success) {
                    queryClient.invalidateQueries({ queryKey: ['inventory'] });
                    onClose();
                    return 'Item deleted successfully';
                }
                throw new Error(response.message);
            },
            error: (err) => {
                console.error(err);
                return 'Failed to delete item';
            },
        });
    };

    const mutation = useMutation({
        mutationFn: async (data: FormValues & { id: string }) => {
            const finalData = {
                ...data,
                type: data.type === 'other' ? data.customType! : data.type,
            };

            // Clean up the data before sending
            (Object.keys(finalData) as Array<keyof typeof finalData>).forEach((key) => {
                if (finalData[key] === undefined || finalData[key] === null || key === 'customType') {
                    delete finalData[key];
                }
            });

            return toast.promise(editItemWithInventory(finalData), {
                loading: 'Updating item...',
                success: (response) => {
                    if (response.success) {
                        queryClient.invalidateQueries({ queryKey: ['inventory'] });
                        onClose();
                        return 'Item updated successfully';
                    }
                    throw new Error(response.message || 'Failed to update item');
                },
                error: (error: Error) => {
                    console.error(error);
                    return error.message || 'Failed to update item';
                },
            });
        },
    });

    const onSubmit = async (values: FormValues) => {
        await mutation.mutateAsync({ id: item.$id, ...values });
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
                    <DialogTitle>Edit Item</DialogTitle>
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
                                                // Clear category when type changes
                                                form.setValue('category', '');
                                                form.trigger(['type', 'customType', 'category']);
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

                            {(selectedType === 'turning' || selectedType === 'milling') && (
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Category <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    form.trigger('category');
                                                }}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {getAvailableCategories(selectedType).map((category) => (
                                                        <SelectItem key={category} value={category}>
                                                            {category}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="length"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Length (mm)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                min="0" 
                                                max="1000" 
                                                step="0.1"
                                                placeholder="Enter length in mm"
                                                {...field} 
                                                value={field.value ?? ''} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                                        <FormField
                control={form.control}
                name="diameter"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Diameter (mm)</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                {...field}
                                value={field.value?.toString() ?? ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? undefined : Number(value));
                                    form.trigger('diameter');
                                }}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="flute"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Flute Count</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                {...field}
                                value={field.value?.toString() ?? ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? undefined : Number(value));
                                    form.trigger('flute');
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
                                                {...field}
                                                min={1}
                                                onChange={(e) => {
                                                    const value = Math.max(1, parseInt(e.target.value) || 1);
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
                                name="coating"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coating</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value ?? ''} />
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
                                            <Input {...field} value={field.value ?? ''} />
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
                                        <Textarea
                                            maxLength={200}
                                            placeholder="Enter description"
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <div className="text-right text-sm text-muted-foreground">
                                        {field.value?.length || 0}/200 characters
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-between space-x-2 pt-4">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" className="flex items-center gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the item.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <div className="flex space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        form.reset();
                                        onClose();
                                    }}
                                    disabled={isSubmitting || mutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!isDirty || !isValid || isSubmitting || mutation.isPending}
                                >
                                    {mutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
