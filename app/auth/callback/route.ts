import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const origin = url.origin;

    if (!code) {
        return NextResponse.redirect(`${origin}/?error=missing_code`);
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("Authentication failed:", error.message);

        return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    return NextResponse.redirect(`${origin}/dashboard`);
}