// Salarios de las vacantes. El dataset de Indeed NO trae columna de salario,
// asi que hay dos fuentes y siempre se distinguen:
//  1) REAL: el texto de la oferta dice "Salario: $1.500.000" -> se extrae.
//  2) ESTIMADO: no dice nada -> se asigna un rango de referencia segun el
//     nivel y el tipo de cargo, y se marca con salarioEstimado = true para que
//     la interfaz lo muestre como "estimado" y nunca como dato de la empresa.
import { esPractica, esTecnico, inferirNivel } from "./clasificacion";

export interface RangoSalario {
    min: number;
    max: number;
}

const SALARIO_MINIMO_VALIDO = 600_000;
const SALARIO_MAXIMO_VALIDO = 40_000_000;

// ---------- 1) Extraccion de salarios reales ----------

const MONTO = String.raw`(\d{1,3}(?:[.,\s]\d{3})+|\d{6,8}|\d{1,2}(?:[.,]\d)?\s?(?:millones|millon))`;
const PALABRA_CLAVE = String.raw`(?:salario|sueldo|remuneraci[oó]n|asignaci[oó]n salarial|b[aá]sico)`;
const PATRON_SALARIO = new RegExp(
    `${PALABRA_CLAVE}[^\\d\\n]{0,40}?\\$?\\s?${MONTO}(?:\\s*(?:a|hasta|-|y)\\s*\\$?\\s?${MONTO})?`,
    "i",
);

function aNumero(monto: string): number | null {
    const m = monto.toLowerCase().match(/^(\d{1,2}(?:[.,]\d)?)\s?(millones|millon)$/);
    if (m) return Math.round(parseFloat(m[1].replace(",", ".")) * 1_000_000);
    const digitos = monto.replace(/\D/g, "");
    return digitos ? parseInt(digitos, 10) : null;
}

function esValido(n: number | null): n is number {
    return n !== null && n >= SALARIO_MINIMO_VALIDO && n <= SALARIO_MAXIMO_VALIDO;
}

export function extraerSalarioReal(texto: string): RangoSalario | null {
    const m = texto.replace(/\s+/g, " ").match(PATRON_SALARIO);
    if (!m) return null;
    const a = aNumero(m[1]);
    const b = m[2] ? aNumero(m[2]) : a;
    if (!esValido(a) || !esValido(b)) return null; // ej. "2.100.00" mal escrito en la oferta
    return a <= b ? { min: a, max: b } : { min: b, max: a };
}

// ---------- 2) Estimacion de referencia ----------

// Rangos mensuales de referencia en COP. Son una aproximacion de mercado,
// no datos de la empresa.
const BANDAS: Record<string, [number, number]> = {
    practica: [1_400_000, 1_900_000],
    "Entry level": [1_500_000, 2_600_000],
    "Entry level tec": [2_200_000, 3_500_000],
    Associate: [2_800_000, 5_000_000],
    "Associate tec": [4_000_000, 7_000_000],
    "Mid-Senior level": [5_000_000, 8_500_000],
    "Mid-Senior level tec": [6_500_000, 11_000_000],
    Director: [9_000_000, 16_000_000],
    "Director tec": [10_000_000, 18_000_000],
    sinNivel: [1_800_000, 3_400_000],
};

// Hash determinista (FNV-1a): la misma vacante siempre recibe el mismo rango,
// asi correr el seed varias veces no cambia los salarios.
function hash01(texto: string, sal: number): number {
    let h = 2166136261 ^ sal;
    for (let i = 0; i < texto.length; i++) {
        h ^= texto.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10_000) / 10_000;
}

const aCienMil = (n: number) => Math.round(n / 100_000) * 100_000;

export function estimarSalario(titulo: string, semilla: string): RangoSalario {
    const nivel = inferirNivel(titulo);
    const tec = esTecnico(titulo);
    const clave = esPractica(titulo) ? "practica" : nivel ? (tec ? `${nivel} tec` : nivel) : "sinNivel";
    const [bajo, alto] = BANDAS[clave] ?? BANDAS[nivel ?? "sinNivel"] ?? BANDAS.sinNivel;

    const min = aCienMil(bajo + hash01(semilla, 1) * (alto - bajo) * 0.6);
    const max = aCienMil(min * (1.15 + hash01(semilla, 2) * 0.25));
    return { min, max };
}
