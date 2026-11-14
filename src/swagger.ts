import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Magneto API',
            version: '1.0.0',
            description: 'Documentación de la API de Magneto para la gestión de perfiles y vacantes',
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Servidor local de desarrollo',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    // Buscamos los comentarios de documentacion en las carpetas que tienen rutas
    apis: ['./src/interfaces/**/*.ts', './src/infrastructure/**/*.ts', './src/recommendation/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);