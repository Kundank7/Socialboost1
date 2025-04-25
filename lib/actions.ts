"use server"

import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"
import type { Order, Testimonial, Service, Deposit, Transaction, Wallet } from "./types"
import {
  createDeposit as dbCreateDeposit,
  getWalletByUserId,
  updateWalletBalance,
  createTransaction,
  getPendingDeposits,
  updateDepositStatus as dbUpdateDepositStatus,
  getDepositsByUserId,
  getTransactionsByUserId,
  getDepositById,
} from "./db"

// Mock database
const orders: Order[] = []
const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Sarah Johnson",
    title: "Instagram Influencer",
    rating: 5,
    content:
      "SocialBoost helped me grow my Instagram following by over 10,000 in just one month. The engagement is real and my reach has increased dramatically!",
    approved: true,
    avatar: "/placeholder.svg?height=50&width=50",
    createdAt: new Date().toISOString(),
  },
  {
    id: "t2",
    name: "Michael Chen",
    title: "YouTube Creator",
    rating: 5,
    content:
      "I was struggling to get my YouTube channel off the ground until I found SocialBoost. Their services helped me gain subscribers and views, which led to monetization!",
    approved: true,
    avatar: "/placeholder.svg?height=50&width=50",
    createdAt: new Date().toISOString(),
  },
  {
    id: "t3",
    name: "Emily Rodriguez",
    title: "Business Owner",
    rating: 5,
    content:
      "As a small business owner, social media presence is crucial. SocialBoost helped me establish credibility with a strong following on Facebook and Instagram.",
    approved: true,
    avatar: "/placeholder.svg?height=50&width=50",
    createdAt: new Date().toISOString(),
  },
]
let services: Service[] = [
  {
    id: "s1",
    platform: "Instagram",
    name: "Followers",
    price: 0.5,
  },
  {
    id: "s2",
    platform: "Instagram",
    name: "Likes",
    price: 0.5,
  },
  {
    id: "s3",
    platform: "Facebook",
    name: "Page Likes",
    price: 0.5,
  },
  {
    id: "s4",
    platform: "YouTube",
    name: "Subscribers",
    price: 0.5,
  },
]

// Mock wallets and deposits for development
const wallets: Record<number, Wallet> = {}
const deposits: Deposit[] = []
const transactions: Transaction[] = []

// Admin credentials (in a real app, this would be in a database with hashed passwords)
const adminCredentials = {
  username: "admin",
  password: "admin123",
}

// Create a new order
export async function createOrder(
  orderData: Omit<Order, "id">,
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const id = uuidv4()
    const newOrder: Order = {
      id,
      ...orderData,
    }

    orders.push(newOrder)

    return { success: true, orderId: id }
  } catch (error) {
    console.error("Error creating order:", error)
    return { success: false, error: "Failed to create order" }
  }
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const order = orders.find((o) => o.id === orderId)

    if (!order) {
      return { success: false, error: "Order not found" }
    }

    return { success: true, order }
  } catch (error) {
    console.error("Error getting order:", error)
    return { success: false, error: "Failed to get order" }
  }
}

// Get orders by email
export async function getOrdersByEmail(email: string): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const order = orders.find((o) => o.email.toLowerCase() === email.toLowerCase())

    if (!order) {
      return { success: false, error: "No orders found for this email" }
    }

    return { success: true, order }
  } catch (error) {
    console.error("Error getting order by email:", error)
    return { success: false, error: "Failed to get order" }
  }
}

// Submit a testimonial
export async function submitTestimonial(
  testimonialData: Omit<Testimonial, "id">,
): Promise<{ success: boolean; error?: string }> {
  try {
    const id = uuidv4()
    const newTestimonial: Testimonial = {
      id,
      ...testimonialData,
    }

    testimonials.push(newTestimonial)

    return { success: true }
  } catch (error) {
    console.error("Error submitting testimonial:", error)
    return { success: false, error: "Failed to submit testimonial" }
  }
}

