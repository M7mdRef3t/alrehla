import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'UI/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['primary', 'secondary', 'ghost'],
        },
        size: {
            control: { type: 'select' },
            options: ['sm', 'md', 'lg'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        size: 'md',
        children: 'الزر الرئيسي',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        size: 'md',
        children: 'الزر الثانوي',
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        size: 'md',
        children: 'زر شفاف',
    },
};

export const Small: Story = {
    args: {
        size: 'sm',
        children: 'زر صغير',
    },
};

export const Large: Story = {
    args: {
        size: 'lg',
        children: 'زر كبير',
    },
};
