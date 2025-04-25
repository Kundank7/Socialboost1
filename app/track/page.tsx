"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, AlertCircle, Loader2, CheckCircle, Clock, RefreshCw, Package, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getOrderById, getOrdersByEmail, getUserOrders } from "@/lib/actions"
import type { Order } from "@/lib/types"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const initialOrderId = searchParams.get("orderId") || ""

  const [activeTab, setActiveTab] = useState<"search" | "my-orders">("search")
  const [orderId, setOrderId] = useState(initialOrderId)
  const [email, setEmail] = useState("")
  const [searchBy, setSearchBy] = useState<"orderId" | "email">(initialOrderId ? "orderId" : "email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [userOrders, setUserOrders] = useState<Order[]>([])

  // Status colors and icons
  const statusConfig = {
    Pending: { color: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-500", icon: Clock },
    "In Review": { color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-500", icon: RefreshCw },
    Processing: { color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-500", icon: Package },
    Completed: { color: "text-green-500 bg-green-100 dark:bg-green-900/30 dark:text-green-500", icon: CheckCircle },
  }

  // Check if we have an initial orderId from URL params
  useEffect(() => {
    if (initialOrderId) {
      handleSearch()
    }

    // If user is logged in, fetch their orders
    if (session?.user) {
      fetchUserOrders()
      setActiveTab("my-orders")
    }
  }, [initialOrderId, session])

  // Fetch user orders
  const fetchUserOrders = async () => {
    if (session?.user?.id) {
      setIsLoading(true)
      try {
        const result = await getUserOrders(session.user.id)
        if (result.success && result.orders) {
          setUserOrders(result.orders)
        }
      } catch (err) {
        console.error("Error fetching user orders:", err)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)
    setOrder(null)

    try {
      let result

      if (searchBy === "orderId") {
        if (!orderId) {
          setError("Please enter an order ID")
          setIsLoading(false)
          return
        }
        result = await getOrderById(orderId)
      } else {
        if (!email) {
          setError("Please enter your email address")
          setIsLoading(false)
          return
        }
        result = await getOrdersByEmail(email)
      }

      if (result.success && result.order) {
        setOrder(result.order)
      } else {
        setError(result.error || "Order not found. Please check your information and try again.")
      }
    } catch (err) {
      setError("An error occurred while searching for your order. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Track Your Order</h1>
        <p className="text-xl mb-8 text-muted-foreground text-center">
          Check the status of your order and view order details.
        </p>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "search" | "my-orders")}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="search">Search Order</TabsTrigger>
            <TabsTrigger value="my-orders" disabled={!session}>
              My Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <Card className="glass-card mb-8">
              <CardHeader>
                <CardTitle>Order Lookup</CardTitle>
                <CardDescription>Find your order by ID or email address</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      variant={searchBy === "orderId" ? "default" : "outline"}
                      onClick={() => setSearchBy("orderId")}
                      className="w-full"
                    >
                      Search by Order ID
                    </Button>
                    <Button
                      variant={searchBy === "email" ? "default" : "outline"}
                      onClick={() => setSearchBy("email")}
                      className="w-full"
                    >
                      Search by Email
                    </Button>
                  </div>

                  {searchBy === "orderId" ? (
                    <div className="space-y-2">
                      <Label htmlFor="orderId">Order ID</Label>
                      <Input
                        id="orderId"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="Enter your order ID"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                      />
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSearch} className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Track Order
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {order && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                    <CardDescription>Order ID: {order.order_id}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Order Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <div
                        className={`px-3 py-1 rounded-full flex items-center ${
                          statusConfig[order.status as keyof typeof statusConfig]?.color || "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {(() => {
                          const StatusIcon =
                            statusConfig[order.status as keyof typeof statusConfig]?.icon || AlertCircle
                          return <StatusIcon className="h-4 w-4 mr-2" />
                        })()}
                        <span className="font-medium">{order.status}</span>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="space-y-2">
                      <h3 className="font-medium">Order Timeline</h3>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div
                            className={`mt-1 w-4 h-4 rounded-full ${
                              order.status === "Pending" ||
                              order.status === "In Review" ||
                              order.status === "Processing" ||
                              order.status === "Completed"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            } mr-3`}
                          ></div>
                          <div>
                            <p className="font-medium">Order Received</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div
                            className={`mt-1 w-4 h-4 rounded-full ${
                              order.status === "In Review" ||
                              order.status === "Processing" ||
                              order.status === "Completed"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            } mr-3`}
                          ></div>
                          <div>
                            <p className="font-medium">In Review</p>
                            <p className="text-sm text-muted-foreground">Payment verification in progress</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div
                            className={`mt-1 w-4 h-4 rounded-full ${
                              order.status === "Processing" || order.status === "Completed"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            } mr-3`}
                          ></div>
                          <div>
                            <p className="font-medium">Processing</p>
                            <p className="text-sm text-muted-foreground">Your order is being processed</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div
                            className={`mt-1 w-4 h-4 rounded-full ${
                              order.status === "Completed" ? "bg-green-500" : "bg-gray-300"
                            } mr-3`}
                          ></div>
                          <div>
                            <p className="font-medium">Completed</p>
                            <p className="text-sm text-muted-foreground">Your order has been delivered</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3">Order Information</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Platform:</span>
                        <span>{order.platform}</span>
                        <span className="text-muted-foreground">Service:</span>
                        <span>{order.service}</span>
                        {order.link && (
                          <>
                            <span className="text-muted-foreground">Link:</span>
                            <a
                              href={order.link.startsWith("http") ? order.link : `https://${order.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center hover:underline text-primary"
                            >
                              <span className="truncate max-w-[200px]">{order.link}</span>
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </>
                        )}
                        <span className="text-muted-foreground">Quantity:</span>
                        <span>{order.quantity.toLocaleString()}</span>
                        <span className="text-muted-foreground">Total:</span>
                        <span>${order.total.toFixed(2)}</span>
                        <span className="text-muted-foreground">Date:</span>
                        <span>
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button asChild variant="outline">
                      <Link href="/">Return to Home</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="my-orders">
            {!session ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">You need to be signed in</p>
                  <p className="text-muted-foreground mb-6">Please sign in to view your orders</p>
                  <Button asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No orders found</p>
                  <p className="text-muted-foreground mb-6">You haven't placed any orders yet</p>
                  <Button asChild>
                    <Link href="/select">Browse Services</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>My Orders</CardTitle>
                  <CardDescription>View all your orders and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <Link href={`/track?orderId=${order.order_id}`} className="hover:underline">
                              {order.order_id.substring(0, 8)}...
                            </Link>
                          </TableCell>
                          <TableCell>
                            {order.platform} - {order.service}
                          </TableCell>
                          <TableCell>
                            {order.link ? (
                              <a
                                href={order.link.startsWith("http") ? order.link : `https://${order.link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center hover:underline text-primary"
                              >
                                <span className="truncate max-w-[100px]">{order.link.replace(/^https?:\/\//, "")}</span>
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>{order.quantity.toLocaleString()}</TableCell>
                          <TableCell>${order.total.toFixed(2)}</TableCell>
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
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
