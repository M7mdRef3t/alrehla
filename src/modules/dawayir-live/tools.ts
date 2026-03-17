import type { ToolName } from "./types";

export const LOCAL_TOOL_NAMES = new Set<ToolName>([
  "update_node",
  "highlight_node",
  "update_journey",
  "spawn_other",
  "spawn_topic",
  "connect_topics",
  "map_thought",
]);

export const SERVER_TOOL_NAMES = new Set<ToolName>([
  "get_expert_insight",
  "save_mental_map",
  "generate_session_report",
  "create_truth_contract",
]);

export const LIVE_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: "update_node",
        description:
          "Update one of the three core circles. Use only when a circle visibly needs to expand, calm, or change color.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "Circle id: 1, 2, or 3." },
            radius: { type: "NUMBER", description: "Circle radius between 30 and 100." },
            color: { type: "STRING", description: "Hex color for the circle." },
            fluidity: { type: "NUMBER", description: "Fluidity between 0 and 1." },
            topic: { type: "STRING", description: "Short topic reflected by this circle." },
            reason: { type: "STRING", description: "One-line why-now explanation in Arabic." },
          },
          required: ["id"],
        },
      },
      {
        name: "highlight_node",
        description: "Highlight one of the core circles for emphasis.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "Circle id: 1, 2, or 3." },
            reason: { type: "STRING", description: "Short emphasis cue." },
          },
          required: ["id"],
        },
      },
      {
        name: "get_expert_insight",
        description: "Request a grounded platform-native insight about a topic or pattern.",
        parameters: {
          type: "OBJECT",
          properties: {
            topic: { type: "STRING", description: "Topic that needs expert framing." },
            context: { type: "STRING", description: "Short surrounding context." },
          },
          required: ["topic"],
        },
      },
      {
        name: "save_mental_map",
        description: "Persist the current map and derived relationships as an artifact.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Optional map title." },
            summary: { type: "STRING", description: "Optional summary." },
          },
        },
      },
      {
        name: "generate_session_report",
        description: "Generate and persist a structured session report.",
        parameters: {
          type: "OBJECT",
          properties: {
            focus: { type: "STRING", description: "Primary focus of the report." },
          },
        },
      },
      {
        name: "create_truth_contract",
        description: "Generate and persist a truth contract from the session.",
        parameters: {
          type: "OBJECT",
          properties: {
            focus: { type: "STRING", description: "What the contract should center on." },
          },
        },
      },
      {
        name: "update_journey",
        description: "Update the journey stage shown in the live HUD.",
        parameters: {
          type: "OBJECT",
          properties: {
            stage: {
              type: "STRING",
              description: "One of Overwhelmed, Focus, or Clarity.",
            },
          },
          required: ["stage"],
        },
      },
      {
        name: "spawn_other",
        description: "Add a person or external pressure around the core circles.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Name of the other." },
            tension: { type: "NUMBER", description: "Tension score between 0 and 1." },
            color: { type: "STRING", description: "Hex color." },
          },
          required: ["name"],
        },
      },
      {
        name: "spawn_topic",
        description: "Add a topic around the live canvas.",
        parameters: {
          type: "OBJECT",
          properties: {
            topic: { type: "STRING", description: "Topic label." },
            weight: { type: "NUMBER", description: "Importance score between 0 and 1." },
            color: { type: "STRING", description: "Hex color." },
          },
          required: ["topic"],
        },
      },
      {
        name: "connect_topics",
        description: "Draw a relation between two spawned topics.",
        parameters: {
          type: "OBJECT",
          properties: {
            from: { type: "STRING", description: "Source topic label." },
            to: { type: "STRING", description: "Target topic label." },
            weight: { type: "NUMBER", description: "Strength between 0 and 1." },
            reason: { type: "STRING", description: "Why these topics connect." },
          },
          required: ["from", "to"],
        },
      },
    ],
  },
] as const;
