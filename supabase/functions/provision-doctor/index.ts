import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Verify the caller is a super_admin or org_admin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const callerId = claims.claims.sub as string;

    // Check caller role
    const { data: callerRole } = await anonClient
      .from("user_roles")
      .select("role, organization_id")
      .eq("user_id", callerId)
      .maybeSingle();

    if (!callerRole || !["super_admin", "org_admin"].includes(callerRole.role)) {
      return new Response(JSON.stringify({ error: "Only admins can provision doctors" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { email, password, full_name, specialty, bio, phone, location, consultation_fee, organization_id, is_private } = body;

    if (!email || !password || !full_name || !specialty) {
      return new Response(JSON.stringify({ error: "email, password, full_name, specialty are required" }), { status: 400, headers: corsHeaders });
    }

    // Use service role to create user without affecting caller's session
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Create auth user
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: corsHeaders });
    }

    const userId = newUser.user.id;
    const orgId = organization_id || (callerRole.role === "org_admin" ? callerRole.organization_id : null);

    // 2. Assign doctor role
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role: "doctor",
      organization_id: orgId,
    });

    // 3. Create doctor profile linked to user
    const { data: doctorRecord, error: docErr } = await adminClient.from("doctors").insert({
      user_id: userId,
      full_name,
      specialty,
      bio: bio || null,
      phone: phone || null,
      email,
      location: location || null,
      consultation_fee: consultation_fee ? parseFloat(consultation_fee) : null,
      organization_id: orgId,
      is_private: is_private || false,
      is_approved: true,
    }).select().single();

    if (docErr) {
      // Cleanup: delete user if doctor insert fails
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: docErr.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, doctor: doctorRecord, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
