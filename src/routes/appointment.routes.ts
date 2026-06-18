import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/appointments — Book a new appointment
router.post('/', async (req: Request, res: Response) => {
    try {
        const { patientId, doctorId, date, timeSlot } = req.body;

        // Generate token number
        const todayStart = new Date(date);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(date);
        todayEnd.setHours(23, 59, 59, 999);

        const existingCount = await prisma.appointment.count({
            where: {
                date: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });

        const tokenNumber = existingCount + 1;

        const appointment = await prisma.appointment.create({
            data: {
                patientId,
                doctorId,
                date: new Date(date),
                timeSlot,
                tokenNumber,
                status: 'BOOKED',
            },
        });

        res.json(appointment);
    } catch (error: any) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// PATCH /api/appointments/:id/status — Update appointment status
router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const appointment = await prisma.appointment.update({
            where: { id: parseInt(id) },
            data: { status },
        });

        res.json(appointment);
    } catch (error: any) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// GET /api/appointments?doctorId=1&date=2025-03-15 — List appointments
router.get('/', async (req: Request, res: Response) => {
    try {
        const { doctorId, date } = req.query;

        const where: any = {};

        if (doctorId) {
            where.doctorId = parseInt(doctorId as string);
        }

        if (date) {
            where.date = new Date(date as string);
        }

        const appointments = await prisma.appointment.findMany({
            where,
        });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// GET /api/appointments/:id — Get single appointment
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                patient: true,
                doctor: true,
            },
        });

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

export default router;
