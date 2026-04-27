/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import CoachDashboard from '../../src/modules/b2b/CoachDashboard';
import LiveCoachPanel from '../../src/modules/dawayir-live/pages/LiveCoachPanel';

export const metadata = {
    title: 'لوحة تحكم المدربين - منصة الرحلة',
    description: 'نظام تشغيل B2B للمدربين والمعالجين لمتابعة عملاء الرحلة',
};

export default async function CoachPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const params = await searchParams;
    if (params.tab === 'dawayir-live') {
        return <LiveCoachPanel />;
    }
    return <CoachDashboard />;
}
