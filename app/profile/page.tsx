"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  LogOut,
  Package,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from "lucide-react"
import { getUserOrders, getUserWallet, getUserTransactions, getUserDeposits } from "@/lib/actions"
import type { Order, Transaction, Deposit } from "@/lib/types"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [walletBalance, setWalletBalance] = useState<string>("0.00")
  const [isLoading, setIsLoading] = useState(true)

  // Status colors and icons
  const statusConfig = {
    Pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500", icon: Clock },
    "In Review": { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500", icon: RefreshCw },
    Processing: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500", icon: Package },
    Completed: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500", icon: CheckCircle },
    Rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500", icon: AlertCircle },
  }

  // Transaction type icons
  const transactionIcons = {
    deposit: { icon: ArrowDownRight, color: "text-green-500" },
    purchase: { icon: ArrowUpRight, color: "text-red-500" },
    refund: { icon: ArrowDownRight, color: "text-blue-500" },
  }

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        setIsLoading(true)
        const userId = Number.parseInt(session.user.id as string)

        try {
          // Fetch wallet balance
          const walletResult = await getUserWallet(userId)
          if (walletResult.success) {
            setWalletBalance(walletResult.wallet.balance)
          }

          // Fetch data based on active tab
          if (activeTab === "orders" || activeTab === "all") {
            const ordersResult = await getUserOrders(userId)
            if (ordersResult.success) {
              setOrders(ordersResult.orders || [])
            }
          }

          if (activeTab === "transactions" || activeTab === "all") {
            const transactionsResult = await getUserTransactions(userId)
            if (transactionsResult.success) {
              setTransactions(transactionsResult.transactions || [])
            }
          }

          if (activeTab === "deposits" || activeTab === "all") {
            const depositsResult = await getUserDeposits(userId)
            if (depositsResult.success) {
              setDeposits(depositsResult.deposits || [])
            }
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (session?.user) {
      fetchUserData()
    }
  }, [session, activeTab])

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  if (status === "loading") {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign in
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* User Profile Card */}
            <Card className="glass-card md:w-1/3">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative w-24 h-24">
                    <Image
                      src={session.user.image || "/placeholder.svg?height=96&width=96"}
                      alt={session.user.name || "User"}
                      fill
                      className="rounded-full object-cover border-4 border-background"
                    />
                  </div>
                </div>
                <CardTitle>{session.user.name}</CardTitle>
                <CardDescription>{session.user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since</span>
                    <span>
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total orders</span>
                    <span>{orders.length}</span>
                  </div>

                  {/* Wallet Balance */}
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Wallet className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">Wallet Balance</span>
                      </div>
                      <span className="text-xl font-bold">${Number.parseFloat(walletBalance).toFixed(2)}</span>
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/deposit">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Funds
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSignOut} variant="outline" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardFooter>
            </Card>

            {/* Tabs */}
            <Card className="glass-card md:w-2/3">
              <CardHeader>
                <Tabs defaultValue="orders" value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="orders" className="flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Orders
                    </TabsTrigger>
                    <TabsTrigger value="deposits" className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Deposits
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Transactions
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <CardTitle>Your {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardTitle>
                <CardDescription>View and track your {activeTab} history</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <TabsContent value="orders" className="mt-0">
                    {orders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
                        <Button asChild>
                          <Link href="/select">Browse Services</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Service</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">
                                  <Link href={`/track?orderId=${order.order_id}`} className="hover:underline">
                                    {order.order_id.substring(0, 8)}...
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  {order.platform} - {order.service}
                                </TableCell>
                                <TableCell>{order.quantity.toLocaleString()}</TableCell>
                                <TableCell>${Number.parseFloat(order.total.toString()).toFixed(2)}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={statusConfig[order.status as keyof typeof statusConfig]?.color}
                                  >
                                    {(() => {
                                      const StatusIcon =
                                        statusConfig[order.status as keyof typeof statusConfig]?.icon || AlertCircle
                                      return (
                                        <div className="flex items-center">
                                          <StatusIcon className="h-3 w-3 mr-1" />
                                          {order.status}
                                        </div>
                                      )
                                    })()}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(order.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                )}

                <TabsContent value="deposits" className="mt-0">
                  {deposits.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground mb-4">You haven't made any deposits yet</p>
                      <Button asChild>
                        <Link href="/deposit">Add Funds</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deposits.map((deposit) => (
                            <TableRow key={deposit.id}>
                              <TableCell className="font-medium">#{deposit.id}</TableCell>
                              <TableCell>${Number.parseFloat(deposit.amount_usd.toString()).toFixed(2)}</TableCell>
                              <TableCell>{deposit.payment_method}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={statusConfig[deposit.status as keyof typeof statusConfig]?.color}
                                >
                                  {(() => {
                                    const StatusIcon =
                                      statusConfig[deposit.status as keyof typeof statusConfig]?.icon || AlertCircle
                                    return (
                                      <div className="flex items-center">
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {deposit.status}
                                      </div>
                                    )
                                  })()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(deposit.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="transactions" className="mt-0">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <ArrowUpRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground mb-4">No transactions yet</p>
                      <Button asChild>
                        <Link href="/deposit">Add Funds</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  {(() => {
                                    const { icon: Icon, color } = transactionIcons[
                                      transaction.type as keyof typeof transactionIcons
                                    ] || { icon: ArrowUpRight, color: "text-gray-500" }
                                    return <Icon className={`h-4 w-4 mr-2 ${color}`} />
                                  })()}
                                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                </div>
                              </TableCell>
                              <TableCell
                                className={
                                  transaction.type === "deposit"
                                    ? "text-green-600"
                                    : transaction.type === "purchase"
                                      ? "text-red-600"
                                      : ""
                                }
                              >
                                {transaction.type === "deposit" ? "+" : "-"}$
                                {Number.parseFloat(transaction.amount.toString()).toFixed(2)}
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                ${Number.parseFloat(transaction.balance_after.toString()).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {new Date(transaction.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
