"use client";

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import RadarBackground from '@/modules/meta/gate/RadarBackground';
import LayerOneForm from '@/modules/meta/gate/LayerOneForm';
import LayerTwoQualifier from '@/modules/meta/gate/LayerTwoQualifier';
import { trackGateEventPixelOnly } from '@/lib/analytics/eventTracker';
import type { GateState } from '@/lib/gate/types';
import { setStoredLeadEmail } from '@/services/revenueAccess';
import { initAnalytics } from '@/services/analytics';

function MarketingGateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<GateState>({
    sessionId: '',
    step: 'layer1',
    name: '',
    phone: '',
    sourceArea: '',
    email: '',
  });

  const initialized = useRef(false);
  const gateStartedTracked = useRef(false);

  // Initialize Session
  useEffect(() => {
    setMounted(true);
    if (!initialized.current) {
      initAnalytics(); // Initialize tracking scripts like Meta Pixel
      
      const newSessionId = uuidv4();
      setState(s => ({ ...s, sessionId: newSessionId }));
      
      // Tracking PageView/ViewContent
      trackGateEventPixelOnly('ViewContent', { external_id: newSessionId }, `${newSessionId}-view`);
      initialized.current = true;
    }
  }, []);

  const getUtmPayload = () => ({
    utm_source: searchParams?.get('utm_source') ?? null,
    utm_medium: searchParams?.get('utm_medium') ?? null,
    utm_campaign: searchParams?.get('utm_campaign') ?? null,
    utm_content: searchParams?.get('utm_content') ?? null,
    utm_term: searchParams?.get('utm_term') ?? null,
    fbclid: searchParams?.get('fbclid') ?? null,
  });

  // Layer 1 Handlers
  const handleLayer1Change = (field: string, value: string) => {
    setState(s => ({ ...s, [field]: value }));
    
    if (!gateStartedTracked.current) {
      gateStartedTracked.current = true;
      trackGateEventPixelOnly('GateStarted', { external_id: state.sessionId }, `${state.sessionId}-started`);
    }
  };

  const handleStepComplete = async (step: string) => {
    // Incremental Upsert to prevent lead loss
    void fetch('/api/gate/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: `layer1_${step}`,
        sessionId: state.sessionId,
        name: state.name,
        phone: state.phone,
        email: state.email,
        sourceArea: state.sourceArea,
        ...getUtmPayload()
      })
    });
  };

  const handleLayer1Submit = async () => {
    if (!state.email || !state.sourceArea || !state.name || !state.phone) return;
    
    // Pixel Fire
    const eventId = trackGateEventPixelOnly('Lead', { external_id: state.sessionId }, `${state.sessionId}-lead`);
    
    // Final Layer 1 Sync
    const response = await fetch('/api/gate/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'layer1',
        sessionId: state.sessionId,
        eventId,
        name: state.name,
        phone: state.phone,
        email: state.email,
        sourceArea: state.sourceArea,
        ...getUtmPayload()
      })
    });

    if (response.ok) {
      setState(s => ({ ...s, step: 'layer2' }));
      trackGateEventPixelOnly('QualifierStarted', { external_id: state.sessionId }, `${state.sessionId}-qualifier`);
    }
  };

  // Layer 2 Handlers
  const handleQualifierComplete = async (q1: string, q2: string, q3: string) => {
    const finalState = { ...state, painPoint: q1, intent: q2, commitment: q3, step: 'handoff' as const };
    
    // Pixel Fire
    const eventId = trackGateEventPixelOnly('GateQualified', { external_id: state.sessionId }, `${state.sessionId}-qualified`);
    
    // Backend Idempotent Fire & Record
    const response = await fetch('/api/gate/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'layer2',
        sessionId: finalState.sessionId,
        eventId,
        email: finalState.email, // Passing email to persist CAPI parameters server-side
        painPoint: q1,
        intent: q2,
        commitment: q3
      })
    });

    if (response.ok) {
      if (finalState.email) {
        setStoredLeadEmail(finalState.email);
      }
      // Revenue-first Handoff: Go specifically to activation
      router.push(`/activation?gateSessionId=${finalState.sessionId}`);
    }
  };

  const isLayer1Valid = !!(state.email && state.email.includes('@') && state.sourceArea && state.name && state.phone);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <RadarBackground />
      {state.step === 'layer1' && (
        <LayerOneForm 
          name={state.name || ''}
          phone={state.phone || ''}
          sourceArea={state.sourceArea || ''}
          email={state.email || ''}
          onChange={handleLayer1Change}
          onSubmit={handleLayer1Submit}
          onStepComplete={handleStepComplete}
          isValid={isLayer1Valid}
        />
      )}
      {state.step === 'layer2' && (
        <LayerTwoQualifier onComplete={handleQualifierComplete} sessionId={state.sessionId} />
      )}
    </main>
  );
}

export default function MarketingGate() {
  return (
    <Suspense fallback={<main className="relative min-h-screen flex items-center justify-center p-4" />}>
      <MarketingGateContent />
    </Suspense>
  );
}
