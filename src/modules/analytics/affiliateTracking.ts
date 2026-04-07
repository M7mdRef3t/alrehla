import { recordFlowEvent } from "@/services/journeyTracking";
import { runtimeEnv } from "@/config/runtimeEnv";

const DEFAULT_AFFILIATE_DOMAINS = [
  "youtube.com",
  "youtu.be"
];

const AFFILIATE_QUERY_HINTS = [
  "ref",
  "aff",
  "affid",
  "aff_id",
  "affiliate",
  "partner",
  "utm_campaign",
  "utm_source"
];

const exposedLinkKeys = new Set<string>();

let cachedWhitelist: Set<string> | null = null;

export interface AffiliateTrackingContext {
  placement?: string;
  contentId?: string;
  linkId?: string;
  title?: string;
  missionKey?: string;
  missionLabel?: string;
  ring?: string;
  scenarioKey?: string;
}

function parseWhitelistFromEnv(): string[] {
  const raw = String(runtimeEnv.affiliateWhitelist ?? "").trim();
  if (!raw) return DEFAULT_AFFILIATE_DOMAINS;
  const fromEnv = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.length === 0) return DEFAULT_AFFILIATE_DOMAINS;
  return Array.from(new Set([...DEFAULT_AFFILIATE_DOMAINS, ...fromEnv]));
}

function getWhitelist(): Set<string> {
  if (cachedWhitelist) return cachedWhitelist;
  cachedWhitelist = new Set(parseWhitelistFromEnv());
  return cachedWhitelist;
}

function toUrl(rawUrl: string): URL | null {
  const safeRaw = String(rawUrl ?? "").trim();
  if (!safeRaw) return null;
  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "https://dawayir.app";
  try {
    return new URL(safeRaw, baseOrigin);
  } catch {
    return null;
  }
}

function isWhitelistedHost(hostname: string): boolean {
  const safeHost = hostname.trim().toLowerCase();
  if (!safeHost) return false;
  const whitelist = getWhitelist();
  if (whitelist.has(safeHost)) return true;
  for (const domain of whitelist) {
    if (safeHost.endsWith(`.${domain}`)) return true;
  }
  return false;
}

function hasAffiliateHint(url: URL): boolean {
  for (const key of AFFILIATE_QUERY_HINTS) {
    if (url.searchParams.has(key)) return true;
  }
  return false;
}

function shouldTrack(url: URL): boolean {
  return isWhitelistedHost(url.hostname) || hasAffiliateHint(url);
}

function buildMeta(url: URL, context?: AffiliateTrackingContext): Record<string, unknown> {
  return {
    url: url.toString(),
    domain: url.hostname.toLowerCase(),
    placement: context?.placement ?? "unknown",
    ...(context?.contentId ? { contentId: context.contentId } : {}),
    ...(context?.linkId ? { linkId: context.linkId } : {}),
    ...(context?.title ? { title: context.title } : {}),
    ...(context?.missionKey ? { missionKey: context.missionKey } : {}),
    ...(context?.missionLabel ? { missionLabel: context.missionLabel } : {}),
    ...(context?.ring ? { ring: context.ring } : {}),
    ...(context?.scenarioKey ? { scenarioKey: context.scenarioKey } : {})
  };
}

function getExposureKey(url: URL, context?: AffiliateTrackingContext): string {
  const placement = context?.placement ?? "unknown";
  const identity = context?.linkId || context?.contentId || url.toString();
  return `${placement}::${identity}`;
}

export function trackAffiliateLinkExposed(rawUrl: string, context?: AffiliateTrackingContext): boolean {
  const url = toUrl(rawUrl);
  if (!url || !shouldTrack(url)) return false;

  const key = getExposureKey(url, context);
  if (exposedLinkKeys.has(key)) return false;
  exposedLinkKeys.add(key);

  recordFlowEvent("affiliate_link_exposed", {
    meta: buildMeta(url, context)
  });
  return true;
}

export function trackAffiliateLinkClicked(rawUrl: string, context?: AffiliateTrackingContext): boolean {
  const url = toUrl(rawUrl);
  if (!url || !shouldTrack(url)) return false;

  recordFlowEvent("affiliate_link_clicked", {
    meta: buildMeta(url, context)
  });
  return true;
}
