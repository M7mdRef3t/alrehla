/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import CoachDashboard from '../../src/modules/b2b/CoachDashboard';

export const metadata = {
    title: 'لوحة تحكم المدربين - منصة الرحلة',
    description: 'نظام تشغيل B2B للمدربين والمعالجين لمتابعة عملاء دواير',
};

export default function CoachPage() {
    return <CoachDashboard />;
}
