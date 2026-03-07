import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
    title: 'UI/Badge',
    component: Badge,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
    args: {
        children: 'تنبيه',
    },
};

export const CustomColor: Story = {
    args: {
        children: 'مكتمل',
        className: 'bg-[var(--soft-teal)] text-slate-900',
    },
};
