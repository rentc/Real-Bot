import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_please_change_me');

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  
  const redirectUri = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI || '';
  const BASE_URL = redirectUri ? new URL(redirectUri).origin : req.nextUrl.origin;
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', BASE_URL));
  }

  const lineClientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
  const lineClientSecret = process.env.LINE_CLIENT_SECRET;

  try {
    if (!lineClientId || !lineClientSecret || !redirectUri) {
      throw new Error(`Missing config: ID=${!!lineClientId}, SECRET=${!!lineClientSecret}, URI=${!!redirectUri}`);
    }

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri!,
        client_id: lineClientId!,
        client_secret: lineClientSecret!,
      }),
    });
    
    if (!tokenRes.ok) throw new Error('Failed to fetch LINE token');
    const tokenData = await tokenRes.json();
    
    // 2. Fetch user profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!profileRes.ok) throw new Error('Failed to fetch LINE profile');
    const profile = await profileRes.json();
    const lineUserId = profile.userId;
    
    // 3. Verify Role against the backend
    const groupsRes = await fetch(`${API_URL}/groups`);
    const groups = await groupsRes.json();
    
    let userRole = 'CUSTOMER';
    let isAdminOrStaff = false;
    
    for (const g of groups) {
      const gRes = await fetch(`${API_URL}/groups/${g.id}`);
      if (gRes.ok) {
        const gData = await gRes.json();
        const memberships = gData.memberships || [];
        const membership = memberships.find((m: any) => m.id === lineUserId);
        if (membership) {
          if (membership.role === 'ADMIN' || membership.role === 'STAFF') {
            userRole = membership.role;
            isAdminOrStaff = true;
            break;
          }
        }
      }
    }
    
    if (!isAdminOrStaff) {
      return NextResponse.redirect(new URL('/login?error=access_denied', BASE_URL));
    }
    
    // 4. Create JWT and set cookie
    const token = await new SignJWT({ lineUserId, role: userRole, name: profile.displayName, picture: profile.pictureUrl })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
      
    const response = NextResponse.redirect(new URL('/', BASE_URL));
    response.cookies.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    return response;
    
  } catch (err: any) {
    console.error(err);
    const errorMessage = err.message || 'unknown_error';
    return NextResponse.redirect(new URL(`/login?error=auth_failed&detail=${encodeURIComponent(errorMessage)}`, BASE_URL));
  }
}
