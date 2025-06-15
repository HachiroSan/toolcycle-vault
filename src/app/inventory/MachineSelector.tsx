import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { HelpCircle, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TURNING_CATEGORIES, MILLING_CATEGORIES } from '@/data/inventory.type';

const TurningMachineSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width={100} height={125} viewBox="0 0 1600 1690">
        <path d="m189.522 520.956-24.186 23.378 168.473.091h168.474l-24.094-23.469-24.186-23.468H213.708l-24.186 23.468ZM1106.49 549.028c-1.29.542-3.32 1.805-4.43 2.888-5.08 4.604-4.8-2.166-4.8 121.314v114.454l173.73.271c95.64.181 175.96 0 178.63-.271 5.91-.722 10.16-3.43 12.93-8.123l2.12-3.611V559.499l-2.31-3.882c-1.48-2.527-3.6-4.423-6.28-5.686l-3.97-1.896-171.7.09c-111.7 0-172.44.361-173.92.903Zm309.07 44.5c2.86 2.437 3.41 6.318 1.48 9.477-.93 1.535-2.22 2.979-2.96 3.25-.64.271-50.86.451-111.61.451-122.41.091-114 .542-115.3-5.867-.64-3.61 1.2-7.311 4.53-8.575 1.2-.451 49.48-.722 111.97-.632 105.7.181 110.13.271 111.89 1.896Zm.37 46.576c2.31 2.347 2.67 3.249 2.21 5.686-.27 1.625-1.57 3.791-2.95 4.875l-2.31 2.076h-110.5c-107.55 0-110.59-.091-112.81-1.806-3.23-2.437-3.32-9.297-.09-11.824 2.12-1.625 5.26-1.715 112.9-1.715h110.78l2.77 2.708Zm-.74 45.041c1.29 1.174 2.58 2.979 2.95 3.881.74 2.528-1.2 6.68-3.78 7.763-2.03.903-72.65 1.264-200.14 1.083h-22.89l-2.22-2.256c-4.15-3.972-2.31-10.471 3.51-12.096 1.75-.541 46.71-.812 111.61-.722l108.56.181 2.4 2.166Zm1.2 46.486c2.86 3.249 2.4 7.221-1.2 10.2l-2.31 2.076H1191.6l-2.4-2.799c-3.78-4.422-2.77-9.567 2.31-11.553 1.39-.542 42.93-.813 112.35-.722l110.22.18 2.31 2.618ZM165.52 678.285c.185 68.6.277 132.778.277 142.526v17.872h336.025V553.451H165.336l.184 124.834Zm286.544-64.267c2.77 1.354 4.247 2.888 5.539 5.776 1.754 3.882 1.846 5.958 1.57 42.785-.277 37.55-.37 38.814-2.216 41.251-1.016 1.354-3.046 3.339-4.431 4.332-2.493 1.896-2.862 1.896-118.624 1.896H217.77l-3.323-2.528c-1.846-1.353-3.785-3.249-4.339-4.152-.554-1.083-.923-17.24-.923-42.062l-.092-40.348 2.123-2.979c4.246-6.138-4.247-5.777 122.409-5.777 114.101-.09 114.747-.09 118.439 1.806Z" />
        <path d="M248.419 643.443c-1.016.271-3.601 1.715-5.724 3.25-9.416 6.589-10.339 19.587-1.938 27.44 3.969 3.701 7.015 4.784 13.57 4.784 17.447 0 24.186-23.107 9.508-32.766-3.877-2.617-11.262-3.881-15.416-2.708ZM327.347 644.075c-4.246 1.806-7.015 4.152-8.954 7.582-7.385 12.818.738 27.26 15.416 27.26 6.186 0 9.324-1.264 13.109-5.145 9.047-9.297 5.908-24.01-6.277-29.336-4.247-1.805-9.509-1.895-13.294-.361ZM407.107 644.527c-13.57 6.138-15.232 22.656-3.139 31.502 3.878 2.978 4.339 3.069 11.078 2.707 6.001-.27 7.385-.631 10.524-2.978 6.924-5.145 9.231-16.067 4.893-23.469-4.616-8.033-15.14-11.553-23.356-7.762ZM1020.64 650.935v74.919h67.39V576.017h-67.39v74.918ZM511.053 659.962v74.918l33.326-.18 33.233-.271v-31.592c0-17.421-.092-50.999-.092-74.738v-43.056h-66.467v74.919ZM940.316 650.935v37.008h71.094v-74.016h-71.094v37.008ZM586.936 659.962l.277 37.098h33.233c18.278 0 34.525 0 36.002-.09h2.77v-74.016h-72.467l.185 37.008ZM1122.18 817.923v20.76H1400.88l.28-19.226c.18-10.651.18-19.948 0-20.761-.28-1.444-10.8-1.534-139.67-1.534h-139.31v20.761ZM135.333 862.152v14.442H1459.13V847.709H135.333v14.443ZM154.719 897.806v12.185H1438.82V885.62H154.719v12.186ZM135.333 1055.77v136.74l192.291-.18 192.199-.27.462-32.04c.554-35.11.83-36.92 6.554-48.11 8.216-15.8 19.848-26.45 36.095-32.86 12.462-4.96-2.585-4.69 301.961-4.78 196.175 0 284.335.27 288.955.99 23.44 3.34 45.23 20.4 53.08 41.34 4.25 11.38 4.8 17.24 4.8 47.57v28.34h247.4V919.018H135.333v136.752Zm79.114-104.709c10.616 5.235 13.847 18.233 6.647 27.169-5.909 7.402-15.048 9.478-23.541 5.326-10.985-5.326-13.755-19.136-5.631-28.162 6.001-6.68 14.401-8.305 22.525-4.333Zm1181.453-.542c6.46 2.889 11.54 10.2 11.54 16.88 0 6.95-6.47 15.254-13.67 17.601-8.12 2.618-17.91-1.354-22.15-9.117-3.14-5.776-2.59-13.72 1.2-19.135 5.26-7.221 14.95-9.839 23.08-6.229ZM216.755 1128.97c2.123 1.44 4.8 4.42 6.093 6.68 3.046 5.59 2.492 13.54-1.293 18.86-3.231 4.51-10.339 8.21-15.509 8.21-9.877-.09-19.017-9.11-19.017-18.86 0-4.42 3.878-11.82 7.478-14.44 4.062-2.98 6.924-3.7 13.109-3.43 4.061.27 6.092.9 9.139 2.98Zm1177.845-2.35c4.53 1.27 10.53 7.76 11.91 12.82 2.4 8.3-2.12 17.33-10.52 21.12-5.72 2.62-10.53 2.71-15.14.45-7.57-3.79-11.26-9.48-11.26-17.24 0-12.63 11.81-20.76 25.01-17.15Z" />
    </svg>
);

const MillingMachineSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width={100} height={125}>
        <path d="M65.65 21.15c1.2 0 2.1.9 2.1 2.1v9.8c0 1.2-.9 2.1-2.1 2.1h-31.3c-1.2 0-2.1-.9-2.1-2.1v-9.8c0-1.2.9-2.1 2.1-2.1h31.3m0-3h-31.3c-2.8 0-5.1 2.3-5.1 5.1v9.8c0 2.8 2.3 5.1 5.1 5.1h31.3c2.8 0 5.1-2.3 5.1-5.1v-9.8c0-2.8-2.3-5.1-5.1-5.1ZM64.15 45.55c2 0 3.6 1.6 3.6 3.6v12.9c0 2-1.6 3.6-3.6 3.6h-28.2c-2 0-3.6-1.6-3.6-3.6v-12.8c0-2 1.6-3.6 3.6-3.6h28.2m0-3.1h-28.2c-3.7 0-6.6 3-6.6 6.6v12.9c0 3.7 3 6.6 6.6 6.6h28.2c3.7 0 6.6-3 6.6-6.6v-12.8c0-3.7-2.9-6.7-6.6-6.7Z" />
        <path d="M59.35 38.15v4.4h-18.7v-4.4h18.7m3-3h-24.7v10.4h24.7v-10.4ZM56.35 68.75l-1.3 4.4c0 .1-.1.2-.1.3 0 .3-.3.5-.6.5h-8.9c-.3 0-.6-.2-.6-.5 0-.1 0-.2-.1-.3l-1.2-4.4h12.8m4-3h-20.7l2.2 8.2c.3 1.7 1.8 3 3.6 3h8.9c1.8 0 3.3-1.3 3.6-3l2.4-8.2ZM45.25 103.75l4.8 3.1 4.8-3.1v-5.8l-9.6 3.2z" />
        <path d="M54.85 74.95h-9.6v8.3l9.6-3.2zM54.85 83.35l-9.6 3.1v3.8l9.6-3.2zM54.85 90.35l-9.6 3.2v4.3l9.6-3.2z" />
    </svg>
);

