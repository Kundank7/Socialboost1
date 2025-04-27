"use server"

import {
  getUserByUid,
  getAllUsers,
  getOrderById,
  getOrdersByUserId,
  getOrdersByEmail,
  getAllOrders,
  createOrder as createOrderDB,
  updateOrderStatus as updateOrderStatusDB,
  getAllServices,
  getServicesByPlatform,
  createService,
  updateService as updateServiceDB,
  deleteService as deleteServiceDB,
  createTestimonial,
  getApprovedTestimonials as getApprovedTestimonialsDB,
  getAllTestimonials,
  updateTestimonialApproval as updateTestimonialApprovalDB,
  updateSetting,
  getAllSettings,
  verifyAdmin,
  getUserWallet,
  createDeposit,
  getUserDeposits,
  getAllDeposits,
  updateDepositStatus,
  approveDeposit as approveDepositDB,
  getUserTransactions,
} from "@/lib/db"
import { neon } from "@neondatabase/serverless"

// User actions
export async function getCurrentUser(uid: string) {
  try {
    const user = await getUserByUid(uid)
    return { success: true, user }
  } catch (error) {
    console.error("Error fetching user:", error)
    return { success: false, error: "Failed to fetch user" }
  }
}

// Order actions
export async function getOrder(orderId: string) {
  try {
    const order = await getOrderById(orderId)
    return { success: true, order }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { success: false, error: "Failed to fetch order" }
  }
}

export async function getUserOrders(userId: number) {
  try {
    const orders = await getOrdersByUserId(userId)
    return { success: true, orders }
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return { success: false, error: "Failed to fetch orders" }
  }
}

export async function getEmailOrders(email: string) {
  try {
    const orders = await getOrdersByEmail(email)
    return { success: true, orders }
  } catch (error) {
    console.error("Error fetching email orders:", error)
    return { success: false, error: "Failed to fetch orders" }
  }
}

export async function createOrder(orderData: {
  user_id?: number
  platform: string
  service: string
  link?: string
  quantity: number
  total: number
  name: string
  email: string
  message?: string
  screenshot?: string
  wallet_payment?: boolean
}) {
  try {
    const order = await createOrderDB(orderData)
    return { success: true, order }
  } catch (error) {
    console.error("Error creating order:", error)
    return { success: false, error: "Failed to create order" }
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const order = await updateOrderStatusDB(orderId, status)
    return { success: true, order }
  } catch (error) {
    console.error("Error updating order:", error)
    return { success: false, error: "Failed to update order" }
  }
}

// Service actions
export async function getAllPlatforms() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const platforms = await sql`SELECT DISTINCT platform FROM services WHERE active = true ORDER BY platform`
    return { success: true, platforms: platforms.map((p) => p.platform) }
  } catch (error) {
    console.error("Error fetching platforms:", error)
    return { success: false, error: "Failed to fetch platforms" }
  }
}

export async function getAllActiveServices() {
  try {
    const services = await getAllServices()
    return { success: true, services }
  } catch (error) {
    console.error("Error fetching services:", error)
    return { success: false, error: "Failed to fetch services" }
  }
}

export async function getServicesByPlatformName(platform: string) {
  try {
    const services = await getServicesByPlatform(platform)
    return { success: true, services }
  } catch (error) {
    console.error("Error fetching services:", error)
    return { success: false, error: "Failed to fetch services" }
  }
}

// Testimonial actions
export async function getApprovedTestimonialsData() {
  try {
    const testimonials = await getApprovedTestimonialsDB()
    return testimonials
  } catch (error) {
    console.error("Error getting approved testimonials:", error)
    throw new Error("Failed to fetch testimonials")
  }
}

export async function submitTestimonial(testimonialData: {
  user_id?: number
  name: string
  title: string
  rating: number
  content: string
  avatar?: string
}) {
  try {
    const testimonial = await createTestimonial(testimonialData)
    return { success: true, testimonial }
  } catch (error) {
    console.error("Error submitting testimonial:", error)
    return { success: false, error: "Failed to submit testimonial" }
  }
}

// Wallet actions
export async function getUserWalletData(userId: number) {
  try {
    const wallet = await getUserWallet(userId)
    return { success: true, wallet }
  } catch (error) {
    console.error("Error fetching wallet:", error)
    return { success: false, error: "Failed to fetch wallet" }
  }
}

export async function createUserDeposit(depositData: {
  user_id: number
  amount_usd: number
  amount_inr?: number
  payment_method: string
  screenshot?: string
  transaction_id?: string
}) {
  try {
    const deposit = await createDeposit(depositData)
    return { success: true, deposit }
  } catch (error) {
    console.error("Error creating deposit:", error)
    return { success: false, error: "Failed to create deposit" }
  }
}

export async function getUserDepositHistory(userId: number) {
  try {
    const deposits = await getUserDeposits(userId)
    return { success: true, deposits }
  } catch (error) {
    console.error("Error fetching deposits:", error)
    return { success: false, error: "Failed to fetch deposits" }
  }
}

export async function getUserTransactionHistory(userId: number) {
  try {
    const transactions = await getUserTransactions(userId)
    return { success: true, transactions }
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return { success: false, error: "Failed to fetch transactions" }
  }
}

