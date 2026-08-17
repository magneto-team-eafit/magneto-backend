// Puerto: define como el dominio necesita generar y verificar tokens,
// sin saber que por debajo se usa la libreria jsonwebtoken.

export interface IJwtService {
  generar(payload: { usuarioId: string }): string;
  verificar(token: string): { usuarioId: string } | null;
}