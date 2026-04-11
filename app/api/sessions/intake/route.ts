import { NextResponse } from 'next/server';
import { processIntake } from '@/domains/sessions/services/intake.service';

/**
 * POST /api/sessions/intake
 * 
 * Thin adapter — delegates all business logic to the Sessions domain.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate minimum required fields
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'Missing basic info' }, { status: 400 });
    }

    const result = await processIntake(data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Processing failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Intake received successfully',
      nextStatus: result.nextStatus,
    });

  } catch (error) {
    console.error('[API] Intake Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
