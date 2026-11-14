// Ejecutar con: npx tsx prisma/seed-vacantes.ts
// Requiere: npm install csv-parse
// Requiere que prisma/data/Recruiting_Dataset_spanish.csv exista

import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { prisma } from "../src/infrastructure/database/PrismaClient";

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
        return "Bogotá D.C., Bogotá D.C.";
    }

    const estadoLimpio = estado && estado !== "0" ? estado.trim() : "";
    return estadoLimpio ? `${ciudad.trim()}, ${estadoLimpio}` : ciudad.trim();
}

async function seed() {
    if (!fs.existsSync(RUTA_CSV)) {
        console.error(`No se encontro el archivo: ${RUTA_CSV}`);
        process.exit(1);
    }

    // Borramos los datos anteriores para evitar duplicados al correr el seed de nuevo
    console.log("Limpiando base de datos...");
    await prisma.vacante.deleteMany({});

    let lote: any[] = [];
    let totalInsertadas = 0;
    let totalDescartadas = 0;

    const parser = fs
        .createReadStream(RUTA_CSV)
        .pipe(parse({ columns: true, skip_empty_lines: true, delimiter: ';' }));

    for await (const fila of parser as AsyncIterable<FilaCSV>) {
        const titulo = fila["nome da vaga"];
        const empresa = fila["nome da empresa"];

        if (!titulo?.trim() || !empresa?.trim()) {
            totalDescartadas++;
            continue;
        }

        const ubicacion = normalizarCiudad(fila["cidade da vaga"], fila["estado"]);
        const descripcion = (fila["descrição"] || "").slice(0, 5000);
        const urlOriginal = (fila["Site "] || "").trim();

        const textoParaModalidad = `${titulo} ${descripcion}`.toLowerCase();
        let modalidad = "presencial";
        if (textoParaModalidad.includes("híbrid") || textoParaModalidad.includes("hibrid")) {
            modalidad = "hibrido";
        } else if (textoParaModalidad.includes("remot") || textoParaModalidad.includes("teletrabajo")) {
            modalidad = "remoto";
        }

        // Inferir nivel de experiencia
        const tituloNorm = normalizar(titulo);
        let nivelExperiencia = null;
        if (tituloNorm.includes("junior") || tituloNorm.includes("jr") || tituloNorm.includes("practicante") || tituloNorm.includes("auxiliar")) {
            nivelExperiencia = "Entry level";
        } else if (tituloNorm.includes("senior") || tituloNorm.includes("sr") || tituloNorm.includes("lider") || tituloNorm.includes("jefe") || tituloNorm.includes("director")) {
            nivelExperiencia = "Mid-Senior level";
        }

        // Procesar fecha de publicación
        let fechaPublicacion = new Date();
        const fechaCruda = fila["data da postagem"];
        if (fechaCruda && fechaCruda !== "0") {
            const match = fechaCruda.match(/(\d{1,2})\/(\d{1,2})/);
            if (match) {
                const dia = parseInt(match[1]);
                const mes = parseInt(match[2]) - 1;
                fechaPublicacion = new Date(new Date().getFullYear(), mes, dia);
            }
        }

        lote.push({
            titulo: titulo.trim().slice(0, 300),
            empresa: empresa.trim().slice(0, 300),
            ubicacion: ubicacion,
            modalidad: modalidad,
            nivelExperiencia: nivelExperiencia,
            salarioMin: null, // Como dijo Claude, mejor dejamos null a inventar datos falsos
            salarioMax: null,
            moneda: "COP",
            descripcion: descripcion,
            urlOriginal: urlOriginal || null,
            fuente: "dataset-colombia-kaggle",
            fechaPublicacion: fechaPublicacion,
        });

        if (lote.length >= TAMANO_LOTE) {
            await prisma.vacante.createMany({ data: lote, skipDuplicates: true });
            totalInsertadas += lote.length;
            console.log(`Insertadas ${totalInsertadas} vacantes...`);
            lote = [];
        }
    }

    if (lote.length > 0) {
        await prisma.vacante.createMany({ data: lote, skipDuplicates: true });
        totalInsertadas += lote.length;
    }

    console.log(`Listo. Insertadas: ${totalInsertadas}. Descartadas: ${totalDescartadas}.`);
    await prisma.$disconnect();
}

seed().catch((error) => {
    console.error("Error en el seed de vacantes:", error);
    process.exit(1);
});