"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Wallet } from "lucide-react"
import { getWalletBalance } from "@/lib/actions"

export default function WalletBalance() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      if (session?.user?.id) {
        try {
          const result = await getWalletBalance(Number(session.user.id))
          if (result.success) {
            setBalance(result.balance)
          }
        } catch (error) {
          console.error("Failed to fetch wallet balance:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchBalance()
    }
  }, [session])

  if (!session || isLoading || balance === null) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium">
      <Wallet className="h-4 w-4" />
      <span>${balance.toFixed(2)}</span>
    </div>
  )
}