// Get approved testimonials
export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  return testimonials.filter((t) => t.approved)
}

// Admin login
export async function adminLogin({
  username,
  password,
}: { username: string; password: string }): Promise<{ success: boolean; error?: string }> {
  try {
    if (username === adminCredentials.username && password === adminCredentials.password) {
      // Set a cookie to maintain session
      cookies().set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      })

      return { success: true }
    }

    return { success: false, error: "Invalid credentials" }
  } catch (error) {
    console.error("Error during login:", error)
    return { success: false, error: "Login failed" }
  }
}

// Admin logout
export async function adminLogout(): Promise<{ success: boolean }> {
  cookies().delete("admin_session")
  return { success: true }
}

// Check admin session
export async function checkAdminSession(): Promise<{ success: boolean }> {
  const session = cookies().get("admin_session")
  return { success: !!session }
}

// Get all orders (admin only)
export async function getAllOrders(): Promise<{ success: boolean; orders: Order[] }> {
  return { success: true, orders }
}

// Get all testimonials (admin only)
export async function getAllTestimonials(): Promise<{ success: boolean; testimonials: Testimonial[] }> {
  return { success: true, testimonials }
}

// Get all services (admin only)
export async function getAllServices(): Promise<{ success: boolean; services: Service[] }> {
  return { success: true, services }
}

// Update order status (admin only)
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const orderIndex = orders.findIndex((o) => o.id === orderId)

    if (orderIndex === -1) {
      return { success: false, error: "Order not found" }
    }

    orders[orderIndex].status = status

    return { success: true }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { success: false, error: "Failed to update order status" }
  }
}

// Approve testimonial (admin only)
export async function approveTestimonial(testimonialId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const testimonialIndex = testimonials.findIndex((t) => t.id === testimonialId)

    if (testimonialIndex === -1) {
      return { success: false, error: "Testimonial not found" }
    }

    testimonials[testimonialIndex].approved = true

    return { success: true }
  } catch (error) {
    console.error("Error approving testimonial:", error)
    return { success: false, error: "Failed to approve testimonial" }
  }
}

// Reject testimonial (admin only)
export async function rejectTestimonial(testimonialId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const testimonialIndex = testimonials.findIndex((t) => t.id === testimonialId)

    if (testimonialIndex === -1) {
      return { success: false, error: "Testimonial not found" }
    }

    testimonials[testimonialIndex].approved = false

    return { success: true }
  } catch (error) {
    console.error("Error rejecting testimonial:", error)
    return { success: false, error: "Failed to reject testimonial" }
  }
}

// Update service (admin only)
export async function updateService(
  serviceId: string,
  serviceData: Partial<Service>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const serviceIndex = services.findIndex((s) => s.id === serviceId)

    if (serviceIndex === -1) {
      return { success: false, error: "Service not found" }
    }

    services[serviceIndex] = {
      ...services[serviceIndex],
      ...serviceData,
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating service:", error)
    return { success: false, error: "Failed to update service" }
  }
}

// Delete service (admin only)
export async function deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const serviceIndex = services.findIndex((s) => s.id === serviceId)

    if (serviceIndex === -1) {
      return { success: false, error: "Service not found" }
    }

    services = services.filter((s) => s.id !== serviceId)

    return { success: true }
  } catch (error) {
    console.error("Error deleting service:", error)
    return { success: false, error: "Failed to delete service" }
  }
}

// Add service (admin only)
export async function addService(
  serviceData: Omit<Service, "id">,
): Promise<{ success: boolean; service?: Service; error?: string }> {
  try {
    const id = uuidv4()
    const newService: Service = {
      id,
      ...serviceData,
    }

    services.push(newService)

    return { success: true, service: newService }
  } catch (error) {
    console.error("Error adding service:", error)
    return { success: false, error: "Failed to add service" }
  }
}

