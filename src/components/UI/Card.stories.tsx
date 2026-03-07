import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
    title: 'UI/Card',
    component: Card,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
    args: {
        children: (
            <div className="p-4 text-slate-200">
                <h3 className="text-lg font-bold mb-2">عنوان الكرت</h3>
                <p className="text-sm">هذا محتوى الكرت لتجربة التصميم الزجاجي (Glassmorphism).</p>
            </div>
        ),
        className: 'w-[300px]',
    },
};
