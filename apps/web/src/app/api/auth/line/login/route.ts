import { NextResponse } from 'next/server';

export async function GET() {
  const lineClientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI;
  
  if (!lineClientId || !redirectUri) {
    return NextResponse.json({ error: 'LINE Login is not configured. Please set NEXT_PUBLIC_LINE_CLIENT_ID and NEXT_PUBLIC_LINE_REDIRECT_URI.' }, { status: 500 });
  }

  const state = Math.random().toString(36).substring(7);
  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid`;

  return NextResponse.redirect(authUrl);
}
