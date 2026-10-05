import api from './api'

/* Order endpoints. */

export async function createOrder(items) {
  const { data } = await api.post('/orders', { items })
  return data.data.order
}

export async function getMyOrders() {
  const { data } = await api.get('/orders/my-orders')
  return data.data.orders
}

export async function getOrderById(id) {
  const { data } = await api.get(`/orders/${id}`)
  return data.data.order
}

export async function getAllOrders() {
  const { data } = await api.get('/orders')
  return data.data.orders
}

export async function updateOrderStatus(id, status) {
  const { data } = await api.put(`/orders/${id}/status`, { status })
  return data.data.order
}