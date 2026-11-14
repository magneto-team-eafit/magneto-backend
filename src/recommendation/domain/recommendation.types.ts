// Datos del usuario que el motor de scoring necesita (ya "aplanados":
// el servicio arma esto a partir de las tablas del perfil).
export interface DatosScoringUsuario {
  ubicacion?: string | null;
  modalidadPreferida?: string | null;
  // Habilidades declaradas en el perfil (una por elemento).
  habilidades: string[];
  // Texto libre del perfil: resumen + cargos + titulos de estudio.
  textoPerfil: string;
}

export interface DatosScoringVacante {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion?: string | null;
  modalidad?: string | null;
  descripcion: string;
}

// Cada criterio tiene su puntaje y su maximo posible (en "maximos"), para que
// el frontend muestre "12 / 40" sin tener los pesos escritos a mano.
export interface DesgloseScore {
  habilidades: number;
  palabrasClave: number;
  ubicacion: number;
  modalidad: number;
  maximos: {
    habilidades: number;
    palabrasClave: number;
    ubicacion: number;
    modalidad: number;
  };
}

export interface RecomendacionResultado {
  vacanteId: string;
  titulo: string;
  empresa: string;
  ubicacion: string | null;
  modalidad: string | null;
  score: number;
  desglose: DesgloseScore;
  motivos: string[];
}
