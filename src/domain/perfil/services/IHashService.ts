// Puerto: define como el dominio necesita hashear y comparar
// contraseñas, sin saber si por debajo se usa bcrypt, argon2, etc.

export interface IHashService {
    hashear(textoPlano: string): Promise<string>;
    comparar(textoPlano: string, hash: string): Promise<boolean>;
}
