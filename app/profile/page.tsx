"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Package, Wallet, Clock, CheckCircle, XCircle, ArrowDown, ArrowUp } from "lucide-react"
import { getUserOrders, getWalletBalance, getUserDeposits, getUserTransactions } from "@/lib/actions"
import type { Order, Deposit, Transaction } from "@/lib/types"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [orders, setOrders] = useState<Order[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/profile")
    }
  }, [status, router])

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        setIsLoading(true)
        try {
          // Fetch orders
          const ordersResult = await getUserOrders(session.user.email || "")
          if (ordersResult.success && ordersResult.orders) {
            setOrders(ordersResult.orders)
          }

          // Fetch wallet balance
          const balanceResult = await getWalletBalance(Number(session.user.id))
          if (balanceResult.success) {
            setWalletBalance(balanceResult.balance || 0)
          }

          // Fetch deposits
          const depositsResult = await getUserDeposits(Number(session.user.id))
          if (depositsResult.success) {
            setDeposits(depositsResult.deposits || [])
          }

          // Fetch transactions
          const transactionsResult = await getUserTransactions(Number(session.user.id))
          if (transactionsResult.success) {
            setTransactions(transactionsResult.transactions || [])
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
  }, [session])

  if (status === "loading" || (status === "authenticated" && isLoading)) {
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
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <Avatar className="w-24 h-24">
              <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
              <AvatarFallback className="text-2xl">
                {session.user?.name
                  ? session.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{session.user?.name}</h1>
              <p className="text-muted-foreground">{session.user?.email}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="font-medium">${walletBalance.toFixed(2)}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/wallet")}>
                  Manage Wallet
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Your most recent service orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground mb-4">No orders found</p>
                        <Button onClick={() => router.push("/select")}>Browse Services</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">
                                {order.platform} - {order.service}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">${order.total.toFixed(2)}</span>
                              <Badge
                                variant="outline"
                                className={
                                  order.status === "Completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                    : order.status === "Pending"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
                                }
                              >
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab("orders")}>
                      View All Orders
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Wallet Activity</CardTitle>
                    <CardDescription>Your recent wallet transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-6 p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-2xl font-bold">${walletBalance.toFixed(2)}</p>
                      </div>
                      <Button onClick={() => router.push("/wallet")}>Add Funds</Button>
                    </div>

                    {transactions.length === 0 && deposits.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No recent wallet activity</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Show a mix of recent transactions and deposits */}
                        {[
                          ...transactions,
                          ...deposits.map((d) => ({
                            transaction_id: d.deposit_id,
                            user_id: d.user_id,
                            type: "deposit" as const,
                            amount: d.amount,
                            description: `Deposit via ${d.payment_method === "qr" ? "QR/UPI" : "Cryptocurrency"}`,
                            reference_id: d.deposit_id,
                            created_at: d.created_at,
                            status: d.status,
                          })),
                        ]
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 3)
                          .map((item) => (
                            <div
                              key={item.transaction_id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    item.type === "deposit"
                                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
                                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500"
                                  }`}
                                >
                                  {item.type === "deposit" ? (
                                    <ArrowDown className="h-4 w-4" />
                                  ) : (
                                    <ArrowUp className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium">{item.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(item.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`font-medium ${
                                  item.type === "deposit"
                                    ? "text-green-600 dark:text-green-500"
                                    : "text-blue-600 dark:text-blue-500"
                                }`}
                              >
                                {item.type === "deposit" ? "+" : ""}${item.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab("wallet")}>
                      View Wallet Details
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>All your service orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground mb-4">No orders found</p>
                      <Button onClick={() => router.push("/select")}>Browse Services</Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                              <TableCell>
                                {order.platform} - {order.service}
                              </TableCell>
                              <TableCell>{order.quantity.toLocaleString()}</TableCell>
                              <TableCell>
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </TableCell>
                              <TableCell>${order.total.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    order.status === "Completed"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                      : order.status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
                                  }
                                >
                                  {order.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={() => router.push("/track")} className="ml-auto">
                    Track Orders
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="wallet">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Wallet Overview</CardTitle>
                    <CardDescription>Your wallet balance and recent activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                      <div className="flex-1 p-6 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Current Balance</h3>
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-3xl font-bold">${walletBalance.toFixed(2)}</p>
                        <Button onClick={() => router.push("/wallet")} className="mt-4">
                          Add Funds
                        </Button>
                      </div>
                      <div className="flex-1 p-6 border rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => router.push("/wallet")}
                          >
                            <ArrowDown className="mr-2 h-4 w-4" />
                            Deposit Funds
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => router.push("/select")}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Purchase Services
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <h3 className="text-lg font-medium mb-4">Recent Deposits</h3>
                    {deposits.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No deposits found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deposits.slice(0, 5).map((deposit) => (
                              <TableRow key={deposit.deposit_id}>
                                <TableCell>
                                  {new Date(deposit.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </TableCell>
                                <TableCell>${deposit.amount.toFixed(2)}</TableCell>
                                <TableCell>{deposit.payment_method === "qr" ? "QR/UPI" : "Cryptocurrency"}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      deposit.status === "completed"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                        : deposit.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500"
                                    }
                                  >
                                    <div className="flex items-center">
                                      {deposit.status === "completed" ? (
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                      ) : deposit.status === "pending" ? (
                                        <Clock className="h-3 w-3 mr-1" />
                                      ) : (
                                        <XCircle className="h-3 w-3 mr-1" />
                                      )}
                                      {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                                    </div>
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <Separator className="my-6" />

                    <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
                    {transactions.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No transactions found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.slice(0, 5).map((transaction) => (
                              <TableRow key={transaction.transaction_id}>
                                <TableCell>
                                  {new Date(transaction.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      transaction.type === "deposit"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
                                    }
                                  >
                                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={
                                    transaction.amount > 0
                                      ? "text-green-600 dark:text-green-500"
                                      : "text-blue-600 dark:text-blue-500"
                                  }
                                >
                                  {transaction.amount > 0 ? "+" : ""}${transaction.amount.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => router.push("/wallet")} className="ml-auto">
                      Manage Wallet
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  )
}
