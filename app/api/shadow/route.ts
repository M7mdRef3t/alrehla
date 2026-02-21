import { NextResponse } from 'next/server';
import { constructShadowProfile } from '../../../scripts/shadowProtocol';

export async function POST(req: Request) {
    try {
        const { label, type, mass, ownerId, contactMethod, contactValue } = await req.json();

        if (!label || !ownerId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // We only want to trigger the Shadow Protocol for "danger" or highly draining nodes
        // Or if the mass is high enough (e.g., >= 7)
        if (type !== 'danger' && mass < 7) {
            return NextResponse.json({ message: 'Node skipped. Not a high-threat profile.' });
        }

        // Run the construction asynchronously so we don't block the user's UI
        // In a real production app (Vercel), we'd use waitUntil or a background queue (e.g. Inngest)
        // Here, we just don't await the final outcome for the response.
        const target = { label, type, mass, ownerId, contactMethod, contactValue };

        constructShadowProfile(target).catch(err => {
            console.error('[Shadow API Background Error]', err);
        });

        return NextResponse.json({ message: 'Shadow profile generation initiated.' });

    } catch (err: any) {
        console.error('Error in Shadow API:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
