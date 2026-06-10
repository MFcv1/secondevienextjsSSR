import { NextResponse } from 'next/server';

export function middleware(request) {
  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.get('page') === 'gallery') {
    const host = request.headers.get('host') || request.nextUrl.host;
    const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(/:$/, '');
    const url = new URL(`${protocol}://${host}/galerie`);
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
