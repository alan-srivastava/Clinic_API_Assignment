import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/patients — Register a new patient
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, phone, dateOfBirth, gender } = req.body;

        const patient = await prisma.patient.create({
            data: {
                name,
                phone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender,
            },
        });

        res.json(patient);
    } catch (error: any) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// GET /api/patients?search= — Search patients
router.get('/', async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        let patients;
        if (search) {
            patients = await prisma.patient.findMany({
                where: {
                    name: { startsWith: search as string },
                },
            });
        } else {
            patients = await prisma.patient.findMany();
        }

        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// GET /api/patients/:id — Get patient details
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const patient = await prisma.patient.findUnique({
            where: { id: parseInt(req.params.id) },
        });

        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

export default router;
