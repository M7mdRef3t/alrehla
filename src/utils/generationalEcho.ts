import type { MapNode } from "@/modules/map/mapTypes";

type GenerationalEchoTone = "danger" | "caution";

export interface GenerationalEchoSnapshot {
  tone: GenerationalEchoTone;
  title: string;
  summary: string;
  branchLabel: string;
  reasons: string[];
}

function isFamilyNode(node: MapNode): boolean {
  return node.treeRelation?.type === "family" || node.goalId === "family";
}

function isHighPressure(node: MapNode): boolean {
  return Boolean(node.isEmergency) || node.ring === "red" || Boolean(node.detachmentMode) || (node.energyBalance?.netEnergy ?? 0) < 0;
}

function getPattern(node: MapNode): string {
  return node.analysis?.insights?.underlyingPattern?.trim() ?? "";
}

function normalizePattern(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u0610-\u061A\u064B-\u065F]/g, "")
    .replace(/[^\u0600-\u06FFA-Za-z0-9]+/g, "");
}

function sharesPattern(left: string, right: string): boolean {
  const normalizedLeft = normalizePattern(left);
  const normalizedRight = normalizePattern(right);

  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;

  return (
    (normalizedLeft.length >= 8 && normalizedLeft.includes(normalizedRight)) ||
    (normalizedRight.length >= 8 && normalizedRight.includes(normalizedLeft))
  );
}

function getAncestors(node: MapNode, familyById: Map<string, MapNode>): MapNode[] {
  const ancestors: MapNode[] = [];
  const seen = new Set<string>();
  let parentId = node.treeRelation?.parentId ?? null;

  while (parentId != null && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = familyById.get(parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    parentId = parent.treeRelation?.parentId ?? null;
  }

  return ancestors;
}

function buildChildrenMap(nodes: MapNode[]): Map<string, MapNode[]> {
  const childrenMap = new Map<string, MapNode[]>();

  for (const node of nodes) {
    const parentId = node.treeRelation?.parentId;
    if (!parentId) continue;
    const list = childrenMap.get(parentId) ?? [];
    list.push(node);
    childrenMap.set(parentId, list);
  }

  return childrenMap;
}

function collectBranch(root: MapNode, childrenMap: Map<string, MapNode[]>): MapNode[] {
  const branch: MapNode[] = [];
  const stack = [root];
  const seen = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current.id)) continue;
    seen.add(current.id);
    branch.push(current);

    for (const child of childrenMap.get(current.id) ?? []) {
      stack.push(child);
    }
  }

  return branch;
}

function buildFamilyEchoSnapshot(
  node: MapNode,
  root: MapNode,
  stressedBranch: MapNode[],
  matchingRelative: MapNode | null
): GenerationalEchoSnapshot | null {
  if (!matchingRelative && stressedBranch.length < 2) return null;

  const branchLabel = `فرع ${root.label}`;
  const reasons: string[] = [];

  if (matchingRelative) {
    reasons.push(`النمط الحالي يقترب من النمط المسجل مع ${matchingRelative.label}.`);
  }

  if (stressedBranch.length >= 2) {
    reasons.push(`داخل ${branchLabel} توجد ${stressedBranch.length} علاقات تحت ضغط مشابه.`);
  }

  if (node.ring === "red" || node.isEmergency) {
    reasons.push("المدار الحالي يؤكد أن الأثر حاضر في جسدك الآن، وليس مجرد تفسير نظري.");
  }

  if ((node.recoveryProgress?.detachmentReasons?.length ?? 0) > 0) {
    reasons.push("أسباب فك الارتباط المكتوبة تصف نمطًا متكررًا لا حادثة منفصلة.");
  }

  return {
    tone: node.isEmergency || node.ring === "red" || stressedBranch.length >= 3 ? "danger" : "caution",
    title: matchingRelative ? "صدى جيلي ظاهر" : "إشارة نمط متوارث",
    summary: matchingRelative
      ? `${node.label} لا تبدو حالة منفصلة؛ الخيط الذي يظهر هنا يعيد نمطًا أقدم في ${branchLabel}.`
      : `في ${branchLabel} أكثر من علاقة تحمل ضغطًا مشابهًا؛ ما يحدث مع ${node.label} قد يكون امتدادًا لخريطة أقدم.`,
    branchLabel,
    reasons: reasons.slice(0, 3)
  };
}

export function deriveGenerationalEcho(
  node: MapNode,
  allNodes: MapNode[]
): GenerationalEchoSnapshot | null {
  const familyNodes = allNodes.filter(isFamilyNode);
  if (familyNodes.length === 0) return null;

  const familyById = new Map(familyNodes.map((item) => [item.id, item]));
  const childrenMap = buildChildrenMap(familyNodes);

  if (isFamilyNode(node)) {
    const ancestors = getAncestors(node, familyById);
    const root = ancestors[0] ?? node;
    const branch = collectBranch(root, childrenMap);
    const stressedBranch = branch.filter(isHighPressure);
    const matchingRelative =
      [...ancestors].reverse().find((relative) => sharesPattern(getPattern(node), getPattern(relative))) ?? null;

    return buildFamilyEchoSnapshot(node, root, stressedBranch, matchingRelative);
  }

  const currentPattern = getPattern(node);
  if (!currentPattern) return null;

  const matchingFamily =
    familyNodes.find((relative) => relative.id !== node.id && sharesPattern(currentPattern, getPattern(relative))) ??
    null;

  if (!matchingFamily) return null;

  const ancestors = getAncestors(matchingFamily, familyById);
  const root = ancestors[0] ?? matchingFamily;
  const branch = collectBranch(root, childrenMap);
  const stressedBranch = branch.filter(isHighPressure);
  const branchLabel = `فرع ${root.label}`;
  const reasons = [
    `النمط الذي يظهر مع ${node.label} يشبه الخيط المسجل مع ${matchingFamily.label}.`,
    stressedBranch.length >= 2
      ? `في ${branchLabel} توجد ${stressedBranch.length} علاقات تحمل ضغطًا مشابهًا.`
      : `المرجع الأقرب لهذا النمط داخل الجذور العائلية هو ${matchingFamily.label}.`
  ];

  if (node.ring === "red" || node.isEmergency || (node.energyBalance?.netEnergy ?? 0) < 0) {
    reasons.push("الأثر الحالي ليس نظريًا؛ جسدك يسجله الآن كضغط فعلي.");
  }

  return {
    tone: node.isEmergency || node.ring === "red" ? "danger" : "caution",
    title: "الخيط ليس جديدًا",
    summary: `${node.label} لا يبدو حادثًا منفصلًا؛ الخريطة تربطه ب${branchLabel} داخل الجذور العائلية.`,
    branchLabel,
    reasons: reasons.slice(0, 3)
  };
}
