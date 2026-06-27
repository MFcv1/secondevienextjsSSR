import { NextResponse } from 'next/server';

export function middleware(request) {
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/galerie';
    url.searchParams.delete('page');
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
