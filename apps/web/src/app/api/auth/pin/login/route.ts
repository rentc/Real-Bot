import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode('super_secret_jwt_key_wrc_ai_sales_2026_fixed');

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (pin === '1001') {
      const token = await new SignJWT({ 
        lineUserId: 'admin_pin_user', 
        role: 'ADMIN', 
        name: 'Admin User', 
        picture: '' 
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);
        
      const response = NextResponse.json({ success: true });
      response.cookies.set('__session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      
      return response;
    } else {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
