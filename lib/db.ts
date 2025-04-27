import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

// User functions
export async function getUserByEmail(email: string) {
  const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
  return result.length > 0 ? result[0] : null
}

export async function getUserByUid(uid: string) {
  const result = await sql`SELECT * FROM users WHERE uid = ${uid} LIMIT 1`
  return result.length > 0 ? result[0] : null
}

export async function createUser(userData: { uid: string; email: string; name: string; photo_url?: string }) {
  const { uid, email, name, photo_url } = userData
  const result = await sql`
    INSERT INTO users (uid, email, name, photo_url)
    VALUES (${uid}, ${email}, ${name}, ${photo_url || null})
    ON CONFLICT (uid) DO UPDATE
    SET email = ${email}, name = ${name}, photo_url = ${photo_url || null}
    RETURNING *
  `

  // Create wallet for new user
  const user = result[0]
  await createWalletForUser(user.id)

  return user
}

export async function getAllUsers() {
  return await sql`SELECT * FROM users ORDER BY created_at DESC`
}

// Wallet functions
export async function createWalletForUser(userId: number) {
  const result = await sql`
    INSERT INTO wallets (user_id, balance)
    VALUES (${userId}, 0)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *
  `
  return result.length > 0 ? result[0] : null
}

export async function getUserWallet(userId: number) {
  const result = await sql`SELECT * FROM wallets WHERE user_id = ${userId} LIMIT 1`
  return result.length > 0 ? result[0] : null
}

export async function updateWalletBalance(userId: number, newBalance: number) {
  const result = await sql`
    UPDATE wallets
    SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
    RETURNING *
  `
  return result.length > 0 ? result[0] : null
}

export async function addToWalletBalance(userId: number, amount: number) {
  const wallet = await getUserWallet(userId)
  if (!wallet) return null

  const newBalance = Number.parseFloat(wallet.balance) + amount
  return await updateWalletBalance(userId, newBalance)
}

export async function deductFromWalletBalance(userId: number, amount: number) {
  const wallet = await getUserWallet(userId)
  if (!wallet) return null

  const newBalance = Number.parseFloat(wallet.balance) - amount
  if (newBalance < 0) return null

  return await updateWalletBalance(userId, newBalance)
}

// Deposit functions
export async function createDeposit(depositData: {
  user_id: number
  amount_usd: number
  amount_inr?: number
  payment_method: string
  screenshot?: string
  transaction_id?: string
}) {
  const { user_id, amount_usd, amount_inr, payment_method, screenshot, transaction_id } = depositData
  const result = await sql`
    INSERT INTO deposits (
      user_id, amount_usd, amount_inr, payment_method, 
      screenshot, transaction_id, status
    )
    VALUES (${user_id}, ${amount_usd}, ${amount_inr || null}, ${payment_method}, 
            ${screenshot || null}, ${transaction_id || null}, 'Pending')
    RETURNING *
  `
  return result[0]
}

export async function getDepositById(depositId: number) {
  const result = await sql`SELECT * FROM deposits WHERE id = ${depositId} LIMIT 1`
  return result.length > 0 ? result[0] : null
}

export async function getUserDeposits(userId: number) {
  const result = await sql`
    SELECT d.*, u.name, u.email 
    FROM deposits d
    JOIN users u ON d.user_id = u.id
    WHERE d.user_id = ${userId} 
    ORDER BY d.created_at DESC
  `
  return result
}

export async function getAllDeposits(status?: string) {
  if (status) {
    return await sql`
      SELECT d.*, u.name, u.email 
      FROM deposits d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = ${status}
      ORDER BY d.created_at DESC
    `
  }

  return await sql`
    SELECT d.*, u.name, u.email 
    FROM deposits d
    JOIN users u ON d.user_id = u.id
    ORDER BY d.created_at DESC
  `
}

export async function updateDepositStatus(depositId: number, status: string, adminNotes?: string) {
  const result = await sql`
    UPDATE deposits
    SET status = ${status}, admin_notes = ${adminNotes || null}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${depositId}
    RETURNING *
  `
  return result.length > 0 ? result[0] : null
}

export async function approveDeposit(depositId: number, adminNotes?: string) {
  // Get the deposit
  const deposit = await getDepositById(depositId)
  if (!deposit) return null

  // Update deposit status
  const updatedDeposit = await updateDepositStatus(depositId, "Completed", adminNotes)
  if (!updatedDeposit) return null

  // Add amount to user's wallet
  const wallet = await addToWalletBalance(deposit.user_id, Number.parseFloat(deposit.amount_usd))
  if (!wallet) return null

  // Record transaction
  await recordTransaction({
    user_id: deposit.user_id,
    type: "deposit",
    amount: Number.parseFloat(deposit.amount_usd),
    description: `Deposit via ${deposit.payment_method}`,
    reference_id: depositId.toString(),
    balance_after: Number.parseFloat(wallet.balance),
  })

  return updatedDeposit
}

// Transaction functions
export async function recordTransaction(transactionData: {
  user_id: number
  type: string
  amount: number
  description: string
  reference_id: string
  balance_after: number
}) {
  const { user_id, type, amount, description, reference_id, balance_after } = transactionData
  const result = await sql`
    INSERT INTO transactions (
      user_id, type, amount, description, reference_id, balance_after
    )
    VALUES (${user_id}, ${type}, ${amount}, ${description}, ${reference_id}, ${balance_after})
    RETURNING *
  `
  return result[0]
}

