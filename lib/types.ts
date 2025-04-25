export interface User {
  id: number
  uid: string
  email: string
  name: string
  photo_url?: string
  created_at: string
}

export interface Order {
  id: number
  order_id: string
  user_id?: number
  platform: string
  service: string
  link?: string
  quantity: number
  total: number
  status: string
  name: string
  email: string
  message?: string
  screenshot?: string
  created_at: string
}

export interface Testimonial {
  id: string | number
  user_id?: number
  name: string
  title: string
  rating: number
  content: string
  approved: boolean
  avatar?: string | null
  created_at: string
}

export interface Service {
  id: string | number
  platform: string
  name: string
  price: number
  active?: boolean
  created_at?: string
}

export interface Admin {
  id: number
  username: string
  password_hash: string
  created_at: string
}

export interface Setting {
  id: number
  key: string
  value: string
  updated_at: string
}

export interface Wallet {
  id: number
  user_id: number
  balance: number
  created_at: string
  updated_at: string
}

export interface Deposit {
  id: number
  deposit_id: string
  user_id: number
  amount: number
  amount_inr?: number
  payment_method: "qr" | "crypto"
  currency?: string
  status: "pending" | "completed" | "rejected"
  screenshot: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  transaction_id: string
  user_id: number
  type: "deposit" | "purchase" | "refund"
  amount: number
  description: string
  reference_id?: string
  created_at: string
}
