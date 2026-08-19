import express from 'express';
import recommendationRoutes from './recommendation/interfaces/recommendation.routes';

const app = express();
app.use(express.json());

// Registrar endpoint del Módulo C
app.use('/recomendaciones', recommendationRoutes);

export default app;
