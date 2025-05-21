// Função utilitária para calcular dias restantes de acesso
export function getDiasRestantes(accessDuration?: number, createdAt?: string): number {
  if (!accessDuration || !createdAt) return 0;
  const startTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const remainingSeconds = accessDuration - elapsedSeconds;
  return Math.max(0, Math.ceil(remainingSeconds / (24 * 60 * 60)));
}

// Função utilitária para formatar o tempo restante de acesso (dias, horas, minutos)
export function formatTempoRestante(accessDuration?: number, createdAt?: string): string {
  if (!accessDuration || !createdAt) return 'Expirado';
  const startTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const remainingSeconds = accessDuration - elapsedSeconds;
  if (remainingSeconds <= 0) return 'Expirado';
  const days = Math.floor(remainingSeconds / (24 * 60 * 60));
  const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  if (days > 0) {
    return `${days} ${days === 1 ? 'dia' : 'dias'} de acesso`;
  }
  return `${hours}h ${minutes}min de acesso`;
}
