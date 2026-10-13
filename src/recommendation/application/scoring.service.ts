import { 
  DatosScoringUsuario, 
  DatosScoringVacante,
  DesgloseScore,
} from '../domain/recommendation.types';

export const PESOS_SCORING ={
  ubicacion: 35,
  modalidad: 35,
  palabrasClave: 30,
};

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g," ")
    .trim();
}

// 1. Scoring por Ubicación (máx 35 pts)
function calcularScoreUbicacion(
  ubicacionUsuario?: string | null,
  ubicacionVacante?: string | null
): number {
  if (!ubicacionUsuario?.trim() || !ubicacionVacante?.trim()) return 0;
  
  const normUser = normalizarTexto(ubicacionUsuario);
  const normVac = normalizarTexto(ubicacionVacante);

  return normUser === normVac || normVac.includes(normUser) || normUser.includes(normVac)
  ? PESOS_SCORING.ubicacion
  : 0;
}


function calcularScoreModalidad(
  modalidadUsuario?: string | null,
  modalidadVacante?: string | null
): number {
  if (!modalidadUsuario || !modalidadVacante) return 0;

  const normUser = normalizarTexto(modalidadUsuario);
  const normVac = normalizarTexto(modalidadVacante);

  const modalidades = ["remoto", "hibrido", "presencial"];
  const modalidadUsuario = modalidades.find((m) => normUser.includes(m));
  const modalidadVacante = modalidades.find((m) => normVac.includes(m));

  return modalidadUsuario && modalidadUsuario === modalidadVacante
    ? PESOS_SCORING.modalidad
    : 0;
}


function calcularScorePalabrasClave(
  textoPerfil: string,
  textoVacante: string
): number {

  const stopwords = new Set(["de", "en", "el", "la", "los", "las", "un", "una",
    "y", "o", "con", "para", "por", "del", "que", "como",
    "sus", "su", "al", "se", "es", "a",
  ]);

  const palabrasPerfil = new Set(
    normalizadorTexto(textoPerfil)
      .split(" ")
      .filter((d) => d.length > 2 && !stopwords.has(d))
  );

  if (palabrasPerfil.size === 0) return 0;

  const textoVacanteNormalizado = ` ${normalizarTexto(textoVacante)} `;
  let coincidencias = 0;

  for (const palabra of palabrasPerfil) {
    if (textoVacanteNormalizado.includes(` ${palabra} `)) {
      coincidencias++;
    }
  }

  return Math.round(
    (coincidencias / palabrasUsuario.size)*
      PESOS_SCORING.palabrasClaves *
      100
  ) / 100;
}

export function calcularScore(
  usuario: DatosScoringUsuario,
  vacante: DatosScoringVacante
): {
  score: number;
  desglose: DesgloseScore;
  motivos: string[];
} {
  const desglose: DesgloseScore = {
    ubicacionScore: calcularScoreUbicacion(
      usuario.ubicacion,
      vacante.ubicacion
    ),
    modalidadScore: calcularScoreModalidad(
      usuario.modalidadPreferida,
      vacante.modalidad
    ),
    palabrasClaveScore: calcularScorePalabrasClave(
      usuario.textoPerfil,
      `${vacante.titulo} ${vacante.descripcion}`
    ),
  };

  const score = Math.min(
    100,
    Math.round(
      (
        desglose.ubicacionScore +
        desglose.modalidadScore +
        desglose.palabrasClaveScore
      ) * 100
    ) / 100
  );

  const motivos: string[] = [];

  if (desglose.ubicacionScore > 0) {
    motivos.push("La ubicación coincide con tu perfil.");
  }

  if (desglose.modalidadScore > 0) {
    motivos.push("La modalidad coincide con tu preferencia.");
  }

  if (desglose.palabrasClaveScore > 0) {
    motivos.push("La vacante comparte palabras clave con tu perfil.");
  }

  if (motivos.length === 0) {
    motivos.push(
      "No se encontraron coincidencias claras con los criterios actuales."
    );
  }

  return { score, desglose, motivos };
}
