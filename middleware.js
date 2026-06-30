import { NextResponse } from 'next/server';

export function middleware(request) {
  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.get('page') === 'gallery') {
    const url = request.nextUrl.clone();
    url.searchParams.delete('page');
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
