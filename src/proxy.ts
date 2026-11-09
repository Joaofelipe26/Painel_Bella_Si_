import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_SESSAO, tokenValido } from '@/auth/sessao';

/** Sem sessão válida, toda página vai para /entrar. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const valido = await tokenValido(request.cookies.get(COOKIE_SESSAO)?.value);

  if (pathname === '/entrar') {
    return valido ? NextResponse.redirect(new URL('/hoje', request.url)) : NextResponse.next();
  }
  if (!valido) {
    return NextResponse.redirect(new URL('/entrar', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webmanifest)$).*)'],
};
