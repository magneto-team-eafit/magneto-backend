import { DatosScoringUsuario, DatosScoringVacante } from '../domain/recommendation.types';

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "");
}

// 1. Scoring por Ubicación (máx 35 pts)
function calcularScoreUbicacion(
  ubicacionUsuario?: string | null,
  ubicacionVacante?: string | null
): number {
  if (!ubicacionUsuario || !ubicacionVacante) return 0;
  
  const normUser = normalizarTexto(ubicacionUsuario);
  const normVac = normalizarTexto(ubicacionVacante);

  if (normUser === normVac || normVac.includes(normUser) || normUser.includes(normVac)) {
    return 35;
  }
  return 0;
}

// 2. Scoring por Modalidad (máx 35 pts)
function calcularScoreModalidad(
  modalidadUsuario?: string | null,
  modalidadVacante?: string | null
): number {
  if (!modalidadUsuario || !modalidadVacante) return 0;

  const normUser = normalizarTexto(modalidadUsuario);
  const normVac = normalizarTexto(modalidadVacante);

  if (normUser === normVac) return 35;
  if (normUser.includes("remoto") && normVac.includes("remoto")) return 35;
  if (normUser.includes("hibrid") && normVac.includes("hibrid")) return 35;
  if (normUser.includes("presencial") && normVac.includes("presencial")) return 35;

  return 0;
}

// 3. Scoring por Palabras Clave (máx 30 pts)
function calcularScorePalabrasClave(
  textoPerfil: string,
  textoVacante: string
): number {
  const userNorm = normalizarTexto(textoPerfil);
  const vacNorm = normalizarTexto(textoVacante);

  const stopwords = new Set(["de", "en", "el", "la", "los", "las", "un", "una", "y", "o", "con", "para", "por", "del", "que"]);

  const palabrasUsuario = new Set(
    userNorm.split(/\s+/).filter(p => p.length > 2 && !stopwords.has(p))
  );

  if (palabrasUsuario.size === 0) return 0;

  let coincidencias = 0;
  palabrasUsuario.forEach(palabra => {
    if (vacNorm.includes(palabra)) {
      coincidencias++;
    }
  });

  const porcentaje = coincidencias / palabrasUsuario.size;
  return Math.min(30, Math.round(porcentaje * 30 * 100) / 100);
}

export function calcularScore(
  usuario: DatosScoringUsuario,
  vacante: DatosScoringVacante
) {
  const ubicacionScore = calcularScoreUbicacion(usuario.ubicacion, vacante.ubicacion);
  const modalidadScore = calcularScoreModalidad(usuario.modalidadPreferida, vacante.modalidad);
  
  const textoVacante = `${vacante.titulo} ${vacante.descripcion}`;
  const palabrasClaveScore = calcularScorePalabrasClave(usuario.textoPerfil, textoVacante);

  const totalScore = Math.min(100, ubicacionScore + modalidadScore + palabrasClaveScore);

  return {
    score: Math.round(totalScore * 100) / 100,
    desglose: {
      ubicacionScore,
      modalidadScore,
      palabrasClaveScore
    }
  };
}
