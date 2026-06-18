import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/doctors/:id/slots?date=2025-03-15 — Get available slots
router.get('/:id/slots', async (req: Request, res: Response) => {
    try {
        const doctorId = parseInt(req.params.id);
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'date query parameter is required' });
        }

        const requestedDate = new Date(date as string);
        const dayOfWeek = requestedDate.getDay();

        // Get doctor's schedule for that day
        const schedule = await prisma.doctorSchedule.findFirst({
            where: { doctorId, dayOfWeek },
        });

        if (!schedule) {
            return res.json({ slots: [], message: 'Doctor not available on this day' });
        }

        // Generate all possible slots from schedule
        const slots = generateTimeSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);

        res.json({ slots });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

function generateTimeSlots(start: string, end: string, durationMinutes: number): string[] {
    const slots: string[] = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes < endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        currentMinutes += durationMinutes;
    }

    return slots;
}

export default router;
