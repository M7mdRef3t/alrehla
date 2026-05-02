import { getAdminSupabase, verifyAdmin, parseJsonBody } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

export async function handleBroadcasts(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdmin(req, res))) return;
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  if (req.method === "GET") {
    const { data, error } = await client
      .from("admin_broadcasts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) {
      res.status(500).json({ error: "Failed to fetch broadcasts" });
      return;
    }
    res.status(200).json({ broadcasts: data });
    return;
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const { action, id, ...rest } = body as Record<string, any>;

    // Action: SEND
    if (action === "send") {
      if (!id) {
        res.status(400).json({ error: "Missing broadcast id for sending" });
        return;
      }

      const { data: broadcast, error: fetchErr } = await client
        .from("admin_broadcasts")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr || !broadcast) {
        console.error(`[Broadcasts] Fetch for send failed for ID ${id}:`, fetchErr);
        res.status(404).json({ error: "Broadcast not found" });
        return;
      }

      // Execute broadcast by updating system_settings (watched by CoreMapScreen)
      const { error: sendErr } = await client.from("system_settings").upsert({
        key: "sovereign_broadcast",
        value: {
          message: broadcast.body,
          title: broadcast.title,
          id: broadcast.id,
          audience: broadcast.audience || { type: "all" },
          timestamp: Date.now()
        }
      });

      if (sendErr) {
        console.error(`[Broadcasts] Upsert to system_settings failed:`, sendErr);
        res.status(500).json({ error: "Failed to dispatch broadcast to system_settings" });
        return;
      }

      // Mark as sent
      await client.from("admin_broadcasts").update({ sent_at: new Date().toISOString() }).eq("id", id);

      res.status(200).json({ ok: true });
      return;
    }

    // Default: CREATE/INSERT
    const broadcastPayload = {
      title: rest.title,
      body: rest.body,
      audience: rest.audience || { type: "all" },
      created_at: rest.created_at || rest.createdAt || new Date().toISOString()
    };

    if (id) (broadcastPayload as any).id = id;

    const { data, error } = await client
      .from("admin_broadcasts")
      .insert(broadcastPayload)
      .select()
      .single();

    if (error) {
      console.error("[Broadcasts] Insert failed:", error);
      res.status(500).json({ error: "Failed to save broadcast", details: error.message });
      return;
    }

    res.status(200).json({ broadcast: data });
    return;
  }

  if (req.method === "DELETE") {
    const id = req.query?.id || (await parseJsonBody(req))?.id;
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }
    const { error } = await client.from("admin_broadcasts").delete().eq("id", id);
    if (error) {
      res.status(500).json({ error: "Failed to delete broadcast" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}




