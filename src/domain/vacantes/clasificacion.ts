// Reglas simples para clasificar una vacante a partir de su titulo.
// El dataset no trae nivel de experiencia, asi que se infiere por palabras.
// Se usa en el seed (prisma/seed-vacantes.ts) y para estimar salarios.

export type NivelExperiencia = "Entry level" | "Associate" | "Mid-Senior level" | "Director";

export function normalizarTitulo(texto: string): string {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Busca la palabra completa (no un pedazo): "sr" no debe encontrarse dentro de "asesor".
function contiene(texto: string, palabras: string[]): boolean {
    return palabras.some((p) => new RegExp(`(^|[^a-z])${p}([^a-z]|$)`).test(texto));
}

const DIRECCION = ["director", "directora", "gerente", "vp", "presidente", "head"];
const SENIOR = ["senior", "sr", "lider", "jefe", "jefa", "coordinador", "coordinadora", "especialista", "arquitecto", "arquitecta", "supervisor", "supervisora"];
const ASOCIADO = ["analista", "ingeniero", "ingeniera", "desarrollador", "desarrolladora", "ejecutivo", "ejecutiva", "asesor", "asesora", "contador", "contadora", "disenador", "disenadora", "consultor", "consultora", "profesional", "tester", "programador", "programadora"];
const INICIAL = ["junior", "jr", "practicante", "aprendiz", "pasante", "pasantia", "pasantias", "auxiliar", "asistente", "trainee", "operario", "operaria", "mensajero", "cajero", "cajera", "vendedor", "vendedora", "bodeguero", "bodeguera", "recepcionista", "digitador", "digitadora"];

// El orden importa: un "Gerente" gana sobre un "Analista" si aparecen los dos.
export function inferirNivel(titulo: string): NivelExperiencia | null {
    const t = normalizarTitulo(titulo);
    if (contiene(t, DIRECCION)) return "Director";
    if (contiene(t, SENIOR)) return "Mid-Senior level";
    if (contiene(t, INICIAL)) return "Entry level";
    if (contiene(t, ASOCIADO)) return "Associate";
    return null;
}

const TECNICO = ["datos", "data", "sql", "bi", "power", "python", "software", "desarrollador", "desarrolladora", "programador", "programadora", "devops", "cloud", "ciberseguridad", "seguridad informatica", "machine", "ingeniero de sistemas", "backend", "frontend", "fullstack", "full", "java", "react", "node", "qa", "tester", "sistemas", "ti", "it"];

export function esTecnico(titulo: string): boolean {
    return contiene(normalizarTitulo(titulo), TECNICO);
}

export function esPractica(titulo: string): boolean {
    return contiene(normalizarTitulo(titulo), ["practicante", "aprendiz", "pasante", "pasantia", "pasantias", "trainee"]);
}