export async function getUserTransactions(userId: number) {
  return await sql`
    SELECT * FROM transactions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
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
  wallet_payment?: boolean
}) {
  const order_id = uuidv4()
  const { user_id, platform, service, link, quantity, total, name, email, message, screenshot, wallet_payment } =
    orderData

  // Check if this is a wallet payment and if user has sufficient balance
  if (wallet_payment && user_id) {
    const wallet = await getUserWallet(user_id)
    if (!wallet || Number.parseFloat(wallet.balance) < total) {
      return { error: "Insufficient balance" }
    }

    // Deduct from wallet
    const updatedWallet = await deductFromWalletBalance(user_id, total)
    if (!updatedWallet) {
      return { error: "Failed to process payment" }
    }

    // Record transaction
    await recordTransaction({
      user_id,
      type: "purchase",
      amount: total,
      description: `Purchase of ${service} on ${platform}`,
      reference_id: order_id,
      balance_after: Number.parseFloat(updatedWallet.balance),
    })
  }

  const result = await sql`
    INSERT INTO orders (
      order_id, user_id, platform, service, link, quantity, 
      total, status, name, email, message, screenshot, wallet_payment
    )
    VALUES (${order_id}, ${user_id || null}, ${platform}, ${service}, ${link || null}, ${quantity}, 
            ${total}, 'Pending', ${name}, ${email}, ${message || null}, ${screenshot || null}, ${wallet_payment || false})
    RETURNING *
  `

  return result[0]
}

export async function getOrderById(orderId: string) {
  const result = await sql`SELECT * FROM orders WHERE order_id = ${orderId} LIMIT 1`
  return result.length > 0 ? result[0] : null
}

export async function getOrdersByUserId(userId: number) {
  return await sql`SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC`
}

export async function getOrdersByEmail(email: string) {
  return await sql`SELECT * FROM orders WHERE email = ${email} ORDER BY created_at DESC`
}

export async function getAllOrders() {
  return await sql`SELECT * FROM orders ORDER BY created_at DESC`
}

export async function updateOrderStatus(orderId: string, status: string) {
  const result = await sql`
    UPDATE orders
    SET status = ${status}
    WHERE order_id = ${orderId}
    RETURNING *
  `
  return result.length > 0 ? result[0] : null
}

// Service functions
export async function getAllServices() {
  return await sql`SELECT * FROM services WHERE active = true ORDER BY platform, name`
}

export async function getServicesByPlatform(platform: string) {
  return await sql`SELECT * FROM services WHERE platform = ${platform} AND active = true ORDER BY name`
}

export async function createService(serviceData: { platform: string; name: string; price: number }) {
  const { platform, name, price } = serviceData
  const result = await sql`
    INSERT INTO services (platform, name, price)
    VALUES (${platform}, ${name}, ${price})
    ON CONFLICT (platform, name) DO UPDATE
    SET price = ${price}, active = true
    RETURNING *
  `
  return result[0]
}

export async function updateService(
  id: number,
  serviceData: { platform?: string; name?: string; price?: number; active?: boolean },
) {
  // This is a bit more complex with the new syntax
  // We need to build the query dynamically
  let updateQuery = "UPDATE services SET "
  const updateValues = []
  const updateParts = []

  if (serviceData.platform !== undefined) {
    updateParts.push("platform = $1")
    updateValues.push(serviceData.platform)
  }

  if (serviceData.name !== undefined) {
    updateParts.push(`name = $${updateValues.length + 1}`)
    updateValues.push(serviceData.name)
  }

  if (serviceData.price !== undefined) {
    updateParts.push(`price = $${updateValues.length + 1}`)
    updateValues.push(serviceData.price)
  }

  if (serviceData.active !== undefined) {
    updateParts.push(`active = $${updateValues.length + 1}`)
    updateValues.push(serviceData.active)
  }

  if (updateParts.length === 0) {
    return null
  }

  updateQuery += updateParts.join(", ")
  updateQuery += ` WHERE id = $${updateValues.length + 1} RETURNING *`
  updateValues.push(id)

  const result = await sql.query(updateQuery, updateValues)
  return result.rows.length > 0 ? result.rows[0] : null
}

export async function deleteService(id: number) {
  const result = await sql`
    UPDATE services
    SET active = false
    WHERE id = ${id}
    RETURNING *
  `
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
  const result = await sql`
    INSERT INTO testimonials (user_id, name, title, rating, content, avatar)
    VALUES (${user_id || null}, ${name}, ${title}, ${rating}, ${content}, ${avatar || null})
    RETURNING *
  `
  return result[0]
}

export async function getApprovedTestimonials() {
  return await sql`SELECT * FROM testimonials WHERE approved = true ORDER BY created_at DESC`
}

export async function getAllTestimonials() {
  return await sql`SELECT * FROM testimonials ORDER BY created_at DESC`
}

export async function updateTestimonialApproval(id: number, approved: boolean) {
  const result = await sql`
    UPDATE testimonials
    SET approved = ${approved}
    WHERE id = ${id}
    RETURNING *
  `
  return result.length > 0 ? result[0] : null
}

// Settings functions
export async function getSetting(key: string) {
  const result = await sql`SELECT value FROM settings WHERE key = ${key} LIMIT 1`
  return result.length > 0 ? result[0].value : null
}

export async function updateSetting(key: string, value: string) {
  const result = await sql`
    INSERT INTO settings (key, value)
    VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE
    SET value = ${value}, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `
  return result[0]
}

export async function getAllSettings() {
  return await sql`SELECT * FROM settings`
}

// Admin functions
export async function createAdmin(username: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10)
  const result = await sql`
    INSERT INTO admins (username, password_hash)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (username) DO UPDATE
    SET password_hash = ${passwordHash}
    RETURNING id, username, created_at
  `
  return result[0]
}

export async function verifyAdmin(username: string, password: string) {
  const result = await sql`SELECT * FROM admins WHERE username = ${username} LIMIT 1`

  if (result.length === 0) {
    return false
  }

  const admin = result[0]
  return await bcrypt.compare(password, admin.password_hash)
}
