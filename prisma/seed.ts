import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Seed Doctors
    const drSmith = await prisma.doctor.create({
        data: {
            name: 'Dr. Priya Sharma',
            specialization: 'Pediatrics',
            phone: '9876543210',
            consultationFee: 500,
        },
    });

    const drPatel = await prisma.doctor.create({
        data: {
            name: 'Dr. Amit Patel',
            specialization: 'General Medicine',
            phone: '9876543211',
            consultationFee: 400,
        },
    });

    // Seed Schedules — Dr. Sharma works Mon-Fri, Dr. Patel works Mon, Wed, Fri
    for (let day = 1; day <= 5; day++) {
        await prisma.doctorSchedule.create({
            data: {
                doctorId: drSmith.id,
                dayOfWeek: day,
                startTime: '09:00',
                endTime: '13:00',
                slotDuration: 15,
            },
        });
    }

    for (const day of [1, 3, 5]) {
        await prisma.doctorSchedule.create({
            data: {
                doctorId: drPatel.id,
                dayOfWeek: day,
                startTime: '10:00',
                endTime: '16:00',
                slotDuration: 20,
            },
        });
    }

    // Seed a few patients
    await prisma.patient.createMany({
        data: [
            { name: 'Rahul Verma', phone: '9988776655', gender: 'Male', dateOfBirth: new Date('2020-05-15') },
            { name: 'Sneha Gupta', phone: '9988776656', gender: 'Female', dateOfBirth: new Date('2019-11-20') },
            { name: 'Arjun Singh', phone: '9988776657', gender: 'male', dateOfBirth: new Date('2021-01-10') },
            // Note: "male" vs "Male" — inconsistent casing because there's no enum. Another subtle issue.
        ],
    });

    console.log('✅ Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
