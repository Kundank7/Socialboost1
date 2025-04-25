import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"
import type { Deposit, Transaction } from "./types"

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

// User functions
export async function getUserByEmail(email: string) {
  const query = `SELECT * FROM users WHERE email = $1 LIMIT 1`
  const result = await sql(query, [email])
  return result.length > 0 ? result[0] : null
}

export async function getUserByUid(uid: string) {
  const query = `SELECT * FROM users WHERE uid = $1 LIMIT 1`
  const result = await sql(query, [uid])
  return result.length > 0 ? result[0] : null
}

export async function createUser(userData: { uid: string; email: string; name: string; photo_url?: string }) {
  const { uid, email, name, photo_url } = userData
  const query = `
    INSERT INTO users (uid, email, name, photo_url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (uid) DO UPDATE
    SET email = $2, name = $3, photo_url = $4
    RETURNING *
  `
  const result = await sql(query, [uid, email, name, photo_url || null])

  // Create wallet for new user
  const user = result[0]
  await createWalletIfNotExists(user.id)

  return user
}

export async function getAllUsers() {
  const query = `SELECT * FROM users ORDER BY created_at DESC`
  return await sql(query)
}

// Order functions
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
}) {
  const order_id = uuidv4()
  const { user_id, platform, service, link, quantity, total, name, email, message, screenshot } = orderData

  const query = `
    INSERT INTO orders (
      order_id, user_id, platform, service, link, quantity, 
      total, status, name, email, message, screenshot
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `

  const result = await sql(query, [
    order_id,
    user_id || null,
    platform,
    service,
    link || null,
    quantity,
    total,
    "Pending",
    name,
    email,
    message || null,
    screenshot || null,
  ])

  return result[0]
}

export async function getOrderById(orderId: string) {
  const query = `SELECT * FROM orders WHERE order_id = $1 LIMIT 1`
  const result = await sql(query, [orderId])
  return result.length > 0 ? result[0] : null
}

export async function getOrdersByUserId(userId: number) {
  const query = `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`
  return await sql(query, [userId])
}

export async function getOrdersByEmail(email: string) {
  const query = `SELECT * FROM orders WHERE email = $1 ORDER BY created_at DESC`
  return await sql(query, [email])
}

export async function getAllOrders() {
  const query = `SELECT * FROM orders ORDER BY created_at DESC`
  return await sql(query)
}

export async function updateOrderStatus(orderId: string, status: string) {
  const query = `
    UPDATE orders
    SET status = $1
    WHERE order_id = $2
    RETURNING *
  `
  const result = await sql(query, [status, orderId])
  return result.length > 0 ? result[0] : null
}

// Service functions
export async function getAllServices() {
  const query = `SELECT * FROM services WHERE active = true ORDER BY platform, name`
  return await sql(query)
}

export async function getServicesByPlatform(platform: string) {
  const query = `SELECT * FROM services WHERE platform = $1 AND active = true ORDER BY name`
  return await sql(query, [platform])
}

export async function createService(serviceData: { platform: string; name: string; price: number }) {
  const { platform, name, price } = serviceData
  const query = `
    INSERT INTO services (platform, name, price)
    VALUES ($1, $2, $3)
    ON CONFLICT (platform, name) DO UPDATE
    SET price = $3, active = true
    RETURNING *
  `
  const result = await sql(query, [platform, name, price])
  return result[0]
}

export async function updateService(
  id: number,
  serviceData: { platform?: string; name?: string; price?: number; active?: boolean },
) {
  const updates = []
  const values = []
  let paramIndex = 1

  if (serviceData.platform !== undefined) {
    updates.push(`platform = $${paramIndex}`)
    values.push(serviceData.platform)
    paramIndex++
  }

  if (serviceData.name !== undefined) {
    updates.push(`name = $${paramIndex}`)
    values.push(serviceData.name)
    paramIndex++
  }

  if (serviceData.price !== undefined) {
    updates.push(`price = $${paramIndex}`)
    values.push(serviceData.price)
    paramIndex++
  }

  if (serviceData.active !== undefined) {
    updates.push(`active = $${paramIndex}`)
    values.push(serviceData.active)
    paramIndex++
  }

  if (updates.length === 0) {
    return null
  }

  const query = `
    UPDATE services
    SET ${updates.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *
  `
  values.push(id)

  const result = await sql(query, values)
  return result.length > 0 ? result[0] : null
}

export async function deleteService(id: number) {
  const query = `
    UPDATE services
    SET active = false
    WHERE id = $1
    RETURNING *
  `
  const result = await sql(query, [id])
  return result.length > 0 ? result[0] : null
}

// Testimonial functions
export async function createTestimonial(testimonialData: {
  user_id?: number
  name: string
  title: string
  rating: number
  content: string
  avatar?: string
}) {
  const { user_id, name, title, rating, content, avatar } = testimonialData
  const query = `
    INSERT INTO testimonials (user_id, name, title, rating, content, avatar)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `
  const result = await sql(query, [user_id || null, name, title, rating, content, avatar || null])
  return result[0]
}

