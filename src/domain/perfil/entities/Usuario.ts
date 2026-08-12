// Entidad de dominio: representa el concepto de Usuario en el negocio.

export class Usuario {
    private constructor (
        public readonly id: string, // readonly significa que una vez que el objeto se crea
        public readonly email: string, // el valor no se puede cambiar despues.
        public readonly passwordHash: string,
        public readonly createdAt: Date
)   {}
    
// Aca creamos un usuario nuevo y se validan las reglas
// de negocio antes de que el objeto llegue a existir.

    static crear(props: { id: string; email: string; passwordHash: string}): Usuario {
        if(!Usuario.esEmailValido(props.email)) {
            throw new Error("El email no tiene un formato valido");
        }

        return new Usuario(props.id, props.email, props.passwordHash, new Date());
    }

    // Se usa cuando el usaurio ya existe en la base de datos y solo
    // queremos convertir esos datos en un objeto Usuario,
    // sin repetir las validaciones de creacion
    static reconstruir(props: {
        id: string;
        email: string;
        passwordHash: string;
        createdAt: Date;
    }): Usuario {
        return new Usuario(props.id, props.email, props.passwordHash, props.createdAt);
    }

    private static esEmailValido(email: string) {
        const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return patron.test(email); 
    }
}