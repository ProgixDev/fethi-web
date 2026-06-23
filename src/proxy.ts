// Supabase SSR session refresh. Runs on every (non-static) request so Server
// Components and the admin route guard always see a fresh session cookie.
// Next 16 renamed the `middleware` convention to `proxy` (see
// node_modules/next/dist/docs/.../proxy.md, AGENTS.md).
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with the auth server and refreshes
  // the cookie. Do not run other logic between createServerClient and getUser.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|woff2?|ico)$).*)',
  ],
};