export async function getApprovedTestimonials() {
  const query = `SELECT * FROM testimonials WHERE approved = true ORDER BY created_at DESC`
  return await sql(query)
}

export async function getAllTestimonials() {
  const query = `SELECT * FROM testimonials ORDER BY created_at DESC`
  return await sql(query)
}

export async function updateTestimonialApproval(id: number, approved: boolean) {
  const query = `
    UPDATE testimonials
    SET approved = $1
    WHERE id = $2
    RETURNING *
  `
  const result = await sql(query, [approved, id])
  return result.length > 0 ? result[0] : null
}

// Settings functions
export async function getSetting(key: string) {
  const query = `SELECT value FROM settings WHERE key = $1 LIMIT 1`
  const result = await sql(query, [key])
  return result.length > 0 ? result[0].value : null
}

export async function updateSetting(key: string, value: string) {
  const query = `
    INSERT INTO settings (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE
    SET value = $2, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `
  const result = await sql(query, [key, value])
  return result[0]
}

export async function getAllSettings() {
  const query = `SELECT * FROM settings`
  return await sql(query)
}

// Admin functions
export async function createAdmin(username: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10)
  const query = `
    INSERT INTO admins (username, password_hash)
    VALUES ($1, $2)
    ON CONFLICT (username) DO UPDATE
    SET password_hash = $2
    RETURNING id, username, created_at
  `
  const result = await sql(query, [username, passwordHash])
  return result[0]
}

export async function verifyAdmin(username: string, password: string) {
  const query = `SELECT * FROM admins WHERE username = $1 LIMIT 1`
  const result = await sql(query, [username])

  if (result.length === 0) {
    return false
  }

  const admin = result[0]
  return await bcrypt.compare(password, admin.password_hash)
}

// Wallet functions
export async function createWalletIfNotExists(userId: number) {
  const checkQuery = `SELECT * FROM wallets WHERE user_id = $1 LIMIT 1`
  const existingWallet = await sql(checkQuery, [userId])

  if (existingWallet.length === 0) {
    const query = `
      INSERT INTO wallets (user_id, balance)
      VALUES ($1, $2)
      RETURNING *
    `
    const result = await sql(query, [userId, 0])
    return result[0]
  }

  return existingWallet[0]
}

export async function getWalletByUserId(userId: number) {
  const query = `SELECT * FROM wallets WHERE user_id = $1 LIMIT 1`
  const result = await sql(query, [userId])

  if (result.length === 0) {
    // Create wallet if it doesn't exist
    return await createWalletIfNotExists(userId)
  }

  return result[0]
}

export async function updateWalletBalance(userId: number, newBalance: number) {
  const query = `
    UPDATE wallets
    SET balance = $1, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $2
    RETURNING *
  `
  const result = await sql(query, [newBalance, userId])
  return result.length > 0 ? result[0] : null
}

// Deposit functions
export async function createDeposit(depositData: Omit<Deposit, "id" | "deposit_id" | "created_at" | "updated_at">) {
  const deposit_id = uuidv4()
  const { user_id, amount, amount_inr, payment_method, currency, status, screenshot } = depositData

  const query = `
    INSERT INTO deposits (
      deposit_id, user_id, amount, amount_inr, payment_method, 
      currency, status, screenshot
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `

  const result = await sql(query, [
    deposit_id,
    user_id,
    amount,
    amount_inr || null,
    payment_method,
    currency || null,
    status || "pending",
    screenshot,
  ])

  return result[0]
}

export async function getDepositById(depositId: string) {
  const query = `SELECT * FROM deposits WHERE deposit_id = $1 LIMIT 1`
  const result = await sql(query, [depositId])
  return result.length > 0 ? result[0] : null
}

export async function getDepositsByUserId(userId: number) {
  const query = `SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC`
  return await sql(query, [userId])
}

export async function getAllDeposits() {
  const query = `SELECT * FROM deposits ORDER BY created_at DESC`
  return await sql(query)
}

export async function getPendingDeposits() {
  const query = `
    SELECT d.*, u.name, u.email 
    FROM deposits d
    JOIN users u ON d.user_id = u.id
    WHERE d.status = 'pending'
    ORDER BY d.created_at DESC
  `
  return await sql(query)
}

export async function updateDepositStatus(depositId: string, status: "pending" | "completed" | "rejected") {
  const query = `
    UPDATE deposits
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE deposit_id = $2
    RETURNING *
  `
  const result = await sql(query, [status, depositId])
  return result.length > 0 ? result[0] : null
}

// Transaction functions
export async function createTransaction(transactionData: Omit<Transaction, "id" | "transaction_id" | "created_at">) {
  const transaction_id = uuidv4()
  const { user_id, type, amount, description, reference_id } = transactionData

  const query = `
    INSERT INTO transactions (
      transaction_id, user_id, type, amount, description, reference_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `

  const result = await sql(query, [transaction_id, user_id, type, amount, description, reference_id || null])

  return result[0]
}

export async function getTransactionsByUserId(userId: number) {
  const query = `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`
  return await sql(query, [userId])
}

export async function getAllTransactions() {
  const query = `SELECT * FROM transactions ORDER BY created_at DESC`
  return await sql(query)
}
