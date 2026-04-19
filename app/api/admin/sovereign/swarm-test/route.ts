import { NextResponse } from 'next/server';
import { AgentSwarmOrchestrator } from '../../../../../src/services/agentSwarmOrchestrator';

export async function POST(req: Request) {
    try {
        const { userId, sampleLogs } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required to run the swarm' }, { status: 400 });
        }

        const logs = sampleLogs || [
            "أشعر بالانغماس الدائم في العمل ولا أجد وقتاً للراحة",
            "علاقتي مع مديري تستهلك كل طاقتي الذهنية بالكامل",
            "أشعر بالذنب عندما أحاول رفض طلبات زملائي"
        ];

        const result = await AgentSwarmOrchestrator.executeSwarm(userId, logs);

        if (!result.success) {
            return NextResponse.json({ error: result.error, process: result.process }, { status: 500 });
        }

        return NextResponse.json(result);

    } catch (err: any) {
        console.error('Error executing swarm:', err);
        return NextResponse.json({ error: err?.message || 'Error occurred' }, { status: 500 });
    }
}
