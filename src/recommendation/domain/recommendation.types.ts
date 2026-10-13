export interface DatosScoringUsuario {
  ubicacion?: string | null;
  modalidadPreferida?: string | null;
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

export interface DesgloseScore {
    ubicacionScore: number;
    modalidadScore: number;
    palabrasClaveScore: number;
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
