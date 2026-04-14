import { getAdminSupabase, recordAdminAudit } from "./_shared";
import { sendMetaCapiEvent } from "../../src/server/metaCapi";
import { headers } from "next/headers";

export async function handleTicketsResolve(req: any, res: any) {
    const admin = getAdminSupabase();
    if (!admin) {
        return res.status(503).json({ error: "Service unavailable" });
    }

    if (req.method === "GET") {
        const { data, error } = await admin
            .from("support_tickets")
            .select("*")
            .eq("category", "payment_activation")
            .eq("status", "open")
            .order("created_at", { ascending: true });

        if (error) {
            return res.status(500).json({ error: "Failed to fetch tickets" });
        }

        return res.status(200).json({ tickets: data });
    }

    if (req.method === "POST") {
        const body = req.body ?? {};
        const { action, ticketId, userId, email, phone, reason } = body;

        if (!ticketId) {
            return res.status(400).json({ error: "Missing ticket_id" });
        }

        if (action === "resolve") {
            let activeUserId = userId;

            if (!activeUserId) {
                if (!email && !phone) {
                    return res.status(400).json({ error: "Missing user_id, email, and phone for resolution" });
                }
                
                // Ensure email or phone is passed
                const userParams: any = {
                    email_confirm: true,
                    phone_confirm: true
                };
                if (email) userParams.email = email;
                if (phone) userParams.phone = phone;

                const { data: newUser, error: createError } = await admin.auth.admin.createUser(userParams);
                if (createError) {
                    // If creation fails (e.g. "User already registered"), try to fetch their ID from profiles
                    let existingId = null;
                    if (email) {
                        const { data } = await admin.from("profiles").select("id").eq("email", email).limit(1).single();
                        if (data?.id) existingId = data.id;
                    }
                    if (!existingId && phone) {
                        const { data } = await admin.from("profiles").select("id").eq("phone", phone).limit(1).single();
                        if (data?.id) existingId = data.id;
                    }

                    if (existingId) {
                        activeUserId = existingId;
                    } else {
                        return res.status(500).json({ error: "Failed to auto-provision user, and could not find existing profile.", details: createError.message });
                    }
                } else {
                    activeUserId = newUser?.user?.id;
                }
            }

            if (!activeUserId) {
                return res.status(500).json({ error: "Failed to resolve user ID" });
            }

            // 0. Fetch existing ticket to keep metadata intact
            const { data: ticket } = await admin.from("support_tickets").select("metadata").eq("id", ticketId).single();
            const existingMeta = ticket?.metadata || {};

            // 1. Mark ticket resolved and attach verified activeUserId
            const { error: ticketError } = await admin
                .from("support_tickets")
                .update({ 
                    status: "resolved", 
                    updated_at: new Date().toISOString(),
                    metadata: { ...existingMeta, user_id: activeUserId, auto_provisioned: !userId } 
                })
                .eq("id", ticketId);

            if (ticketError) {
                return res.status(500).json({ error: "Failed to resolve ticket" });
            }

            // 2. Update user profile to active (upsert in case it was auto-provisioned and has no profile)
            const { error: profileError } = await admin
                .from("profiles")
                .upsert({ id: activeUserId, subscription_status: "active" }, { onConflict: "id" });

            if (profileError) {
                return res.status(500).json({ error: "Failed to update profile", details: profileError.message });
            }

            // 3. Send Meta CAPI event
            // Note: Since this is purely admin firing the event for the user, 
            // the IP/Agent belong to the admin. But we at least pass email/phone for matching.
            if (email || phone) {
                try {
                    const headersList = headers();
                    const clientIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "";
                    const clientUserAgent = headersList.get("user-agent") || "";
                    
                    await sendMetaCapiEvent({
<<<<<<< HEAD
                        eventName: "CompleteRegistration",
=======
                        eventName: "GateQualified",
>>>>>>> feat/sovereign-final-stabilization
                        eventId: ticketId || `admin-${userId}-${Date.now()}`,
                        sourceUrl: "https://alrehla.app/admin/tickets",
                        userData: {
                            email: email || null,
                            phone: phone || null,
                            clientIpAddress: clientIp,
                            clientUserAgent: clientUserAgent,
                        }
                    });
                } catch (e) {
                    console.error("Meta CAPI failed on manual activation", e);
                }
            }

<<<<<<< HEAD
            await recordAdminAudit(req, "ticket_activated", { ticketId, userId });
=======
            await recordAdminAudit(req, "revenue_access_unlocked", {
                ticketId,
                userId,
                activationUnlocked: true,
                subscriptionStatus: "active"
            });
>>>>>>> feat/sovereign-final-stabilization
            return res.status(200).json({ ok: true });
        }

        if (action === "reject") {
            // 1. Mark ticket rejected
            const { error: ticketError } = await admin
                .from("support_tickets")
                .update({ 
                    status: "closed", 
                    updated_at: new Date().toISOString(),
                    metadata: { rejection_reason: reason || "Admin Rejected" }
                })
                .eq("id", ticketId);

            if (ticketError) {
                return res.status(500).json({ error: "Failed to reject ticket" });
            }

            await recordAdminAudit(req, "ticket_rejected", { ticketId, reason });
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
