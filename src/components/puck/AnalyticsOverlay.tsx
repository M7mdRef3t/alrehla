"use client";

import React, { useEffect, useState, useRef } from "react";

interface AnalyticsOverlayProps {
  id: string; // The puck map or card id
  children: React.ReactNode;
}

export function AnalyticsOverlay({ id, children }: AnalyticsOverlayProps) {
  const isBrowser = typeof window !== "undefined";
  const isEditor = isBrowser && window.location.pathname.includes("/editor");
  const blockRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState({ views: 0, ctr: 0, loading: true });

  // 1. Fetch real analytics when in Editor Mode
  useEffect(() => {
    if (!isEditor) return;

    let isMounted = true;
    fetch(`/api/editor/analytics?blockId=${id}`)
      .then((res) => res.json())
      .then((resp) => {
        if (isMounted && resp.views !== undefined) {
          setData({ views: resp.views, ctr: resp.ctr, loading: false });
        }
      })
      .catch(() => {
        if (isMounted) setData({ views: 0, ctr: 0, loading: false });
      });

    return () => {
      isMounted = false;
    };
  }, [isEditor, id]);

  // 2. Track real analytics when in User Mode (Intersection Observer)
  useEffect(() => {
    if (isEditor || !blockRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Send Analytics view event
          fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_type: "block_view",
              payload: { block_id: id },
            }),
          }).catch(() => {});
          
          observer.disconnect(); // Only track once per page load
        }
      },
      { threshold: 0.5 } // Track when at least 50% visible
    );

    observer.observe(blockRef.current);
    
    return () => observer.disconnect();
  }, [isEditor, id]);


  if (!isEditor) {
    // Attach tracking for general block clicks
    return (
      <div 
        ref={blockRef} 
        className="w-full relative" 
        onClickCapture={() => {
            fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event_type: "block_click",
                payload: { block_id: id },
            }),
            }).catch(() => {});
        }}
      >
        {children}
      </div>
    );
  }

  const { views, ctr, loading } = data;
  const colorClass = ctr >= 50 ? "bg-primary text-on-primary" : "bg-tertiary text-on-tertiary";

  return (
    <div className="relative group/analytics w-full">
      {/* The actual Puck component */}
      {children}

      {/* The Analytics Overlay (Visible only in editor, shows lightly on hover of the wrapper bounds) */}
      <div className="absolute top-2 left-2 z-50 flex gap-2 opacity-0 group-hover/analytics:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 backdrop-blur-md ${colorClass}`}>
          {loading ? <span>👁️ ...</span> : <span>👁️ {views.toLocaleString("en-US")} views</span>}
        </div>
        <div className="px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant text-xs font-bold shadow-lg flex items-center gap-1 backdrop-blur-md border border-on-surface/10">
          {loading ? <span>🔥 ...</span> : <span>🔥 {ctr}% CTR</span>}
        </div>
      </div>
    </div>
  );
}
