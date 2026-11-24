import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authService } from "@/shared/infrastructure/auth/auth-service";
import { getExpiredSessionCookieOptions, SESSION_COOKIE_NAME } from "@/shared/lib/session";

async function performLogout(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await authService.revokeSession(sessionToken);
  }

  const expiredOptions = getExpiredSessionCookieOptions();
  cookieStore.set(expiredOptions.name, expiredOptions.value, {
    httpOnly: expiredOptions.httpOnly,
    secure: expiredOptions.secure,
    sameSite: expiredOptions.sameSite,
    path: expiredOptions.path,
    expires: expiredOptions.expires,
    maxAge: expiredOptions.maxAge,
  });

  const url = new URL("/", request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request): Promise<NextResponse> {
  return performLogout(request);
}

export async function GET(request: Request): Promise<NextResponse> {
  return performLogout(request);
}