export async function getUserOrders(userId: string): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
  try {
    // Since this is a mock database, we'll just filter the orders array
    const userOrders = orders.filter((order) => order.email === userId) // Changed to email to match mock data

    return { success: true, orders: userOrders }
  } catch (error) {
    console.error("Error getting user orders:", error)
    return { success: false, error: "Failed to get user orders" }
  }
}

export async function getServicesByPlatform(
  platform: string,
): Promise<{ success: boolean; services?: { id: number; name: string; price: number }[]; error?: string }> {
  try {
    const filteredServices = services
      .filter((service) => service.platform.toLowerCase() === platform.toLowerCase())
      .map((s) => ({ id: Number.parseInt(s.id.substring(1)), name: s.name, price: s.price }))
    return { success: true, services: filteredServices }
  } catch (error) {
    console.error("Error getting services by platform:", error)
    return { success: false, error: "Failed to get services by platform" }
  }
}

export async function getAllPlatforms(): Promise<{ success: boolean; platforms?: string[]; error?: string }> {
  try {
    const platforms = [...new Set(services.map((service) => service.platform))]
    return { success: true, platforms: platforms }
  } catch (error) {
    console.error("Error getting all platforms:", error)
    return { success: false, error: "Failed to get all platforms" }
  }
}

// Wallet and Deposit Functions

// Get wallet balance
export async function getWalletBalance(
  userId: number,
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    // In a real app, this would fetch from the database
    const wallet = await getWalletByUserId(userId)

    if (!wallet) {
      return { success: false, error: "Wallet not found" }
    }

    return { success: true, balance: wallet.balance }
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    return { success: false, error: "Failed to get wallet balance" }
  }
}

// Create a deposit request
export async function createDeposit(depositData: {
  user_id: number
  amount: number
  amount_inr?: number
  payment_method: "qr" | "crypto"
  currency?: string
  screenshot: string
}): Promise<{ success: boolean; depositId?: string; error?: string }> {
  try {
    // Validate minimum deposit amount
    if (depositData.amount < 1) {
      return { success: false, error: "Minimum deposit amount is $1" }
    }

    // In a real app, this would create a record in the database
    const deposit = await dbCreateDeposit({
      ...depositData,
      status: "pending",
    })

    if (!deposit) {
      return { success: false, error: "Failed to create deposit" }
    }

    return { success: true, depositId: deposit.deposit_id }
  } catch (error) {
    console.error("Error creating deposit:", error)
    return { success: false, error: "Failed to create deposit request" }
  }
}

// Get user deposits
export async function getUserDeposits(
  userId: number,
): Promise<{ success: boolean; deposits?: Deposit[]; error?: string }> {
  try {
    const deposits = await getDepositsByUserId(userId)
    return { success: true, deposits }
  } catch (error) {
    console.error("Error getting user deposits:", error)
    return { success: false, error: "Failed to get deposits" }
  }
}

// Get user transactions
export async function getUserTransactions(
  userId: number,
): Promise<{ success: boolean; transactions?: Transaction[]; error?: string }> {
  try {
    const transactions = await getTransactionsByUserId(userId)
    return { success: true, transactions }
  } catch (error) {
    console.error("Error getting user transactions:", error)
    return { success: false, error: "Failed to get transactions" }
  }
}

// Get pending deposits (admin only)
export async function getPendingDepositsForAdmin(): Promise<{
  success: boolean
  deposits?: Deposit[]
  error?: string
}> {
  try {
    const deposits = await getPendingDeposits()
    return { success: true, deposits }
  } catch (error) {
    console.error("Error getting pending deposits:", error)
    return { success: false, error: "Failed to get pending deposits" }
  }
}

