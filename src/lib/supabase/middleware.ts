import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });
  const { error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[supabase/middleware] auth.getUser failed", {
      message: authError.message,
      name: authError.name,
      status: (authError as { status?: number }).status,
    });
    if (process.env.NODE_ENV === "development") {
      console.error("[supabase/middleware] auth.getUser (full)", authError);
    }
  }
  return supabaseResponse;
}
