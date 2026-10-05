/*
 * End-to-end smoke test for the API.
 *
 * Run it against a running backend:
 *
 *   node prisma/seed.js                 # reset to known demo data first
 *   npm start                           # terminal 1
 *   npm run test:smoke                  # terminal 2
 *
 * It uses plain fetch (built into Node 18+) so there is no test framework to
 * install. Every check prints PASS or FAIL and the script exits non-zero if
 * anything failed, which makes it usable in CI later.
 *
 * It does create data: one test medicine, one test user with a patient
 * profile, and two orders. Reseed afterwards to get the clean demo state back.
 */

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api'
const ADMIN = { email: 'admin@hospital.test', password: 'Admin@12345' }
const PATIENT = { email: 'amina@patient.test', password: 'Admin@12345' }

let passed = 0
const failures = []

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failures.push(label)
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`)
  }
}

function section(title) {
  console.log(`\n${title}`)
}

async function call(path, { method = 'GET', token, body, origin } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  return { status: response.status, body: payload, headers: response.headers }
}

async function main() {
  console.log(`Hospital Management API smoke test -> ${BASE_URL}`)

  // --- Health -----------------------------------------------------------
  section('Health')
  const health = await call('/health')
  check('GET /health returns 200', health.status === 200, `got ${health.status}`)
  check('health payload has uptime', Boolean(health.body?.data?.uptime))

  // --- Authentication ---------------------------------------------------
  section('Authentication')
  const badLogin = await call('/auth/login', {
    method: 'POST',
    body: { email: ADMIN.email, password: 'wrong-password' },
  })
  check('wrong password is rejected with 401', badLogin.status === 401, `got ${badLogin.status}`)

  const badRegister = await call('/auth/register', {
    method: 'POST',
    body: { fullName: '', email: 'not-an-email', password: '1', phone: '', address: '' },
  })
  check('invalid registration is rejected with 400', badRegister.status === 400, `got ${badRegister.status}`)
  check(
    'validation lists the offending fields',
    Array.isArray(badRegister.body?.errors) && badRegister.body.errors.length > 0,
  )

  const adminLogin = await call('/auth/login', { method: 'POST', body: ADMIN })
  check('admin can log in', adminLogin.status === 200, `got ${adminLogin.status}`)
  const adminToken = adminLogin.body?.data?.token

  const patientLogin = await call('/auth/login', { method: 'POST', body: PATIENT })
  check('patient can log in', patientLogin.status === 200, `got ${patientLogin.status}`)
  const patientToken = patientLogin.body?.data?.token

  const me = await call('/auth/me', { token: patientToken })
  check('GET /auth/me returns the signed-in user', me.body?.data?.user?.email === PATIENT.email, `got ${me.body?.data?.user?.email}`)
  check('GET /auth/me never leaks the password hash', me.body?.data?.user?.password === undefined)
  check(
    'GET /auth/me returns the role from the database',
    me.body?.data?.user?.role === 'PATIENT',
  )

  const noToken = await call('/auth/me')
  check('missing token is rejected with 401', noToken.status === 401, `got ${noToken.status}`)

  // --- Patient registration --------------------------------------------
  section('Patient registration and profiles')
  const unique = Date.now()
  const newEmail = `smoke-${unique}@example.com`
  const register = await call('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Smoke Test User',
      email: newEmail,
      password: 'Secret123',
      phone: '+254700000999',
      address: '1 Smoke Test Street',
      role: 'ADMIN', // must be ignored by the server
    },
  })
  check('new user registers', register.status === 200 || register.status === 201, `got ${register.status}`)
  check(
    'a role in the request body is ignored (always PATIENT)',
    register.body?.data?.user?.role === 'PATIENT',
    `got ${register.body?.data?.user?.role}`,
  )
  const smokeToken = register.body?.data?.token

  const duplicate = await call('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Smoke Test User',
      email: newEmail,
      password: 'Secret123',
      phone: '+254700000999',
      address: '1 Smoke Test Street',
    },
  })
  check('duplicate email is rejected with 409', duplicate.status === 409, `got ${duplicate.status}`)

  const noProfile = await call('/patients/me', { token: smokeToken })
  check('new account has no patient profile yet', noProfile.status === 404, `got ${noProfile.status}`)

  const createProfile = await call('/patients', {
    method: 'POST',
    token: smokeToken,
    body: {
      dateOfBirth: '1993-05-05',
      gender: 'FEMALE',
      bloodGroup: 'O+',
      emergencyContact: 'Smoke Contact',
      emergencyPhone: '+254700001999',
    },
  })
  check('patient profile is created', createProfile.status === 201, `got ${createProfile.status} ${createProfile.body?.message}`)
  check(
    'patient ID looks like PAT-000123',
    /^PAT-\d{6}$/.test(createProfile.body?.data?.patient?.patientId || ''),
    createProfile.body?.data?.patient?.patientId,
  )

  const secondProfile = await call('/patients', {
    method: 'POST',
    token: smokeToken,
    body: {
      dateOfBirth: '1993-05-05',
      gender: 'FEMALE',
      emergencyContact: 'Smoke Contact',
      emergencyPhone: '+254700001999',
    },
  })
  check('a second profile is rejected with 409', secondProfile.status === 409, `got ${secondProfile.status}`)

  const myProfile = await call('/patients/me', { token: smokeToken })
  check('GET /patients/me returns the profile', myProfile.status === 200, `got ${myProfile.status}`)

  const profileId = myProfile.body?.data?.patient?.id
  const otherPatient = await call(`/patients/${profileId}`, { token: patientToken })
  check('another patient cannot read this profile (403)', otherPatient.status === 403, `got ${otherPatient.status}`)

  const patientList = await call('/patients', { token: patientToken })
  check('patients cannot list all patients (403)', patientList.status === 403, `got ${patientList.status}`)

  const adminList = await call('/patients', { token: adminToken })
  check('admin can list all patients', adminList.status === 200, `got ${adminList.status}`)

  // --- Medicines --------------------------------------------------------
  section('Pharmacy')
  const medicines = await call('/medicines', { token: patientToken })
  check('logged-in patient can list medicines', medicines.status === 200, `got ${medicines.status}`)
  const catalogue = medicines.body?.data?.medicines || []
  check('seed data has medicines', catalogue.length > 0, `found ${catalogue.length}`)

  const inStock = await call('/medicines?inStock=true', { token: patientToken })
  const inStockList = inStock.body?.data?.medicines || []
  check(
    'inStock=true returns only stocked medicines',
    inStockList.every((m) => m.stockQuantity > 0),
  )

  const expired = await call('/medicines?expired=true', { token: patientToken })
  check('expired=true filter runs without error', expired.status === 200, `got ${expired.status}`)

  const search = await call('/medicines?q=ORS', { token: patientToken })
  check(
    'search finds the ORS sachet',
    (search.body?.data?.medicines || []).some((m) => m.name.includes('ORS')),
  )

  const anonymous = await call('/medicines')
  check('anonymous medicine access is rejected (401)', anonymous.status === 401, `got ${anonymous.status}`)

  // CORS only matters to browsers, and curl without an Origin header never
  // exercises it, so send the header explicitly.
  const allowedOrigin = await call('/medicines', {
    token: patientToken,
    origin: 'http://localhost:5173',
  })
  check(
    'a configured origin is answered with CORS headers',
    allowedOrigin.status === 200 &&
      allowedOrigin.headers.get('access-control-allow-origin') === 'http://localhost:5173',
    `status ${allowedOrigin.status}, header ${allowedOrigin.headers.get('access-control-allow-origin')}`,
  )

  const evilOrigin = await call('/medicines', {
    token: patientToken,
    origin: 'https://evil.example.com',
  })
  check(
    'an unknown origin gets no CORS allow header (browser blocks it)',
    evilOrigin.headers.get('access-control-allow-origin') === null,
    `header ${evilOrigin.headers.get('access-control-allow-origin')}`,
  )
  check(
    'an unknown origin is not turned into a 500',
    evilOrigin.status !== 500,
    `got ${evilOrigin.status}`,
  )

  const medicineName = `Smoke Medicine ${unique}`
  const created = await call('/medicines', {
    method: 'POST',
    token: adminToken,
    body: {
      name: medicineName,
      description: 'Created by the smoke test',
      category: 'Supplement',
      price: '25.50',
      stockQuantity: 10,
      lowStockThreshold: 3,
    },
  })
  check('admin can add a medicine', created.status === 201, `got ${created.status}`)
  const medicineId = created.body?.data?.medicine?.id
  check('medicine price is stored as a decimal', created.body?.data?.medicine?.price === '25.5' || created.body?.data?.medicine?.price === '25.50', created.body?.data?.medicine?.price)

  const patientCreate = await call('/medicines', {
    method: 'POST',
    token: patientToken,
    body: { name: 'Nope', category: 'Supplement', price: '1', stockQuantity: 1 },
  })
  check('patients cannot add medicines (403)', patientCreate.status === 403, `got ${patientCreate.status}`)

  const badPrice = await call('/medicines', {
    method: 'POST',
    token: adminToken,
    body: { name: `Bad ${unique}`, category: 'Supplement', price: '-5', stockQuantity: 1 },
  })
  check('negative price is rejected with 400', badPrice.status === 400, `got ${badPrice.status}`)

  const restocked = await call(`/medicines/${medicineId}`, {
    method: 'PUT',
    token: adminToken,
    body: { stockQuantity: 4 },
  })
  check('admin can restock a medicine', restocked.status === 200, `got ${restocked.status}`)
  check('stock reflects the update', Number(restocked.body?.data?.medicine?.stockQuantity) === 4)

  // --- Orders -----------------------------------------------------------
  section('Orders')
  const order = await call('/orders', {
    method: 'POST',
    token: smokeToken,
    body: { items: [{ medicineId, quantity: 2 }] },
  })
  check('patient can place an order', order.status === 201, `got ${order.status}`)
  const orderBody = order.body?.data?.order
  check('total is calculated on the server', Number(orderBody?.totalAmount) === 51, `got ${orderBody?.totalAmount}`)
  check('unit price is frozen onto the order item', Number(orderBody?.items?.[0]?.unitPrice) === 25.5)
  const orderId = orderBody?.id

  const afterOrder = await call(`/medicines/${medicineId}`, { token: adminToken })
  check(
    'stock decreased by the ordered amount',
    Number(afterOrder.body?.data?.medicine?.stockQuantity) === 2,
    `got ${afterOrder.body?.data?.medicine?.stockQuantity}`,
  )

  const tooMany = await call('/orders', {
    method: 'POST',
    token: smokeToken,
    body: { items: [{ medicineId, quantity: 99 }] },
  })
  check('insufficient stock is rejected with 400', tooMany.status === 400, `got ${tooMany.status}`)

  const rollback = await call(`/medicines/${medicineId}`, { token: adminToken })
  check(
    'the failed order left stock untouched',
    Number(rollback.body?.data?.medicine?.stockQuantity) === 2,
    `got ${rollback.body?.data?.medicine?.stockQuantity}`,
  )

  const badQuantity = await call('/orders', {
    method: 'POST',
    token: smokeToken,
    body: { items: [{ medicineId, quantity: 0 }] },
  })
  check('quantity 0 is rejected with 400', badQuantity.status === 400, `got ${badQuantity.status}`)

  const myOrders = await call('/orders/my-orders', { token: smokeToken })
  check('own order history is returned', myOrders.status === 200, `got ${myOrders.status}`)
  check('history contains the new order', (myOrders.body?.data?.orders || []).some((o) => o.id === orderId))

  const foreignOrder = await call(`/orders/${orderId}`, { token: patientToken })
  check("another patient cannot read this order (403)", foreignOrder.status === 403, `got ${foreignOrder.status}`)

  const patientStatus = await call(`/orders/${orderId}/status`, {
    method: 'PUT',
    token: smokeToken,
    body: { status: 'COMPLETED' },
  })
  check('patients cannot change order status (403)', patientStatus.status === 403, `got ${patientStatus.status}`)

  const adminStatus = await call(`/orders/${orderId}/status`, {
    method: 'PUT',
    token: adminToken,
    body: { status: 'CONFIRMED' },
  })
  check('admin can update order status', adminStatus.status === 200, `got ${adminStatus.status}`)
  check('new status was saved', adminStatus.body?.data?.order?.status === 'CONFIRMED')

  const badStatus = await call(`/orders/${orderId}/status`, {
    method: 'PUT',
    token: adminToken,
    body: { status: 'TELEPORTED' },
  })
  check('an unknown status is rejected with 400', badStatus.status === 400, `got ${badStatus.status}`)

  const allOrders = await call('/orders', { token: adminToken })
  check('admin can list all orders', allOrders.status === 200, `got ${allOrders.status}`)

  // --- Wards ------------------------------------------------------------
  section('Wards')
  const wards = await call('/wards', { token: adminToken })
  check('wards are listed with occupancy', wards.status === 200, `got ${wards.status}`)
  const wardList = wards.body?.data?.wards || []
  check(
    'every ward reports an occupancy number',
    wardList.every((w) => typeof w.occupancy === 'number'),
  )

  const wardName = `Smoke Ward ${unique}`
  const newWard = await call('/wards', {
    method: 'POST',
    token: adminToken,
    body: { name: wardName, type: 'GENERAL', capacity: 1, description: 'Created by the smoke test' },
  })
  check('admin can create a ward', newWard.status === 201, `got ${newWard.status}`)
  check('the new ward has an id we can use', typeof newWard.body?.data?.ward?.id === 'number')
  const wardId = newWard.body?.data?.ward?.id

  const negativeCapacity = await call('/wards', {
    method: 'POST',
    token: adminToken,
    body: { name: `Negative ${unique}`, type: 'GENERAL', capacity: -1 },
  })
  check('negative capacity is rejected with 400', negativeCapacity.status === 400, `got ${negativeCapacity.status}`)

  const patientWard = await call('/wards', { method: 'POST', token: patientToken, body: { name: 'Nope', type: 'GENERAL', capacity: 1 } })
  check('patients cannot create wards (403)', patientWard.status === 403, `got ${patientWard.status}`)

  const firstAssign = await call(`/wards/${wardId}/patients/${profileId}`, {
    method: 'POST',
    token: adminToken,
  })
  check('admin can assign a patient to a ward', firstAssign.status === 200, `got ${firstAssign.status} ${firstAssign.body?.message}`)
  check('assignment returns the updated ward occupancy', firstAssign.body?.data?.ward?.occupancy === 1)

  const seededPatient = await call('/patients/me', { token: patientToken })
  const secondPatientId = seededPatient.body?.data?.patient?.id
  const overflow = await call(`/wards/${wardId}/patients/${secondPatientId}`, {
    method: 'POST',
    token: adminToken,
  })
  check('a full ward rejects another patient with 400', overflow.status === 400, `got ${overflow.status}`)

  const deleteOccupied = await call(`/wards/${wardId}`, { method: 'DELETE', token: adminToken })
  check('a ward with patients cannot be deleted', deleteOccupied.status === 400, `got ${deleteOccupied.status}`)

  const transfer = await call(`/wards/${wardId}/patients/${profileId}`, { method: 'DELETE', token: adminToken })
  check('admin can remove a patient from a ward', transfer.status === 200, `got ${transfer.status}`)

  const deleteWard = await call(`/wards/${wardId}`, { method: 'DELETE', token: adminToken })
  check('an empty ward can be deleted', deleteWard.status === 200, `got ${deleteWard.status}`)

  // --- Admin dashboard --------------------------------------------------
  section('Admin dashboard')
  const dashboard = await call('/admin/dashboard', { token: adminToken })
  check('admin can read the dashboard', dashboard.status === 200, `got ${dashboard.status}`)
  const stats = dashboard.body?.data?.stats
  check('dashboard reports patient count', typeof stats?.totalPatients === 'number')
  check('dashboard reports bed occupancy', typeof stats?.bedOccupancy?.capacity === 'number')
  check('dashboard lists low stock medicines', Array.isArray(dashboard.body?.data?.lowStockMedicines))

  const patientDashboard = await call('/admin/dashboard', { token: patientToken })
  check('patients cannot read the dashboard (403)', patientDashboard.status === 403, `got ${patientDashboard.status}`)

  // --- Cleanup ----------------------------------------------------------
  section('Cleanup')
  const deleteReferenced = await call(`/medicines/${medicineId}`, { method: 'DELETE', token: adminToken })
  check(
    'a medicine referenced by an order cannot be deleted (409)',
    deleteReferenced.status === 409,
    `got ${deleteReferenced.status}`,
  )

  // --- Summary ----------------------------------------------------------
  console.log(`\n${passed} passed, ${failures.length} failed`)
  if (failures.length > 0) {
    console.log('Failed checks:')
    failures.forEach((label) => console.log(`  - ${label}`))
    process.exitCode = 1
    return
  }
  console.log('All checks passed. Run `node prisma/seed.js` to reset the data.')
}

main().catch((error) => {
  console.error('\nSmoke test crashed:', error.message)
  console.error('Is the backend running on port 5000?')
  process.exitCode = 1
})