interface CategorySelectorProps {
    machineType: 'turning' | 'milling';
    onBack: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ machineType, onBack }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const categories = machineType === 'turning' ? TURNING_CATEGORIES : MILLING_CATEGORIES;

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>
            
            <h3 className="text-2xl font-semibold text-foreground mb-2">
                Select {machineType.charAt(0).toUpperCase() + machineType.slice(1)} Category
            </h3>
            <p className="text-muted-foreground mb-6">
                Choose the specific category for {machineType} tools you're looking for.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                    href={`/inventory/${machineType}`}
                    className="block"
                >
                    <Card
                        className={cn(
                            'p-6 cursor-pointer transition-all duration-300',
                            'border-2 hover:shadow-lg hover:border-primary/50',
                            'group relative overflow-hidden'
                        )}
                    >
                        <div className="flex flex-col items-center justify-center min-h-[120px] gap-4 text-center">
                            <h4 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                                All Categories
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                View all {machineType} tools
                            </p>
                        </div>
                    </Card>
                </Link>
                
                {categories.map((category) => (
                    <Link
                        key={category}
                        href={`/inventory/${machineType}?category=${encodeURIComponent(category)}`}
                        className="block"
                        onMouseEnter={() => setSelectedCategory(category)}
                    >
                        <Card
                            className={cn(
                                'p-6 cursor-pointer transition-all duration-300',
                                'border-2 hover:shadow-lg',
                                'group relative overflow-hidden',
                                selectedCategory === category ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                            )}
                        >
                            <div className="flex flex-col items-center justify-center min-h-[120px] gap-4 text-center">
                                <h4
                                    className={cn(
                                        'text-lg font-medium transition-colors duration-300',
                                        selectedCategory === category ? 'text-primary' : 'text-foreground group-hover:text-primary'
                                    )}
                                >
                                    {category}
                                </h4>
                            </div>
                            <div
                                className={cn(
                                    'absolute inset-0 border-2 border-primary/0 rounded-lg transition-all duration-300',
                                    'group-hover:border-primary/50'
                                )}
                            />
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const MachineTypeSelector: React.FC = () => {
    const [selected, setSelected] = useState('turning');
    const [showCategories, setShowCategories] = useState<'turning' | 'milling' | null>(null);

    const machines = [
        { value: 'turning', label: 'Turning', icon: TurningMachineSvg },
        { value: 'milling', label: 'Milling', icon: MillingMachineSvg },
        { value: 'all', label: 'All', icon: HelpCircle },
    ];

    if (showCategories) {
        return <CategorySelector machineType={showCategories} onBack={() => setShowCategories(null)} />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Select Machine Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {machines.map((machine) => (
                    <div key={machine.value}>
                        {machine.value === 'all' ? (
                            <Link href={`/inventory/${machine.value}`} className="block">
                                <Card
                                    className={cn(
                                        'p-6 cursor-pointer transition-all duration-300',
                                        'border-2 hover:shadow-lg',
                                        'group relative overflow-hidden',
                                        selected === machine.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                                    )}
                                    onMouseEnter={() => setSelected(machine.value)}
                                >
                                    <div className="flex flex-col items-center justify-center min-h-[200px] gap-6 text-center">
                                        <div
                                            className={cn(
                                                'transition-all duration-300 p-3 rounded-full',
                                                'group-hover:bg-primary/10',
                                                selected === machine.value ? 'text-primary' : 'text-muted-foreground'
                                            )}
                                        >
                                            <machine.icon className="w-12 h-12" />
                                        </div>
                                        <h4
                                            className={cn(
                                                'text-lg font-medium transition-colors duration-300',
                                                selected === machine.value ? 'text-primary' : 'text-foreground'
                                            )}
                                        >
                                            {machine.label}
                                        </h4>
                                    </div>
                                    <div
                                        className={cn(
                                            'absolute inset-0 border-2 border-primary/0 rounded-lg transition-all duration-300',
                                            'group-hover:border-primary/50'
                                        )}
                                    />
                                </Card>
                            </Link>
                        ) : (
                            <Card
                                className={cn(
                                    'p-6 cursor-pointer transition-all duration-300',
                                    'border-2 hover:shadow-lg',
                                    'group relative overflow-hidden',
                                    selected === machine.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                                )}
                                onMouseEnter={() => setSelected(machine.value)}
                                onClick={() => {
                                    if (machine.value === 'turning' || machine.value === 'milling') {
                                        setShowCategories(machine.value);
                                    }
                                }}
                            >
                                <div className="flex flex-col items-center justify-center min-h-[200px] gap-6 text-center">
                                    <div
                                        className={cn(
                                            'transition-all duration-300 p-3 rounded-full',
                                            'group-hover:bg-primary/10',
                                            selected === machine.value ? 'text-primary' : 'text-muted-foreground'
                                        )}
                                    >
                                        <machine.icon className="w-12 h-12" />
                                    </div>
                                    <h4
                                        className={cn(
                                            'text-lg font-medium transition-colors duration-300',
                                            selected === machine.value ? 'text-primary' : 'text-foreground'
                                        )}
                                    >
                                        {machine.label}
                                    </h4>
                                </div>
                                <div
                                    className={cn(
                                        'absolute inset-0 border-2 border-primary/0 rounded-lg transition-all duration-300',
                                        'group-hover:border-primary/50'
                                    )}
                                />
                            </Card>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MachineTypeSelector;
