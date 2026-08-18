// Ejecutar con: npx tsx prisma/seed-vacantes.ts
// Requiere: npm install csv-parse
// Requiere que data/postings.csv exista (dataset de Kaggle, no se commitea).

import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { prisma } from "../src/infrastructure/database/PrismaClient";

const RUTA_CSV = path.join(__dirname, "../data/postings.csv");
const TAMANO_LOTE = 500;

// Shape de una fila cruda del CSV. Ajusta estos nombres si al abrir
// postings.csv los headers reales son distintos.
interface FilaCSV {
    title: string;
    company_name: string;
    location: string;
    formatted_work_type: string;
    remote_allowed: string;
    formatted_experience_level: string;
    min_salary: string;
    max_salary: string;
    currency: string;
    description: string;
    job_posting_url: string;
    listed_time: string;
}

function mapearModalidad(fila: FilaCSV): string | null {
    if (fila.remote_allowed === "1" || fila.remote_allowed?.toLowerCase() === "true") {
        return "remoto";
    }
    if (!fila.formatted_work_type) return null;
    return fila.formatted_work_type.toLowerCase().includes("remote")
        ? "remoto"
        : "presencial";
}

function aNumeroONulo(valor: string): number | null {
    if (!valor) return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.round(numero) : null;
}

async function seed() {
    if (!fs.existsSync(RUTA_CSV)) {
        console.error(`No se encontro el archivo: ${RUTA_CSV}`);
        console.error("Descarga postings.csv del dataset de Kaggle y ponlo en data/postings.csv");
        process.exit(1);
    }

    let lote: any[] = [];
    let totalInsertadas = 0;
    let totalDescartadas = 0;

    const parser = fs
        .createReadStream(RUTA_CSV)
        .pipe(parse({ columns: true, skip_empty_lines: true }));

    for await (const fila of parser as AsyncIterable<FilaCSV>) {
        if (!fila.title?.trim() || !fila.company_name?.trim()) {
            totalDescartadas++;
            continue;
        }

        lote.push({
            titulo: fila.title.trim().slice(0, 300),
            empresa: fila.company_name.trim().slice(0, 300),
            ubicacion: fila.location?.trim() || null,
            modalidad: mapearModalidad(fila),
            nivelExperiencia: fila.formatted_experience_level || null,
            salarioMin: aNumeroONulo(fila.min_salary),
            salarioMax: aNumeroONulo(fila.max_salary),
            moneda: fila.currency || null,
            descripcion: (fila.description || "").slice(0, 5000),
            urlOriginal: fila.job_posting_url || null,
            fuente: "kaggle-linkedin",
            fechaPublicacion: fila.listed_time ? new Date(Number(fila.listed_time)) : null,
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