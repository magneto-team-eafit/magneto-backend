import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/server';

describe('Pruebas de Integración - Vertical B', () => {

    it('Debe cargar la documentación de Swagger exitosamente', async () => {
        const res = await request(app).get('/api-docs/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Swagger UI');
    });

    it('Debe obtener la lista general de vacantes', async () => {
        const res = await request(app).get('/vacantes');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('vacantes');
        expect(res.body).toHaveProperty('total');
        expect(Array.isArray(res.body.vacantes)).toBe(true);
    });

    it('Debe filtrar vacantes correctamente usando el parámetro "q"', async () => {
        const res = await request(app).get('/vacantes?q=desarrollador');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('vacantes');
        expect(typeof res.body.total).toBe('number');
    });

    it('Debe devolver error 404 al buscar una vacante con ID que no existe', async () => {
        const res = await request(app).get('/vacantes/11111111-1111-1111-1111-111111111111');
        expect(res.status).toBe(404);
    });

});