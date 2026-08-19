export interface DatosScoringUsuario {
  ubicacion?: string | null;
  modalidadPreferida?: string | null;
  textoPerfil: string; // Unificación de resumen + títulos + cargos
}

export interface DatosScoringVacante {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion?: string | null;
  modalidad?: string | null;
  descripcion: string;
}

export interface RecomendacionResultado {
  vacanteId: string;
  titulo: string;
  empresa: string;
  ubicacion: string | null;
  modalidad: string | null;
  score: number;
  desglose: {
    ubicacionScore: number;
    modalidadScore: number;
    palabrasClaveScore: number;
  };
}
