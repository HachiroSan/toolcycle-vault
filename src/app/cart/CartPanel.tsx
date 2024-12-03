'use client';

import { borrowItems } from '@/actions/borrow';
import { CartItem } from './CartItem';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShoppingCart, ClipboardCheck, Clock, CheckCircle2, Loader, LoaderCircle } from 'lucide-react';
import { CreateBorrowRequest, BorrowReceipt } from '@/data/borrow.type';
import { Receipt } from './Receipt';
import { getItems } from '@/actions/inventory';
import { BaseItem } from '@/data/inventory.type';

const Steps = [
    { id: 1, title: 'Review Cart', icon: ShoppingCart },
    { id: 2, title: 'Borrow Details', icon: ClipboardCheck },
    { id: 3, title: 'Confirm', icon: Clock },
    { id: 4, title: 'Success', icon: CheckCircle2 },
];

export default function CartPanel() {
    const { state, clearCart, updateCartItem, removeFromCart } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [sharedDetails, setSharedDetails] = useState({
        lecturer: '',
        subject: '',
        dueDate: '',
        notes: '',
    });
    const [borrowResponse, setBorrowResponse] = useState<BorrowReceipt>();
    const [checkoutComplete, setCheckoutComplete] = useState(false);
    const [cartItems, setCartItems] = useState<BaseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [receiptItems, setReceiptItems] = useState<BaseItem[]>([]);

    // Fetch items when cart state changes
    useEffect(() => {
        const fetchCartItems = async () => {
            if (state.items.length > 0) {
                setIsLoading(true);
                try {
                    const itemIds = state.items.map((item) => item.item.$id);
                    const response = await getItems(itemIds);
                    if (response.success) {
                        setCartItems(response.data ?? []);
                    }
                } catch {
                    toast.error('Failed to load item details');
                } finally {
                    setIsLoading(false);
                }
            } else {
                setCartItems([]);
                setIsLoading(false);
            }
        };

        fetchCartItems();
    }, [state.items]);

    const handleNextStep = () => {
        if (currentStep < Steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleCheckout = async () => {
        try {
            setIsSubmitting(true);
            const item_ids = state.items.map((item) => item.item.$id);
            const item_quantities = state.items.map((item) => item.quantity);

            const request: CreateBorrowRequest = {
                item_ids,
                item_quantities,
                dueDate: sharedDetails.dueDate,
                lecturer: sharedDetails.lecturer,
                subject: sharedDetails.subject,
                notes: sharedDetails.notes,
            };

            const response = await borrowItems(request);

            if (response.success && response.data) {
                setReceiptItems(cartItems);
                setBorrowResponse(response.data);
                setCheckoutComplete(true);
                handleNextStep();
                toast.success('Transaction completed!');
                // Create a copy of the cart items before clearing the cart for receipt data
                clearCart(); // Clear cart after successful checkout
            } else {
                toast.error(response.message || 'Failed to borrow items');
            }
        } catch {
            toast.error('Failed to process checkout');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = sharedDetails.lecturer && sharedDetails.subject && sharedDetails.dueDate;

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Cart Items ({state.items.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                            <AnimatePresence>
                                {state.items.map((cartItem) => {
                                    const itemDetails = cartItems.find((i) => i.$id === cartItem.item.$id);

                                    return (
                                        <motion.div
                                            key={cartItem.item.$id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="py-4"
                                        >
                                            <CartItem
                                                item={cartItem.item}
                                                itemDetails={itemDetails}
                                                quantity={cartItem.quantity}
                                                onUpdate={(itemId, updates) =>
                                                    updateCartItem(itemId, { quantity: updates.quantity })
                                                }
                                                onRemove={removeFromCart}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            {isLoading && (
                                <div className="flex justify-center py-4">
                                    <LoaderCircle className="h-6 w-6 animate-spin" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            case 2:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Borrow Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Lecturer</label>
                                    <Input
                                        placeholder="Enter lecturer name"
                                        value={sharedDetails.lecturer}
                                        onChange={(e) =>
                                            setSharedDetails({ ...sharedDetails, lecturer: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input
                                        placeholder="Enter subject name"
                                        value={sharedDetails.subject}
                                        onChange={(e) =>
                                            setSharedDetails({ ...sharedDetails, subject: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Due Date</label>
                                    <Input
                                        type="date"
                                        value={sharedDetails.dueDate}
                                        onChange={(e) =>
                                            setSharedDetails({ ...sharedDetails, dueDate: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Notes (Optional)</label>
                                    <Input
                                        placeholder="Add any special notes"
                                        value={sharedDetails.notes}
                                        onChange={(e) => setSharedDetails({ ...sharedDetails, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 3:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Confirm Request</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div>
                                    <strong>Items:</strong>
                                    <ul className="mt-2 space-y-1">
                                        {cartItems.map((item) => (
                                            <li key={item.$id} className="text-sm text-muted-foreground">
                                                • {item.name} ×{' '}
                                                {
                                                    state.items.find((cartItem) => cartItem.item.$id === item.$id)
                                                        ?.quantity
                                                }
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <p>
                                    <strong>Lecturer:</strong> {sharedDetails.lecturer}
                                </p>
                                <p>
                                    <strong>Subject:</strong> {sharedDetails.subject}
                                </p>
                                <p>
                                    <strong>Due Date:</strong> {sharedDetails.dueDate}
                                </p>
                                {sharedDetails.notes && (
                                    <p>
                                        <strong>Notes:</strong> {sharedDetails.notes}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            case 4:
                return borrowResponse ? (
                    <Receipt
                        data={borrowResponse}
                        items={receiptItems} // Pass the already fetched items
                    />
                ) : null;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    {Steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full 
                                ${currentStep >= step.id ? 'bg-primary text-white' : 'bg-gray-100'}`}
                            >
                                <step.icon className="w-5 h-5" />
                            </div>
                            <div className="ml-3 hidden sm:block">
                                <p className="text-sm font-medium">{step.title}</p>
                            </div>
                            {index < Steps.length - 1 && <ChevronRight className="w-5 h-5 mx-4 text-gray-300" />}
                        </div>
                    ))}
                </div>
            </div>

            {!checkoutComplete && state.items.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <ShoppingCart className="w-12 h-12 text-muted-foreground" />
                        <h2 className="text-xl font-semibold">Your cart is empty</h2>
                        <p className="text-muted-foreground">Start adding items to your cart</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {renderStepContent()}
                    <div className="flex justify-between mt-4">
                        {currentStep > 1 && currentStep < 4 && (
                            <Button variant="outline" onClick={handlePrevStep}>
                                Previous
                            </Button>
                        )}
                        {currentStep < 3 && (
                            <Button
                                onClick={handleNextStep}
                                disabled={currentStep === 2 && !isFormValid}
                                className="ml-auto"
                            >
                                Next
                            </Button>
                        )}
                        {currentStep === 3 && (
                            <Button
                                onClick={handleCheckout}
                                disabled={!isFormValid || isSubmitting}
                                className="ml-auto bg-primary hover:bg-primary/90"
                                variant="destructive"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Confirm Borrow
                                    </>
                                )}
                            </Button>
                        )}
                        {currentStep === 4 && (
                            <div className="flex gap-4 w-full justify-end">
                                <Button
                                    variant={'outline'}
                                    onClick={() => {
                                        // Reset the form and redirect to home or items page
                                        window.location.href = '/';
                                    }}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Done
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