// Approve deposit (admin only)
export async function approveDeposit(depositId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the deposit
    const deposit = await getDepositById(depositId)

    if (!deposit) {
      return { success: false, error: "Deposit not found" }
    }

    // Update deposit status
    const updatedDeposit = await dbUpdateDepositStatus(depositId, "completed")

    if (!updatedDeposit) {
      return { success: false, error: "Failed to update deposit status" }
    }

    // Get current wallet balance
    const wallet = await getWalletByUserId(deposit.user_id)

    if (!wallet) {
      return { success: false, error: "Wallet not found" }
    }

    // Update wallet balance
    const newBalance = wallet.balance + deposit.amount
    await updateWalletBalance(deposit.user_id, newBalance)

    // Create transaction record
    await createTransaction({
      user_id: deposit.user_id,
      type: "deposit",
      amount: deposit.amount,
      description: `Deposit of $${deposit.amount.toFixed(2)} via ${deposit.payment_method === "qr" ? "QR/UPI" : "Cryptocurrency"}`,
      reference_id: deposit.deposit_id,
    })

    return { success: true }
  } catch (error) {
    console.error("Error approving deposit:", error)
    return { success: false, error: "Failed to approve deposit" }
  }
}

// Reject deposit (admin only)
export async function rejectDeposit(depositId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const updatedDeposit = await dbUpdateDepositStatus(depositId, "rejected")

    if (!updatedDeposit) {
      return { success: false, error: "Failed to update deposit status" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error rejecting deposit:", error)
    return { success: false, error: "Failed to reject deposit" }
  }
}

// Check if user has sufficient balance
export async function checkSufficientBalance(
  userId: number,
  amount: number,
): Promise<{ success: boolean; hasBalance: boolean; balance?: number; error?: string }> {
  try {
    const wallet = await getWalletByUserId(userId)

    if (!wallet) {
      return { success: false, hasBalance: false, error: "Wallet not found" }
    }

    const hasBalance = wallet.balance >= amount

    return { success: true, hasBalance, balance: wallet.balance }
  } catch (error) {
    console.error("Error checking balance:", error)
    return { success: false, hasBalance: false, error: "Failed to check balance" }
  }
}

// Deduct from wallet for purchase
export async function deductFromWallet(
  userId: number,
  amount: number,
  orderId: string,
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    // Check if user has sufficient balance
    const balanceCheck = await checkSufficientBalance(userId, amount)

    if (!balanceCheck.success || !balanceCheck.hasBalance) {
      return { success: false, error: "Insufficient balance" }
    }

    // Get current wallet balance
    const wallet = await getWalletByUserId(userId)

    // Update wallet balance
    const newBalance = wallet.balance - amount
    await updateWalletBalance(userId, newBalance)

    // Create transaction record
    await createTransaction({
      user_id: userId,
      type: "purchase",
      amount: -amount,
      description: `Purchase of services for $${amount.toFixed(2)}`,
      reference_id: orderId,
    })

    return { success: true, newBalance }
  } catch (error) {
    console.error("Error deducting from wallet:", error)
    return { success: false, error: "Failed to process payment" }
  }
}

// Get current USD to INR exchange rate
export async function getUsdToInrRate(): Promise<{ success: boolean; rate?: number; error?: string }> {
  try {
    // In a real app, this would fetch from an API
    // For now, we'll use a fixed rate
    const rate = 83.5

    return { success: true, rate }
  } catch (error) {
    console.error("Error getting exchange rate:", error)
    return { success: false, error: "Failed to get exchange rate" }
  }
}

// Convert USD to INR with rounding
export async function convertUsdToInr(
  amountUsd: number,
): Promise<{ success: boolean; amountInr?: number; error?: string }> {
  try {
    const rateResult = await getUsdToInrRate()

    if (!rateResult.success) {
      return { success: false, error: rateResult.error }
    }

    // Convert and round up to nearest integer
    const amountInr = Math.ceil(amountUsd * rateResult.rate!)

    return { success: true, amountInr }
  } catch (error) {
    console.error("Error converting currency:", error)
    return { success: false, error: "Failed to convert currency" }
  }
}
