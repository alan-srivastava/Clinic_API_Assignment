import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

const router = Router();

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    BOOKED: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
};

const createAppointmentSchema = z.object({
    patientId: z.number().int().positive(),
    doctorId: z.number().int().positive(),
    date: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Invalid date'),
    timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'timeSlot must be in HH:MM format'),
});

async function createAppointmentWithToken(data: {
    patientId: number;
    doctorId: number;
    date: Date;
    timeSlot: string;
}) {
    const dayStart = new Date(data.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(data.date);
    dayEnd.setHours(23, 59, 59, 999);

    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const existingCount = await prisma.appointment.count({
            where: {
                doctorId: data.doctorId, // scoped per-doctor — this is the key fix
                date: { gte: dayStart, lte: dayEnd },
            },
        });

        try {
            return await prisma.appointment.create({
                data: {
                    ...data,
                    tokenNumber: existingCount + 1,
                    status: 'BOOKED',
                },
            });
        } catch (err: any) {
            if (err.code === 'P2002') {
                continue; // another request grabbed that token/slot — retry
            }
            throw err;
        }
    }
    throw new Error('Could not allocate token number after retries');
}

// POST /api/appointments — Book a new appointment
router.post('/', async (req: Request, res: Response) => {
    try {
        const parsed = createAppointmentSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        const { patientId, doctorId, date, timeSlot } = parsed.data;

        const [patient, doctor] = await Promise.all([
            prisma.patient.findUnique({ where: { id: patientId } }),
            prisma.doctor.findUnique({ where: { id: doctorId } }),
        ]);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const appointment = await createAppointmentWithToken({
            patientId,
            doctorId,
            date: new Date(date),
            timeSlot,
        });

        res.status(201).json(appointment);
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'This slot is already booked' });
        }
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// PATCH /api/appointments/:id/status — Update appointment status
router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid appointment id' });
        }

        const validStatuses = ['BOOKED', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `status must be one of ${validStatuses.join(', ')}` });
        }

        const existing = await prisma.appointment.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const allowedNext = ALLOWED_TRANSITIONS[existing.status];
        if (!allowedNext.includes(status)) {
            return res.status(409).json({
                error: `Cannot transition from ${existing.status} to ${status}`,
            });
        }

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status },
        });

        res.json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// GET /api/appointments?doctorId=1&date=2025-03-15 — List appointments
router.get('/', async (req: Request, res: Response) => {
    try {
        const { doctorId, date } = req.query;

        const where: any = {};

        if (doctorId) {
            const parsedDoctorId = parseInt(doctorId as string);
            if (isNaN(parsedDoctorId)) {
                return res.status(400).json({ error: 'Invalid doctorId' });
            }
            where.doctorId = parsedDoctorId;
        }

        if (date) {
            const parsedDate = new Date(date as string);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date' });
            }
            const dayStart = new Date(parsedDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(parsedDate);
            dayEnd.setHours(23, 59, 59, 999);
            where.date = { gte: dayStart, lte: dayEnd };
        }

        const appointments = await prisma.appointment.findMany({ where });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// GET /api/appointments/:id — Get single appointment
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid appointment id' });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                patient: true,
                doctor: true,
            },
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

export default router;