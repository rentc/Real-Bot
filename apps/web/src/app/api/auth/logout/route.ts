import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const response = NextResponse.redirect(new URL('/login', url.origin));
  response.cookies.delete('__session');
  return response;
}
