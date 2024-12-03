'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, Star, GraduationCap, LucideIcon } from 'lucide-react';

export type Role = 'student' | 'admin' | 'superadmin' | undefined;

interface RoleBadgeConfig {
    icon: LucideIcon;
    label: string;
    description: string;
    className: string;
}

interface RoleBadgeProps {
    role?: Role;
}

const getRoleBadgeConfig = (role: Role): RoleBadgeConfig => {
    switch (role) {
        case 'admin':
            return {
                icon: ShieldCheck,
                label: 'Admin',
                description: 'Administrator with elevated privileges',
                className: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
            };
        case 'superadmin':
            return {
                icon: Star,
                label: 'Super Admin',
                description: 'Highest level of administrative access',
                className: 'bg-rose-100 text-rose-800 hover:bg-rose-200',
            };
        case 'student':
        default:
            return {
                icon: GraduationCap,
                label: 'Student',
                description: 'Learner enrolled in courses',
                className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
            };
    }
};

const RoleBadge: React.FC<RoleBadgeProps> = ({ role = 'student' }) => {
    const { icon: RoleIcon, label, description, className } = getRoleBadgeConfig(role);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Badge
                            variant="secondary"
                            className={`flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${className}`}
                        >
                            <RoleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{label}</span>
                        </Badge>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="text-xs">
                    <p>{description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default RoleBadge;
