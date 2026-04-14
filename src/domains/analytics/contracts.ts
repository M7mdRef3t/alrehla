import { z } from "zod";

export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
);

const analyticsScalarSchema = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
const analyticsFlatPayloadSchema = z.record(analyticsScalarSchema);
const eventPayloadBaseSchema = z.object({
  pathname: z.string().nullable().optional(),
  page_location: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
  device_type: z.enum(["mobile", "desktop"]).optional(),
  screen_width: z.number().finite().nullable().optional(),
  viewport_height: z.number().finite().nullable().optional(),
});

const internalEventPayloadSchema = eventPayloadBaseSchema.catchall(analyticsScalarSchema);
const blockPayloadSchema = z.object({
  block_id: z.string().min(1).max(256),
}).strict();

const identityLinkedPayloadSchema = z.object({}).strict();
const pageViewPayloadSchema = eventPayloadBaseSchema.extend({
  page_title: z.string().nullable().optional(),
}).catchall(analyticsScalarSchema);

const flowEventPayloadSchema = z.object({
  mode: z.enum(["anonymous", "identified"]),
  step: z.string().min(1).max(128),
  timeToAction: z.number().finite().optional(),
  extra: z.record(jsonValueSchema).optional(),
}).strict();

const pathStartedPayloadSchema = z.object({
  mode: z.enum(["anonymous", "identified"]),
  pathId: z.string().min(1).max(256),
  zone: z.string().min(1).max(128),
  symptomType: z.string().max(128).optional(),
  relationshipRole: z.string().max(128).optional(),
  nodeId: z.string().max(256).optional(),
}).strict();

const taskStartedPayloadSchema = z.object({
  mode: z.enum(["anonymous", "identified"]),
  pathId: z.string().min(1).max(256),
  taskId: z.string().min(1).max(256),
  taskLabel: z.string().max(256).optional(),
  personLabel: z.string().max(256).optional(),
  nodeId: z.string().max(256).optional(),
}).strict();

const taskCompletedPayloadSchema = z.object({
  mode: z.enum(["anonymous", "identified"]),
  pathId: z.string().min(1).max(256),
  taskId: z.string().min(1).max(256),
  date: z.string().min(1).max(64),
  moodScore: z.number().finite().optional(),
  taskLabel: z.string().max(256).optional(),
  personLabel: z.string().max(256).optional(),
  nodeId: z.string().max(256).optional(),
}).strict();

const pathRegeneratedPayloadSchema = z.object({
  mode: z.enum(["anonymous", "identified"]),
  pathId: z.string().min(1).max(256),
  reason: z.string().max(256).optional(),
}).strict();

const nodeAddedPayloadSchema = z.object({
  mode: z.enum(["anonymous", "identified"]),
  ring: z.string().min(1).max(128),
  detachmentMode: z.boolean().optional(),
  isEmergency: z.boolean().optional(),
  personLabel: z.string().max(256).optional(),
  nodeId: z.string().max(256).optional(),
}).strict();

const moodLoggedPayloadSchema = z.object({
  mode: z.enum(["anonymous", "identified"]),
  pathId: z.string().min(1).max(256),
  date: z.string().min(1).max(64),
  moodScore: z.number().finite(),
}).strict();

export const analyticsEnvelopeSchema = z.object({
  event_type: z.string().min(1).max(128).regex(/^[a-z0-9_]+$/),
  client_event_id: z.string().max(128).optional().nullable(),
  anonymous_id: z.string().max(256).optional().nullable(),
  session_id: z.string().max(256).optional().nullable(),
  payload: z.unknown().optional().default({}),
  lead_id: z.string().uuid().optional().nullable(),
  lead_source: z.string().max(128).optional().nullable(),
  utm_source: z.string().max(128).optional().nullable(),
  utm_medium: z.string().max(128).optional().nullable(),
  utm_campaign: z.string().max(128).optional().nullable(),
}).strict();

