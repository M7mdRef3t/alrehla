import type { FC } from 'react';


export interface FlowNode {
  id: string;
  scenarioLabel: string;
  title: string;
  action: string;
  count?: number;
  variant: "root" | "branch" | "sub";
  accent?: "teal" | "amber" | "rose" | "slate";
}

export interface FlowMapActionEvent {
  action: string;
  nodeId?: string | null;
  nodeTitle?: string | null;
  payload?: Record<string, unknown>;
}

export interface FlowMindMapProps {
  nodes: FlowNode[];
  links: Array<[string, string]>;
  showReset?: boolean;
  allowAddCards?: boolean;
  nodeMetrics?: Record<string, { conversionRate: number | null; dropOffCount: number | null }> | null;
  onAction?: (event: FlowMapActionEvent) => void;
}

export type Position = { x: number; y: number };
export type FlowNodeOverride = {
  scenarioLabel?: string;
  title?: string;
  action?: string;
};
export type EditorMode = "add" | "edit";
export type FlowSnapshot = {
  customNodes: FlowNode[];
  customLinks: Array<[string, string]>;
  positions: Record<string, Position>;
  baseOverrides: Record<string, FlowNodeOverride>;
  hiddenBaseNodeIds: Set<string>;
  lockedNodeIds: Set<string>;
};
