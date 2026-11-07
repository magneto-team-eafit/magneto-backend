// Ejecutar con: npx tsx prisma/seed-vacantes.ts
// Requiere: npm install csv-parse
// Requiere que data/Recruiting_Dataset_spanish.csv exista

import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { prisma } from "../src/infrastructure/database/PrismaClient";

const RUTA_CSV = path.join(__dirname, "data/Recruiting_Dataset_spanish.csv");
const TAMANO_LOTE = 500;

// Shape adaptado a los encabezados (en portugués) del dataset de Kaggle Colombia
interface FilaCSV {
    "Site ": string; // Ojo: en el CSV original esta columna tiene un espacio al final
    "nome da vaga": string;
    "nome da empresa": string;
    "tamanho da empresa": string;
    "linguagem": string;
    "pais": string;
    "estado": string;
    "cidade da vaga": string;
    "descrição": string;
    [key: string]: any; // Para ignorar la lista dinámica de "requisito_X"
}

async function seed() {
    if (!fs.existsSync(RUTA_CSV)) {
        console.error(`No se encontro el archivo: ${RUTA_CSV}`);
        console.error("Asegúrate de colocar Recruiting_Dataset_spanish.csv en la carpeta data/");
        process.exit(1);
    }

    let lote: any[] = [];
    let totalInsertadas = 0;
    let totalDescartadas = 0;

    // Se cambia el delimitador a ';' porque así viene el CSV de este dataset
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

        // Formatear ubicación como "Ciudad, Estado" (ej. "Medellín, Antioquia")
        const ciudad = fila["cidade da vaga"]?.trim() || "";
        const estado = fila["estado"]?.trim() || "";
        const ubicacion = [ciudad, estado].filter(Boolean).join(", ");

        const descripcion = (fila["descrição"] || "").slice(0, 5000);
        const urlOriginal = (fila["Site "] || "").trim();

        // Inferir modalidad si mencionan "remot" (remoto/remote) en el título o descripción
        const textoParaModalidad = `${titulo} ${descripcion}`.toLowerCase();
        const modalidad = textoParaModalidad.includes("remot") ? "remoto" : "presencial";

        lote.push({
            titulo: titulo.trim().slice(0, 300),
            empresa: empresa.trim().slice(0, 300),
            ubicacion: ubicacion || null,
            modalidad: modalidad,
            nivelExperiencia: "Entry level", // El dataset no trae seniority, dejamos un valor por defecto
            salarioMin: null, // No hay salarios numéricos en este dataset
            salarioMax: null,
            moneda: "COP",
            descripcion: descripcion,
            urlOriginal: urlOriginal || null,
            fuente: "dataset-colombia-kaggle",
            fechaPublicacion: new Date(),
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