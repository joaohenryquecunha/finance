// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const maintenanceMode = true; // Altere para 'false' quando quiser desativar o modo de manutenção

export function middleware(request: NextRequest) {
  // Permitir acesso à própria página de manutenção
  if (request.nextUrl.pathname === '/manutencao') {
    return NextResponse.next();
  }

  // Redirecionar todas as requisições para a página de manutenção
  if (maintenanceMode) {
    const url = request.nextUrl.clone();
    url.pathname = '/manutencao';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
