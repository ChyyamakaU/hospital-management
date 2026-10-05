/*
 * Seed script: fills the database with dummy development data.
 *
 * Run with:  node prisma/seed.js
 * (or `npm run prisma:seed`)
 *
 * ALL data here is fake. No real patient information is used.
 */

require('dotenv').config()

const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/*
 * The password every seeded account gets. Development only.
 * Documented in the README so you can log in straight away.
 */
const DEV_PASSWORD = 'Admin@12345'

/**
 * Clears existing rows in an order that respects foreign keys.
 * Parents must be deleted before children, otherwise PostgreSQL complains.
 */
async function clearAll() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.ward.deleteMany()
  await prisma.medicine.deleteMany()
  await prisma.user.deleteMany()
}

async function main() {
  console.log('Seeding database...')
  await clearAll()

  // Bcrypt hashes the password once and reuses the hash for every account.
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10)

  // --- Users ---------------------------------------------------------
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin Demo',
      email: 'admin@hospital.test',
      password: passwordHash,
      phone: '+254700000001',
      address: 'Hospital Administration Block',
      // Only the seed sets ADMIN. The registration endpoint always
      // forces PATIENT, so nobody can sign themselves up as an admin.
      role: 'ADMIN',
    },
  })

  const patientUsers = await Promise.all(
    [
      {
        fullName: 'Amina Yusuf',
        email: 'amina@patient.test',
        phone: '+254700000002',
        address: '12 Kenyatta Avenue, Nairobi',
        dateOfBirth: '1992-04-17',
        gender: 'FEMALE',
        bloodGroup: 'O+',
        emergencyContact: 'Joseph Yusuf',
        emergencyPhone: '+254700000012',
      },
      {
        fullName: 'Brian Otieno',
        email: 'brian@patient.test',
        phone: '+254700000003',
        address: '45 Mombasa Road, Mombasa',
        dateOfBirth: '1985-11-02',
        gender: 'MALE',
        bloodGroup: 'A+',
        emergencyContact: 'Grace Otieno',
        emergencyPhone: '+254700000013',
      },
      {
        fullName: 'Chloe Mwangi',
        email: 'chloe@patient.test',
        phone: '+254700000004',
        address: '7 Ngong Road, Nairobi',
        dateOfBirth: '2015-08-30',
        gender: 'FEMALE',
        bloodGroup: 'B+',
        emergencyContact: 'Peter Mwangi',
        emergencyPhone: '+254700000014',
      },
    ].map((data) =>
      prisma.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          password: passwordHash,
          phone: data.phone,
          address: data.address,
          role: 'PATIENT',
        },
      }),
    ),
  )

  // --- Wards ----------------------------------------------------------
  const wards = await Promise.all(
    [
      {
        name: 'General Ward',
        type: 'GENERAL',
        capacity: 4,
        description: 'Adult patients recovering from general illness or surgery.',
      },
      {
        name: 'Maternity Ward',
        type: 'MATERNITY',
        capacity: 3,
        description: 'Mothers before and after childbirth.',
      },
      {
        name: "Children's Ward",
        type: 'PEDIATRIC',
        capacity: 3,
        description: 'Paediatric patients aged 16 and below.',
      },
      {
        name: 'Emergency Ward',
        type: 'EMERGENCY',
        capacity: 2,
        description: 'Short-stay patients awaiting admission or discharge.',
      },
    ].map((data) => prisma.ward.create({ data })),
  )

  // --- Patients -------------------------------------------------------
  // patientId is assigned here in the seed. In the live app it is generated
  // automatically by the patient service (see Phase 4).
  const patients = await Promise.all(
    patientUsers.map((user, index) =>
      prisma.patient.create({
        data: {
          patientId: `PAT-${String(index + 1).padStart(6, '0')}`,
          userId: user.id,
          dateOfBirth: new Date(
            [
              ['1992-04-17'],
              ['1985-11-02'],
              ['2015-08-30'],
            ][index][0],
          ),
          gender: ['FEMALE', 'MALE', 'FEMALE'][index],
          bloodGroup: ['O+', 'A+', 'B+'][index],
          emergencyContact: ['Joseph Yusuf', 'Grace Otieno', 'Peter Mwangi'][index],
          emergencyPhone: ['+254700000012', '+254700000013', '+254700000014'][index],
          // Only the first two patients start in a ward, so the wards are
          // not full and the app has something to show.
          wardId: index < 2 ? wards[index].id : null,
        },
      }),
    ),
  )

  // --- Medicines ------------------------------------------------------
  const medicines = await Promise.all(
    [
      {
        name: 'Paracetamol 500mg',
        description: 'Pain relief and fever reducer for adults.',
        category: 'Analgesic',
        price: '45.00',
        stockQuantity: 120,
        lowStockThreshold: 25,
        expiryDate: '2027-06-30',
      },
      {
        name: 'Amoxicillin 250mg',
        description: 'Antibiotic for bacterial infections.',
        category: 'Antibiotic',
        price: '120.00',
        stockQuantity: 60,
        lowStockThreshold: 20,
        expiryDate: '2026-12-31',
      },
      {
        name: 'ORS Sachet',
        description: 'Oral rehydration salts for treating dehydration.',
        category: 'Electrolyte',
        price: '30.00',
        stockQuantity: 200,
        lowStockThreshold: 40,
        expiryDate: '2028-03-31',
      },
      {
        name: 'Cetirizine 10mg',
        description: 'Antihistamine for allergies and hay fever.',
        category: 'Antihistamine',
        price: '65.00',
        stockQuantity: 45,
        lowStockThreshold: 20,
        expiryDate: '2027-09-30',
      },
      {
        name: 'Metformin 500mg',
        description: 'First-line treatment for type 2 diabetes.',
        category: 'Antidiabetic',
        price: '85.00',
        stockQuantity: 18,
        lowStockThreshold: 20,
        expiryDate: '2027-01-31',
      },
      {
        name: 'Amoxicillin 500mg',
        description: 'Higher-dose antibiotic for bacterial infections.',
        category: 'Antibiotic',
        price: '175.00',
        stockQuantity: 9,
        lowStockThreshold: 20,
        expiryDate: '2026-02-28',
      },
      {
        name: 'Vitamin C 100mg',
        description: 'Immune support supplement.',
        category: 'Supplement',
        price: '25.00',
        stockQuantity: 0,
        lowStockThreshold: 30,
        expiryDate: '2028-01-31',
      },
      {
        name: 'Lorazepam 1mg',
        description: 'Sedative used for anxiety and seizures. Controlled drug.',
        category: 'Controlled',
        price: '220.00',
        stockQuantity: 30,
        lowStockThreshold: 10,
        expiryDate: '2025-10-31',
      },
    ].map((data) =>
      prisma.medicine.create({
        data: {
          ...data,
          expiryDate: new Date(data.expiryDate),
        },
      }),
    ),
  )

  // --- Orders ---------------------------------------------------------
  // Only the first two patients have profiles in a ward, but all three can
  // order medicine. Total is recalculated here rather than trusted blindly.
  const orderSeed = [
    {
      patientIndex: 0,
      status: 'COMPLETED',
      items: [
        { medicineIndex: 0, quantity: 2 },
        { medicineIndex: 2, quantity: 3 },
      ],
    },
    {
      patientIndex: 1,
      status: 'CONFIRMED',
      items: [
        { medicineIndex: 4, quantity: 1 },
        { medicineIndex: 1, quantity: 2 },
      ],
    },
    {
      patientIndex: 0,
      status: 'PENDING',
      items: [{ medicineIndex: 3, quantity: 4 }],
    },
  ]

  for (const entry of orderSeed) {
    let total = 0
    const items = []

    for (const item of entry.items) {
      const medicine = medicines[item.medicineIndex]
      const lineTotal = Number(medicine.price) * item.quantity
      total += lineTotal
      items.push({
        medicineId: medicine.id,
        quantity: item.quantity,
        unitPrice: medicine.price,
      })
    }

    await prisma.order.create({
      data: {
        patientId: patients[entry.patientIndex].id,
        totalAmount: total.toFixed(2),
        status: entry.status,
        items: { create: items },
      },
    })
  }

  // --- Summary --------------------------------------------------------
  const counts = {
    users: await prisma.user.count(),
    patients: await prisma.patient.count(),
    wards: await prisma.ward.count(),
    medicines: await prisma.medicine.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
  }

  console.log('Seed complete:', counts)
  console.log('\nDevelopment logins (dummy accounts only):')
  console.log('  admin@hospital.test  / Admin@12345   (ADMIN)')
  for (const user of patientUsers) {
    console.log(`  ${user.email}  / Admin@12345   (PATIENT)`)
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    // Close the connection pool so the script can exit.
    await prisma.$disconnect()
  })