export function resolveAnalyticsPayloadSchema(eventType: string) {
  if (eventType === "identity_linked") return identityLinkedPayloadSchema;
  if (eventType === "page_view") return pageViewPayloadSchema;
  if (eventType === "block_view" || eventType === "block_click") return blockPayloadSchema;
  if (eventType === "flow_event") return flowEventPayloadSchema;
  if (eventType === "path_started") return pathStartedPayloadSchema;
  if (eventType === "task_started") return taskStartedPayloadSchema;
  if (eventType === "task_completed") return taskCompletedPayloadSchema;
  if (eventType === "path_regenerated") return pathRegeneratedPayloadSchema;
  if (eventType === "node_added") return nodeAddedPayloadSchema;
  if (eventType === "mood_logged") return moodLoggedPayloadSchema;
  return internalEventPayloadSchema.or(analyticsFlatPayloadSchema);
}

export type AnalyticsEnvelope = z.infer<typeof analyticsEnvelopeSchema>;
export type AnalyticsEnvelopeInput = Partial<Omit<AnalyticsEnvelope, "event_type">> & {
  event_type: string;
};

export function buildAnalyticsEnvelope(input: AnalyticsEnvelopeInput): AnalyticsEnvelope | null {
  const sanitizedInput = { ...input } as Record<string, unknown>;
  for (const key of ["lead_id", "client_event_id", "anonymous_id", "session_id"]) {
    if (sanitizedInput[key] === "") {
      sanitizedInput[key] = null;
    }
  }

  const envelopeResult = analyticsEnvelopeSchema.safeParse(sanitizedInput);
  if (!envelopeResult.success) {
    return null;
  }

  const payloadSchema = resolveAnalyticsPayloadSchema(envelopeResult.data.event_type);
  const payloadResult = payloadSchema.safeParse(envelopeResult.data.payload ?? {});
  if (!payloadResult.success) {
    return null;
  }

  return {
    ...envelopeResult.data,
    payload: payloadResult.data,
  };
}

export function buildPageViewEnvelope(
  input: Omit<AnalyticsEnvelopeInput, "event_type" | "payload"> & {
    payload: {
      page_title?: string | null;
      pathname?: string | null;
      page_location?: string | null;
      referrer?: string | null;
      device_type?: "mobile" | "desktop";
      screen_width?: number | null;
      viewport_height?: number | null;
      [key: string]: string | number | boolean | null | undefined;
    };
  }
): AnalyticsEnvelope | null {
  return buildAnalyticsEnvelope({
    ...input,
    event_type: "page_view",
  });
}

export function buildIdentityLinkedEnvelope(
  input: Omit<AnalyticsEnvelopeInput, "event_type" | "payload">,
): AnalyticsEnvelope | null {
  return buildAnalyticsEnvelope({
    ...input,
    event_type: "identity_linked",
    payload: {},
  });
}

export function buildJourneyFlowEnvelope(
  input: Omit<AnalyticsEnvelopeInput, "event_type" | "payload"> & {
    payload: {
      mode: "anonymous" | "identified";
      step: string;
      timeToAction?: number;
      extra?: Record<string, unknown>;
    };
  }
): AnalyticsEnvelope | null {
  return buildAnalyticsEnvelope({
    ...input,
    event_type: "flow_event",
  });
}

export function buildCtaEnvelope(
  input: Omit<AnalyticsEnvelopeInput, "event_type"> & {
    payload: {
      source?: string;
      plan?: string;
      cta_name?: string;
      placement?: string;
      page?: string;
    };
  }
): AnalyticsEnvelope | null {
  return buildAnalyticsEnvelope({
    ...input,
    event_type: "cta_click",
  });
}

export function buildGoalEnvelope(
  input: Omit<AnalyticsEnvelopeInput, "event_type"> & {
    payload: {
      goal_id?: string;
      category?: string;
    };
  }
): AnalyticsEnvelope | null {
  return buildAnalyticsEnvelope({
    ...input,
    event_type: "goal_selected",
  });
}

export function buildAuthEnvelope(
  input: Omit<AnalyticsEnvelopeInput, "event_type"> & {
    payload: {
      trigger?: string;
      method?: string;
      source?: string;
    };
  }
): AnalyticsEnvelope | null {
  return buildAnalyticsEnvelope({
    ...input,
    event_type: "auth_completed",
  });
}

export function buildOnboardingEnvelope(
  input: Omit<AnalyticsEnvelopeInput, "event_type"> & {
    event_type: "onboarding_started" | "onboarding_completed";
    payload: {
      step?: string;
      source?: string;
      mode?: string;
    };
  }
): AnalyticsEnvelope | null {
  return buildAnalyticsEnvelope(input);
}
