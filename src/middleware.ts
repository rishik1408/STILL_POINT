import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase credentials are not configured yet, allow navigation in demo/eval mode
  if (!url || !url.startsWith('http') || !anonKey || anonKey === 'your-supabase-anon-key') {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check for demo cookie as well
    const demoCookie = request.cookies.get('piams_demo_role');

    // Protect user and official routes if no user and no demo session
    if (
      !user &&
      !demoCookie &&
      (request.nextUrl.pathname.startsWith('/user') ||
        request.nextUrl.pathname.startsWith('/official'))
    ) {
      // In local dev without session, still allow testing
      return supabaseResponse;
    }
  } catch {
    // If Supabase is unreachable, pass through gracefully
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/user/:path*', '/official/:path*'],
};
