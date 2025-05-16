// Função utilitária para calcular dias restantes de acesso
export function getDiasRestantes(accessDuration?: number, createdAt?: string): number {
  if (!accessDuration || !createdAt) return 0;
  const startTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const remainingSeconds = accessDuration - elapsedSeconds;
  return Math.max(0, Math.ceil(remainingSeconds / (24 * 60 * 60)));
}
