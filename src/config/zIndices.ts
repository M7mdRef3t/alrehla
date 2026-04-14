/**
 * Dawayir Overlay Architecture - Z-Index Registry
 * 
 * This file defines the visual hierarchy of the application.
 * Follows the "Sovereign Layering" principles to prevent UI bleeding and cognitive choking.
 */

export const Z_LAYERS = {
  // Layer 0: The Deep Void (Backgrounds)
  VOID_ATMOSPHERE: -1,
  BASE: 0,
  
  // Layer 1: The Map Surface (Canvas, Nodes, Edges)
  MAP_SURFACE: 1,
  MAP_GIZMOS: 10,
  
  // Layer 2: Surface UI (Nav, Sidebars, Tabs)
  NAVIGATION_BARS: 40,
  BREADCRUMBS: 41,
  SIDEBAR: 42,
  
  // Layer 3: Experience Overlays (Modals, Chat, Basic Modals)
  MODAL_BACKDROP: 50,
  MODAL_CONTENT: 60,
  
  // Layer 4: Tactical Overlays (Pulse Check, Sanctuary, Critical Wizards)
  TACTICAL_BACKDROP: 100,
  TACTICAL_CONTENT: 110,
  
  // Layer 5: System Critical (Whispers, Emergency Alerts, Toasts)
  SYSTEM_WHISPER: 150,
  SYSTEM_EMERGENCY: 160,
  SYSTEM_TOAST: 200,
  
  // Layer 6: Meta (Consent Banners, Dev Tools)
  CONSENT_BANNER: 250,
  DEV_TOOLS: 999
} as const;

export type ZLayer = keyof typeof Z_LAYERS;
