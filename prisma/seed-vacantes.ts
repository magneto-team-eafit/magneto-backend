// Ejecutar con: npx tsx prisma/seed-vacantes.ts
// Requiere: npm install csv-parse
// Requiere que prisma/data/Recruiting_Dataset_spanish.csv exista

import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { prisma } from "../src/infrastructure/database/PrismaClient";
import { inferirNivel } from "../src/domain/vacantes/clasificacion";
import { estimarSalario, extraerSalarioReal } from "../src/domain/vacantes/salarios";

const RUTA_CSV = path.join(__dirname, "data/Recruiting_Dataset_spanish.csv");
const TAMANO_LOTE = 500;

interface FilaCSV {
    "Site ": string;
    "nome da vaga": string;
    "nome da empresa": string;
    "tamanho da empresa": string;
    "linguagem": string;
    "pais": string;
    "estado": string;
    "cidade da vaga": string;
    "descrição": string;
    "data da postagem": string; // Nueva columna para la fecha
    [key: string]: any;
}

// Función para normalizar texto (quitar tildes y dejar en minúscula)
function normalizar(texto: string): string {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Función para unificar las variantes de Bogotá
function normalizarCiudad(ciudad: string, estado: string): string | null {
    if (!ciudad || ciudad === "0") return null;
    let ciudadNorm = normalizar(ciudad);

    if (ciudadNorm.includes("bogota")) {
        return "Bogotá D.C.";
    }

    const estadoLimpio = estado && estado !== "0" ? estado.trim() : "";
    // Si la ciudad y el estado son lo mismo ("Medellin, Medellin") se deja uno solo.
    if (!estadoLimpio || normalizar(estadoLimpio) === ciudadNorm) return ciudad.trim();
    return `${ciudad.trim()}, ${estadoLimpio}`;
}

// Guarda un lote: las filas con urlOriginal se insertan o actualizan (UPSERT
// por la columna unica); las que no tienen url se insertan tal cual.
async function guardarLote(lote: any[]) {
    const conUrl = lote.filter((v) => v.urlOriginal);
    const sinUrl = lote.filter((v) => !v.urlOriginal);
    if (conUrl.length > 0) {
        await prisma.$transaction(
            conUrl.map((v) =>
                prisma.vacante.upsert({
                    where: { urlOriginal: v.urlOriginal },
                    update: v,
                    create: v,
                }),
            ),
        );
    }
    if (sinUrl.length > 0) {
        await prisma.vacante.createMany({ data: sinUrl });
    }
}

async function seed() {
    if (!fs.existsSync(RUTA_CSV)) {
        console.error(`No se encontro el archivo: ${RUTA_CSV}`);
        process.exit(1);
    }

    // El seed es idempotente: las vacantes con urlOriginal se actualizan (upsert)
    // en vez de borrarse, asi correrlo de nuevo no duplica ni borra las
    // postulaciones que ya apuntan a esas vacantes.
    let lote: any[] = [];
    let totalInsertadas = 0;
    let totalDescartadas = 0;

    const parser = fs
        .createReadStream(RUTA_CSV)
        .pipe(parse({ columns: true, skip_empty_lines: true, delimiter: ';' }));

    for await (const fila of parser as AsyncIterable<FilaCSV>) {
        const titulo = fila["nome da vaga"];
        // En el dataset, "0" significa que la oferta no dice la empresa.
        const empresaCruda = fila["nome da empresa"]?.trim();
        const empresa = empresaCruda && empresaCruda !== "0" ? empresaCruda : "Empresa confidencial";

        if (!titulo?.trim()) {
            totalDescartadas++;
            continue;
        }

        const ubicacion = normalizarCiudad(fila["cidade da vaga"], fila["estado"]);
        const descripcionBase = (fila["descrição"] || "").slice(0, 5000);
        // Las columnas requisito_1..21 traen lo que pide el cargo (habilidades,
        // estudios, experiencia). Se agregan a la descripcion para que el
        // buscador y el recomendador puedan leerlas. "0" significa vacio.
        const requisitos: string[] = [];
        for (let i = 1; i <= 21; i++) {
            const r = String(fila[`requisito_${i}`] ?? "").trim();
            if (r && r !== "0") requisitos.push(r);
        }
        const descripcion = requisitos.length > 0
            ? `${descripcionBase}\n\nRequisitos:\n- ${requisitos.join("\n- ")}`.slice(0, 9000)
            : descripcionBase;
        const urlOriginal = (fila["Site "] || "").trim();

        const textoParaModalidad = `${titulo} ${descripcion}`.toLowerCase();
        let modalidad = "presencial";
        if (textoParaModalidad.includes("híbrid") || textoParaModalidad.includes("hibrid")) {
            modalidad = "hibrido";
        } else if (textoParaModalidad.includes("remot") || textoParaModalidad.includes("teletrabajo")) {
            modalidad = "remoto";
        }

        // Nivel de experiencia inferido por el titulo (ver domain/vacantes/clasificacion.ts)
        const nivelExperiencia = inferirNivel(titulo);

        // Procesar fecha de publicación
        let fechaPublicacion = new Date();
        const fechaCruda = fila["data da postagem"];
        if (fechaCruda && fechaCruda !== "0") {
            const match = fechaCruda.match(/(\d{1,2})\/(\d{1,2})/);
            if (match) {
                const dia = parseInt(match[1]);
                const mes = parseInt(match[2]) - 1;
                const hoy = new Date();
                fechaPublicacion = new Date(hoy.getFullYear(), mes, dia);
                // El texto solo trae dia y mes: si da una fecha futura, es del año anterior.
                if (fechaPublicacion > hoy) fechaPublicacion.setFullYear(hoy.getFullYear() - 1);
            }
        }

        // Salario: primero el que diga la oferta; si no dice, un rango estimado
        // (marcado con salarioEstimado = true). Ver domain/vacantes/salarios.ts.
        const textoOferta = `${descripcion}\n${fila["beneficios"] ?? ""}`;
        const salarioReal = extraerSalarioReal(textoOferta);
        const salario = salarioReal ?? estimarSalario(titulo, urlOriginal || `${titulo}|${empresa}`);

        lote.push({
            titulo: titulo.trim().slice(0, 300),
            empresa: empresa.trim().slice(0, 300),
            ubicacion: ubicacion,
            modalidad: modalidad,
            nivelExperiencia: nivelExperiencia,
            salarioMin: salario.min,
            salarioMax: salario.max,
            salarioEstimado: !salarioReal,
            moneda: "COP",
            descripcion: descripcion,
            urlOriginal: urlOriginal || null,
            fuente: "dataset-colombia-kaggle",
            fechaPublicacion: fechaPublicacion,
        });

        if (lote.length >= TAMANO_LOTE) {
            await guardarLote(lote);
            totalInsertadas += lote.length;
            console.log(`Procesadas ${totalInsertadas} vacantes...`);
            lote = [];
        }
    }

    if (lote.length > 0) {
        await guardarLote(lote);
        totalInsertadas += lote.length;
    }

    console.log(`Listo. Procesadas: ${totalInsertadas}. Descartadas: ${totalDescartadas}.`);
    await prisma.$disconnect();
}

seed().catch((error) => {
    console.error("Error en el seed de vacantes:", error);
    process.exit(1);
});