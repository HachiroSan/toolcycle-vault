import { motion } from 'framer-motion';
import { Check, Drill } from 'lucide-react';

export function CheckoutSuccess() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center h-[300px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
            >
                <motion.div
                    className="absolute inset-0 bg-green-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                />
                <motion.div className="relative z-10 bg-white rounded-full p-2">
                    <Check className="w-12 h-12 text-green-500" />
                </motion.div>
            </motion.div>

            <motion.div
                className="mt-8 space-y-2 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="text-2xl font-bold text-green-500">Checkout Successful!</h2>
                <p className="text-muted-foreground">Your tools have been checked out successfully.</p>
            </motion.div>

            <motion.div
                className="mt-6 flex gap-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="text-primary"
                        animate={{
                            rotate: [0, 360],
                            y: [0, -10, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: 'easeInOut',
                        }}
                    >
                        <Drill className="w-6 h-6" />
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}
