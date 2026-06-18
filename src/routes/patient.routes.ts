import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

const router = Router();

const createPatientSchema = z.object({
    name: z.string().min(1, 'name is required'),
    phone: z.string().min(7, 'phone must be at least 7 characters'),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
});

// POST /api/patients — Register a new patient
router.post('/', async (req: Request, res: Response) => {
    try {
        const parsed = createPatientSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        const { name, phone, dateOfBirth, gender } = parsed.data;

        const patient = await prisma.patient.create({
            data: {
                name,
                phone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender,
            },
        });

        res.status(201).json(patient);
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'A patient with this phone number already exists' });
        }
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
                    name: { startsWith: search as string, mode: 'insensitive' },
                },
            });
        } else {
            patients = await prisma.patient.findMany();
        }

        res.json(patients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// GET /api/patients/:id — Get patient details
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid patient id' });
        }

        const patient = await prisma.patient.findUnique({
            where: { id },
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

export default router;