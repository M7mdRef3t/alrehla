import { getServiceSupabase, getDeviceToken, getAuthUserId, parseJsonBody } from "./_shared";

const TABLE = "user_state";

function filterData(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(input).forEach(([key, value]) => {
    if (!key.startsWith("dawayir-")) return;
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

export default async function handler(req: any, res: any) {
  const client = getServiceSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  const deviceToken = getDeviceToken(req);
  const ownerId = await getAuthUserId(req, client);
  if (!deviceToken && !ownerId) {
    res.status(401).json({ error: "Missing identity" });
    return;
  }
  const finalDeviceToken = deviceToken ?? (ownerId ? `user_${ownerId}` : null);

  if (req.method === "GET") {
    if (ownerId) {
      const { data: ownerRow, error } = await client
        .from(TABLE)
        .select("data, device_token, owner_id")
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (error) {
        res.status(500).json({ error: "Failed to fetch user state" });
        return;
      }
      if (ownerRow?.data) {
        res.status(200).json({ data: ownerRow.data ?? {} });
        return;
      }
      if (deviceToken) {
        const { data: deviceRow } = await client
          .from(TABLE)
          .select("data, device_token")
          .eq("device_token", deviceToken)
          .maybeSingle();
        if (deviceRow?.data) {
          await client.from(TABLE).update({
            owner_id: ownerId,
            updated_at: new Date().toISOString()
          }).eq("device_token", deviceToken);
          res.status(200).json({ data: deviceRow.data ?? {} });
          return;
        }
      }
      res.status(200).json({ data: {} });
      return;
    }

    const { data, error } = await client
      .from(TABLE)
      .select("data")
      .eq("device_token", deviceToken)
      .maybeSingle();
    if (error) {
      res.status(500).json({ error: "Failed to fetch user state" });
      return;
    }
    res.status(200).json({ data: data?.data ?? {} });
    return;
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const updates = filterData(body?.data && typeof body.data === "object" ? body.data : body ?? {});
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No data provided" });
      return;
    }

    const existingByOwner = ownerId
      ? await client.from(TABLE).select("data, device_token, owner_id").eq("owner_id", ownerId).maybeSingle()
      : null;
    const existingByDevice = finalDeviceToken
      ? await client.from(TABLE).select("data, device_token, owner_id").eq("device_token", finalDeviceToken).maybeSingle()
      : null;

    const ownerError = existingByOwner?.error;
    const deviceError = existingByDevice?.error;
    if (ownerError || deviceError) {
      res.status(500).json({ error: "Failed to read existing data" });
      return;
    }
    const existingOwnerRow = existingByOwner?.data ?? null;
    const existingDeviceRow = existingByDevice?.data ?? null;

    const merged = {
      ...(existingOwnerRow?.data ?? existingDeviceRow?.data ?? {}),
      ...updates
    };

    let error: { message?: string } | null = null;
    if (existingDeviceRow && finalDeviceToken) {
      const { error: updateError } = await client.from(TABLE).update({
        data: merged,
        owner_id: ownerId ?? existingDeviceRow.owner_id ?? null,
        updated_at: new Date().toISOString()
      }).eq("device_token", finalDeviceToken);
      error = updateError;
    } else if (existingOwnerRow && ownerId) {
      const { error: updateError } = await client.from(TABLE).update({
        data: merged,
        device_token: finalDeviceToken,
        updated_at: new Date().toISOString()
      }).eq("owner_id", ownerId);
      error = updateError;
    } else {
      const { error: insertError } = await client.from(TABLE).insert({
        device_token: finalDeviceToken,
        owner_id: ownerId ?? null,
        data: merged,
        updated_at: new Date().toISOString()
      });
      error = insertError;
    }

    if (error) {
      res.status(500).json({ error: "Failed to save user state" });
      return;
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
