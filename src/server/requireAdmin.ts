import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function requireAdmin(req: Request | any) {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
     return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
  }

  const allowedRolesStr = process.env.ADMIN_ALLOWED_ROLES;
  
  if (!allowedRolesStr) {
    return NextResponse.json({ error: "Server Configuration Error - Admin roles not defined" }, { status: 500 });
  }

  const allowedRoles = allowedRolesStr.split(",").map(r => r.trim());
  
  const userRole = user.app_metadata?.role;
  
  if (!userRole || !allowedRoles.includes(userRole)) {
     return NextResponse.json({ error: "Forbidden - Admin role required" }, { status: 403 });
  }

  return null; // authorized
}