// Admin actions
export async function adminLogin(credentials: { username: string; password: string }) {
  try {
    const { username, password } = credentials
    const isValid = await verifyAdmin(username, password)
    return { success: isValid }
  } catch (error) {
    console.error("Error during admin login:", error)
    return { success: false, error: "Failed to verify admin credentials" }
  }
}

export async function adminGetAllOrders() {
  try {
    const orders = await getAllOrders()
    return { success: true, orders }
  } catch (error) {
    console.error("Error fetching all orders:", error)
    return { success: false, error: "Failed to fetch orders" }
  }
}

export async function adminGetAllTestimonials() {
  try {
    const testimonials = await getAllTestimonials()
    return { success: true, testimonials }
  } catch (error) {
    console.error("Error fetching all testimonials:", error)
    return { success: false, error: "Failed to fetch testimonials" }
  }
}

export async function adminApproveTestimonial(id: number, approved: boolean) {
  try {
    const testimonial = await updateTestimonialApprovalDB(id, approved)
    return { success: true, testimonial }
  } catch (error) {
    console.error("Error updating testimonial approval:", error)
    return { success: false, error: "Failed to update testimonial" }
  }
}

export async function adminGetAllDeposits(status?: string) {
  try {
    const deposits = await getAllDeposits(status)
    return { success: true, deposits }
  } catch (error) {
    console.error("Error fetching all deposits:", error)
    return { success: false, error: "Failed to fetch deposits" }
  }
}

export async function adminUpdateDepositStatus(depositId: number, status: string, adminNotes?: string) {
  try {
    const deposit = await updateDepositStatus(depositId, status, adminNotes)
    return { success: true, deposit }
  } catch (error) {
    console.error("Error updating deposit status:", error)
    return { success: false, error: "Failed to update deposit" }
  }
}

export async function adminApproveDeposit(depositId: number, adminNotes?: string) {
  try {
    const deposit = await approveDepositDB(depositId, adminNotes)
    return { success: true, deposit }
  } catch (error) {
    console.error("Error approving deposit:", error)
    return { success: false, error: "Failed to approve deposit" }
  }
}

export async function adminGetAllUsers() {
  try {
    const users = await getAllUsers()
    return { success: true, users }
  } catch (error) {
    console.error("Error fetching all users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function adminGetAllSettings() {
  try {
    const settings = await getAllSettings()
    return { success: true, settings }
  } catch (error) {
    console.error("Error fetching all settings:", error)
    return { success: false, error: "Failed to fetch settings" }
  }
}

export async function adminUpdateSetting(key: string, value: string) {
  try {
    const setting = await updateSetting(key, value)
    return { success: true, setting }
  } catch (error) {
    console.error("Error updating setting:", error)
    return { success: false, error: "Failed to update setting" }
  }
}

export async function adminCreateService(serviceData: { platform: string; name: string; price: number }) {
  try {
    const service = await createService(serviceData)
    return { success: true, service }
  } catch (error) {
    console.error("Error creating service:", error)
    return { success: false, error: "Failed to create service" }
  }
}

export async function adminUpdateService(
  id: number,
  serviceData: { platform?: string; name?: string; price?: number; active?: boolean },
) {
  try {
    const service = await updateServiceDB(id, serviceData)
    return { success: true, service }
  } catch (error) {
    console.error("Error updating service:", error)
    return { success: false, error: "Failed to update service" }
  }
}

export async function adminDeleteService(id: number) {
  try {
    const service = await deleteServiceDB(id)
    return { success: true, service }
  } catch (error) {
    console.error("Error deleting service:", error)
    return { success: false, error: "Failed to delete service" }
  }
}

export async function adminLogout() {
  return { success: true }
}

export async function checkAdminSession() {
  return { success: true }
}

export async function addService(serviceData: { platform: string; name: string; price: number }) {
  try {
    const service = await createService(serviceData)
    return { success: true, service }
  } catch (error) {
    console.error("Error creating service:", error)
    return { success: false, error: "Failed to create service" }
  }
}

export async function approveTestimonial(id: number) {
  try {
    const testimonial = await updateTestimonialApprovalDB(id, true)
    return { success: true, testimonial }
  } catch (error) {
    console.error("Error approving testimonial:", error)
    return { success: false, error: "Failed to approve testimonial" }
  }
}

export async function rejectTestimonial(id: number) {
  try {
    const testimonial = await updateTestimonialApprovalDB(id, false)
    return { success: true, testimonial }
  } catch (error) {
    console.error("Error rejecting testimonial:", error)
    return { success: false, error: "Failed to reject testimonial" }
  }
}

export async function approveDeposit(depositId: number, adminNotes?: string) {
  try {
    const deposit = await approveDepositDB(depositId, adminNotes)
    return { success: true, deposit }
  } catch (error) {
    console.error("Error approving deposit:", error)
    return { success: false, error: "Failed to approve deposit" }
  }
}

export async function rejectDeposit(depositId: number, adminNotes?: string) {
  try {
    const deposit = await updateDepositStatus(depositId, "Rejected", adminNotes)
    return { success: true, deposit }
  } catch (error) {
    console.error("Error rejecting deposit:", error)
    return { success: false, error: "Failed to reject deposit" }
  }
}

export async function getUSDToINRRate(): Promise<number> {
  return 83.5
}
