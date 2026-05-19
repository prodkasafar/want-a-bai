import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SERVICES = [
  { name: 'House Cleaning', description: 'Dusting, sweeping, mopping, and general organization.' },
  { name: 'Cooking', description: 'Preparation of traditional Indian meals and kitchen management.' },
  { name: 'Babysitting & Childcare', description: 'Taking care of children, helping with homework, and playtime.' },
  { name: 'Elderly Care', description: 'Assisting elderly family members with daily tasks and companionship.' },
  { name: 'Laundry & Ironing', description: 'Washing, drying, folding, and ironing clothes.' },
  { name: 'Deep Cleaning', description: 'Thorough cleaning of bathrooms, kitchens, and hard-to-reach areas.' }
];

async function main() {
  console.log('Seeding database...');

  // 1. Create default services
  const seededServices = [];
  for (const s of SERVICES) {
    const service = await prisma.service.upsert({
      where: { name: s.name },
      update: {},
      create: s
    });
    seededServices.push(service);
    console.log(`Service seeded: ${s.name}`);
  }

  // 2. Create an admin user if not exists
  const adminUser = await prisma.user.upsert({
    where: { firebaseUid: 'admin-firebase-uid-123' },
    update: {},
    create: {
      email: 'admin@wantabai.com',
      phone: '+919999999999',
      firebaseUid: 'admin-firebase-uid-123',
      role: 'ADMIN'
    }
  });
  console.log(`Admin user seeded: ${adminUser.email}`);

  // 3. Seed sample maids
  const maidsData = [
    {
      email: 'priya.sharma@example.com',
      phone: '+919876543210',
      uid: 'maid-firebase-uid-1',
      fullName: 'Priya Sharma',
      gender: 'Female',
      dob: new Date('1992-05-15'),
      address: 'Sector 62, Noida, Uttar Pradesh',
      emergency: '+919876543219',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', // placeholder UI photo
      services: [
        { serviceName: 'Cooking', salary: 8000 },
        { serviceName: 'House Cleaning', salary: 5000 }
      ],
      status: 'AVAILABLE'
    },
    {
      email: 'laxmi.devi@example.com',
      phone: '+918765432109',
      uid: 'maid-firebase-uid-2',
      fullName: 'Laxmi Devi',
      gender: 'Female',
      dob: new Date('1988-10-20'),
      address: 'Indiranagar, Bengaluru, Karnataka',
      emergency: '+918765432100',
      photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150',
      services: [
        { serviceName: 'House Cleaning', salary: 6000 },
        { serviceName: 'Laundry & Ironing', salary: 3000 }
      ],
      status: 'AVAILABLE'
    },
    {
      email: 'sunita.bai@example.com',
      phone: '+917654321098',
      uid: 'maid-firebase-uid-3',
      fullName: 'Sunita Bai',
      gender: 'Female',
      dob: new Date('1995-02-28'),
      address: 'Andheri West, Mumbai, Maharashtra',
      emergency: '+917654321099',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      services: [
        { serviceName: 'Babysitting & Childcare', salary: 12000 },
        { serviceName: 'Cooking', salary: 9000 }
      ],
      status: 'AVAILABLE'
    }
  ];

  for (const m of maidsData) {
    const user = await prisma.user.upsert({
      where: { firebaseUid: m.uid },
      update: {},
      create: {
        email: m.email,
        phone: m.phone,
        firebaseUid: m.uid,
        role: 'MAID'
      }
    });

    const maidProfile = await prisma.maidProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: m.fullName,
        gender: m.gender,
        dob: m.dob,
        permanentAddress: m.address,
        mobileNumber: m.phone,
        emergencyContact: m.emergency,
        profilePhotoUrl: m.photo,
        status: m.status
      }
    });

    // Link services
    for (const ms of m.services) {
      const service = seededServices.find(s => s.name === ms.serviceName);
      if (service) {
        await prisma.maidService.upsert({
          where: {
            maidProfileId_serviceId: {
              maidProfileId: maidProfile.id,
              serviceId: service.id
            }
          },
          update: {},
          create: {
            maidProfileId: maidProfile.id,
            serviceId: service.id,
            expectedSalary: ms.salary
          }
        });
      }
    }
    console.log(`Maid profile & services seeded for: ${m.fullName}`);
  }

  // 4. Seed sample client
  const clientUser = await prisma.user.upsert({
    where: { firebaseUid: 'client-firebase-uid-1' },
    update: {},
    create: {
      email: 'client@example.com',
      phone: '+919000000001',
      firebaseUid: 'client-firebase-uid-1',
      role: 'CLIENT'
    }
  });

  await prisma.clientProfile.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      fullName: 'Rahul Verma',
      gender: 'Male',
      dob: new Date('1985-08-12'),
      address: 'HSR Layout, Bengaluru, Karnataka',
      maritalStatus: 'Married',
      mobileNumber: '+919000000001',
      email: 'client@example.com'
    }
  });
  console.log('Client profile seeded for: Rahul Verma');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
