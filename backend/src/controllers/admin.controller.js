const prisma = require('../config/prisma')
const { sendSuccess } = require('../utils/response')
const { asyncHandler } = require('../middleware/validate')
const { authenticate, authorizeAdmin } = require('../middleware/auth')

/**
 * GET /api/admin/dashboard
 * Admin only. Returns summary statistics + supporting tables for the
 * admin dashboard page.
 */
const getDashboard = [
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    const now = new Date()

    const [
      totalUsers,
      totalPatients,
      totalWards,
      totalMedicines,
      totalOrders,
      pendingOrders,
      wards,
      recentPatients,
      recentOrders,
      medicines,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.ward.count(),
      prisma.medicine.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.ward.findMany({
        include: { _count: { select: { patients: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.patient.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true } },
          ward: { select: { name: true } },
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              patientId: true,
              user: { select: { fullName: true } },
            },
          },
          items: { select: { id: true } },
        },
      }),
      prisma.medicine.findMany(),
    ])

    // Low stock = at or below the medicine's own threshold
    const lowStockMedicines = medicines
      .filter((m) => m.stockQuantity <= m.lowStockThreshold)
      .map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        stockQuantity: m.stockQuantity,
        lowStockThreshold: m.lowStockThreshold,
      }))

    const expiredMedicines = medicines
      .filter((m) => m.expiryDate && m.expiryDate < now)
      .map((m) => ({
        id: m.id,
        name: m.name,
        expiryDate: m.expiryDate,
      }))

    const wardsWithOccupancy = wards.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      capacity: w.capacity,
      occupancy: w._count.patients,
      available: w.capacity - w._count.patients,
    }))

    const totalBeds = wardsWithOccupancy.reduce((sum, w) => sum + w.capacity, 0)
    const occupiedBeds = wardsWithOccupancy.reduce((sum, w) => sum + w.occupancy, 0)

    return sendSuccess(res, {
      stats: {
        totalUsers,
        totalPatients,
        totalWards,
        totalMedicines,
        totalOrders,
        pendingOrders,
        lowStockCount: lowStockMedicines.length,
        expiredCount: expiredMedicines.length,
        bedOccupancy: {
          capacity: totalBeds,
          occupied: occupiedBeds,
          available: totalBeds - occupiedBeds,
        },
      },
      wards: wardsWithOccupancy,
      lowStockMedicines,
      expiredMedicines,
      recentPatients,
      recentOrders,
    })
  }),
]

module.exports = { getDashboard }