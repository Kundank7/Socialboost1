import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// User functions
export async function getUserByEmail(email: string) {
  const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return result.length > 0 ? result[0] : null;
}

export async function getUserByUid(uid: string) {
  const result = await sql`SELECT * FROM users WHERE uid = ${uid} LIMIT 1`;
  return result.length > 0 ? result[0] : null;
}

export async function createUser(user: {
  uid: string;
  email: string;
  name: string;
  photo_url?: string;
}) {
  const result = await sql`
    INSERT INTO users (uid, email, name, photo_url)
    VALUES (${user.uid}, ${user.email}, ${user.name}, ${user.photo_url})
    ON CONFLICT (email) DO NOTHING
    RETURNING *`;
  return result.length > 0 ? result[0] : null;
}

// Deposit functions
export async function createDeposit(deposit: {
  user_id: number;
  amount: number;
  method: string;
  status: string;
  deposit_id: string;
}) {
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
export async function logTransaction(transaction: {
  user_id: number;
  amount: number;
  type: string;
  description: string;
}) {
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
