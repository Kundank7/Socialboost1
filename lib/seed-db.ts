"use server"

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

export async function seedDatabase() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Seed services
    await sql`
      INSERT INTO services (platform, name, price, active)
      VALUES 
        ('instagram', 'Followers', 0.5, true),
        ('instagram', 'Likes', 0.4, true),
        ('instagram', 'Views', 0.3, true),
        ('instagram', 'Comments', 0.8, true),
        ('facebook', 'Page Likes', 0.5, true),
        ('facebook', 'Followers', 0.5, true),
        ('facebook', 'Post Likes', 0.4, true),
        ('facebook', 'Post Shares', 0.6, true),
        ('youtube', 'Subscribers', 0.7, true),
        ('youtube', 'Views', 0.3, true),
        ('youtube', 'Likes', 0.4, true),
        ('youtube', 'Comments', 0.8, true),
        ('telegram', 'Channel Members', 0.6, true),
        ('telegram', 'Post Views', 0.3, true),
        ('telegram', 'Reactions', 0.4, true)
      ON CONFLICT (platform, name) DO UPDATE
      SET price = EXCLUDED.price, active = EXCLUDED.active
    `

    // Seed admin user
    const passwordHash = await bcrypt.hash("admin123", 10)
    await sql`
      INSERT INTO admins (username, password_hash)
      VALUES ('admin', ${passwordHash})
      ON CONFLICT (username) DO UPDATE
      SET password_hash = ${passwordHash}
    `

    // Seed settings
    await sql`
      INSERT INTO settings (key, value)
      VALUES 
        ('site_name', 'SocialBoost'),
        ('contact_email', 'support@socialboost.com'),
        ('contact_phone', '+1 (555) 123-4567'),
        ('contact_whatsapp', '+1 (555) 123-4567'),
        ('upi_id', 'socialboost@upi'),
        ('crypto_address', '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t')
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value
    `

    return { success: true, message: "Database seeded successfully" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, error: "Failed to seed database" }
  }
}
