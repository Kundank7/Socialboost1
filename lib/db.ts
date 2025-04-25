import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import type { Deposit, Transaction } from "./types";

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// User functions
export async function getUserByEmail(email: string) {
  const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return result.length > 0 ? result[0] : null;
}

export async function getUserByUid(uid: string) {
  const result = await sql`SELECT * FROM users WHERE uid = ${uid} LIMIT 1`;
  return result.length > 0 ? result[0] : null;
}

export async function createUser(userData: {
  uid: string;
  email: string;
  name: string;
  photo_url?: string;
}) {
  const { uid, email, name, photo_url } = userData;
  const result = await sql`
    INSERT INTO users (uid, email, name, photo_url)
    VALUES (${uid}, ${email}, ${name}, ${photo_url || null})
    ON CONFLICT (uid) DO UPDATE
    SET email = ${email}, name = ${name}, photo_url = ${photo_url || null}
    RETURNING *`;
  const user = result[0];
  await createWalletIfNotExists(user.id);
  return user;
}

export async function getAllUsers() {
  return await sql`SELECT * FROM users ORDER BY created_at DESC`;
}

// Order functions
export async function createOrder(orderData: {
  user_id?: number;
  platform: string;
  service: string;
  link?: string;
  quantity: number;
  total: number;
  name: string;
  email: string;
  message?: string;
  screenshot?: string;
}) {
  const order_id = uuidv4();
  const {
    user_id,
    platform,
    service,
    link,
    quantity,
    total,
    name,
    email,
    message,
    screenshot,
  } = orderData;
  const result = await sql`
    INSERT INTO orders (
      order_id, user_id, platform, service, link, quantity,
      total, status, name, email, message, screenshot
    )
    VALUES (
      ${order_id}, ${user_id || null}, ${platform}, ${service}, ${link || null},
      ${quantity}, ${total}, 'Pending', ${name}, ${email}, ${message || null},
      ${screenshot || null}
    )
    RETURNING *`;
  return result[0];
}

export async function getOrderById(orderId: string) {
  const result = await sql`SELECT * FROM orders WHERE order_id = ${orderId} LIMIT 1`;
  return result.length > 0 ? result[0] : null;
}

export async function getOrdersByUserId(userId: number) {
  return await sql`SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC`;
}

export async function getOrdersByEmail(email: string) {
  return await sql`SELECT * FROM orders WHERE email = ${email} ORDER BY created_at DESC`;
}

export async function getAllOrders() {
  return await sql`SELECT * FROM orders ORDER BY created_at DESC`;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const result = await sql`
    UPDATE orders
    SET status = ${status}
    WHERE order_id = ${orderId}
    RETURNING *`;
  return result.length > 0 ? result[0] : null;
}

// Service functions
export async function getAllServices() {
  return await sql`SELECT * FROM services WHERE active = true ORDER BY platform, name`;
}

export async function getServicesByPlatform(platform: string) {
  return await sql`SELECT * FROM services WHERE platform = ${platform} AND active = true ORDER BY name`;
}

export async function createService(serviceData: {
  platform: string;
  name: string;
  price: number;
}) {
  const { platform, name, price } = serviceData;
  const result = await sql`
    INSERT INTO services (platform, name, price)
    VALUES (${platform}, ${name}, ${price})
    ON CONFLICT (platform, name) DO UPDATE
    SET price = ${price}, active = true
    RETURNING *`;
  return result[0];
}

export async function updateService(
  id: number,
  serviceData: {
    platform?: string;
    name?: string;
    price?: number;
    active?: boolean;
  }
) {
  const updates = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (serviceData.platform !== undefined) {
    updates.push(`platform = $${paramIndex}`);
    values.push(serviceData.platform);
    paramIndex++;
  }
  if (serviceData.name !== undefined) {
    updates.push(`name = $${paramIndex}`);
    values.push(serviceData.name);
    paramIndex++;
  }
  if (serviceData.price !== undefined) {
    updates.push(`price = $${paramIndex}`);
    values.push(serviceData.price);
    paramIndex++;
  }
  if (serviceData.active !== undefined) {
    updates.push(`active = $${paramIndex}`);
    values.push(serviceData.active);
    paramIndex++;
  }
  if (updates.length === 0) {
    return null;
  }
  const query = `UPDATE services SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
  values.push(id);
  const result = await sql.query(query, values);
  return result.length > 0 ? result[0] : null;
}

export async function deleteService(id: number) {
  const result = await sql`
    UPDATE services
    SET active = false
    WHERE id = ${id}
    RETURNING *`;
  return result.length > 0 ? result[0] : null;
}

// Wallet functions
export async function createWalletIfNotExists(userId: number) {
  const existing = await sql`SELECT * FROM wallets WHERE user_id = ${userId} LIMIT 1`;
  if (existing.length === 0) {
    await sql`INSERT INTO wallets (user_id, balance) VALUES (${userId}, 0)`;
  }
}

export async function getWalletByUserId(userId: number) {
  const result = await sql`SELECT * FROM wallets WHERE user_id = ${userId} LIMIT 1`;
  return result.length > 0 ? result[0] : null;
}

export async function updateWalletBalance(userId: number, amount: number) {
  const result = await sql`
    UPDATE wallets
    SET balance = balance + ${amount}
    WHERE user_id = ${userId}
    RETURNING *`;
  return result.length > 0 ? result[0] : null;
}

//
::contentReference[oaicite:0]{index=0}
 // Deposit functions
export async function createDeposit(deposit: Deposit) {
  const result = await sql`
    INSERT INTO deposits (user_id, amount, method, status, deposit_id)
    VALUES (${deposit.user_id}, ${deposit.amount}, ${deposit.method}, ${deposit.status}, ${deposit.deposit_id})
    RETURNING *`;
  return result[0];
}

export async function getDepositById(depositId: string) {
  const result = await sql`SELECT * FROM deposits WHERE deposit_id = ${depositId} LIMIT 1`;
  return result.length > 0 ? result[0] : null;
}

export async function updateDepositStatus(depositId: string, status: string) {
  const result = await sql`
    UPDATE deposits
    SET status = ${status}
    WHERE deposit_id = ${depositId}
    RETURNING *`;
  return result.length > 0 ? result[0] : null;
}

export async function getAllDeposits() {
  return await sql`SELECT * FROM deposits ORDER BY created_at DESC`;
}

// Transaction functions
export async function logTransaction(transaction: Transaction) {
  const result = await sql`
    INSERT INTO transactions (user_id, amount, type, description)
    VALUES (${transaction.user_id}, ${transaction.amount}, ${transaction.type}, ${transaction.description})
    RETURNING *`;
  return result[0];
}

export async function getTransactionsByUserId(userId: number) {
  return await sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC`;
}

// Admin functions
export async function getStats() {
  const [users, orders, deposits] = await Promise.all([
    sql`SELECT COUNT(*) FROM users`,
    sql`SELECT COUNT(*) FROM orders`,
    sql`SELECT COUNT(*) FROM deposits`,
  ]);
  return {
    users: Number(users[0].count),
    orders: Number(orders[0].count),
    deposits: Number(deposits[0].count),
  };
}

