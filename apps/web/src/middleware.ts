import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode('super_secret_jwt_key_wrc_ai_sales_2026_fixed');

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('__session')?.value;
  const isLoginPage = req.nextUrl.pathname.startsWith('/login');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  
  if (isApiRoute) {
    return NextResponse.next();
  }

  if (!token) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    
    if (role === 'CUSTOMER') {
      if (!isLoginPage) {
        return NextResponse.redirect(new URL('/login?error=access_denied', req.url));
      }
    } else {
      if (isLoginPage) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    
    return NextResponse.next();
  } catch (err: any) {
    if (!isLoginPage) {
      const errorMessage = err.message || 'unknown_error';
      const response = NextResponse.redirect(new URL(`/login?error=auth_failed&detail=${encodeURIComponent('middleware: ' + errorMessage)}`, req.url));
      response.cookies.delete('__session');
      return response;
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
