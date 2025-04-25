"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Package,
  MessageSquare,
  Settings,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  LogOut,
  Search,
  RefreshCw,
  Clock,
  AlertCircle,
  Loader2,
  Wallet,
  Star,
  Edit,
  Trash,
} from "lucide-react"
import type { Order, Testimonial, Service, Deposit } from "@/lib/types"
import {
  getAllOrders,
  getAllTestimonials,
  getAllServices,
  updateOrderStatus,
  approveTestimonial,
  rejectTestimonial,
  updateService,
  deleteService,
  addService,
  adminLogout,
  checkAdminSession,
  getPendingDepositsForAdmin,
  approveDeposit,
  rejectDeposit,
} from "@/lib/actions"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [newService, setNewService] = useState<Partial<Service>>({
    platform: "",
    name: "",
    price: 0.5,
  })

  // Status colors and icons
  const statusConfig = {
    Pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500", icon: Clock },
    "In Review": { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500", icon: RefreshCw },
    Processing: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500", icon: Package },
    Completed: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500", icon: CheckCircle },
  }

  // Check admin session
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const result = await checkAdminSession()
        if (!result.success) {
          router.push("/admin-access")
        } else {
          fetchData()
        }
      } catch (error) {
        router.push("/admin-access")
      }
    }

    verifyAdmin()
  }, [router])

  // Fetch data based on active tab
  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === "orders" || activeTab === "all") {
        const result = await getAllOrders()
        if (result.success) {
          setOrders(result.orders)
        }
      }

      if (activeTab === "testimonials" || activeTab === "all") {
        const result = await getAllTestimonials()
        if (result.success) {
          setTestimonials(result.testimonials)
        }
      }

      if (activeTab === "services" || activeTab === "all") {
        const result = await getAllServices()
        if (result.success) {
          setServices(result.services)
        }
      }

      if (activeTab === "deposits" || activeTab === "all") {
        const result = await getPendingDepositsForAdmin()
        if (result.success) {
          setDeposits(result.deposits || [])
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchTerm("")
    fetchData()
  }

  // Handle order status update
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    setIsUpdating(true)
    try {
      const result = await updateOrderStatus(orderId, status)
      if (result.success) {
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, status } : order)))
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle testimonial approval
  const handleApproveTestimonial = async (testimonialId: string) => {
    setIsUpdating(true)
    try {
      const result = await approveTestimonial(testimonialId)
      if (result.success) {
        setTestimonials(
          testimonials.map((testimonial) =>
            testimonial.id === testimonialId ? { ...testimonial, approved: true } : testimonial,
          ),
        )
        setSelectedTestimonial(null)
      }
    } catch (error) {
      console.error("Error approving testimonial:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle testimonial rejection
  const handleRejectTestimonial = async (testimonialId: string) => {
    setIsUpdating(true)
    try {
      const result = await rejectTestimonial(testimonialId)
      if (result.success) {
        setTestimonials(
          testimonials.map((testimonial) =>
            testimonial.id === testimonialId ? { ...testimonial, approved: false } : testimonial,
          ),
        )
        setSelectedTestimonial(null)
      }
    } catch (error) {
      console.error("Error rejecting testimonial:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle service update
  const handleUpdateService = async (serviceId: string, data: Partial<Service>) => {
    setIsUpdating(true)
    try {
      const result = await updateService(serviceId, data)
      if (result.success) {
        setServices(services.map((service) => (service.id === serviceId ? { ...service, ...data } : service)))
        setSelectedService(null)
      }
    } catch (error) {
      console.error("Error updating service:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle service deletion
  const handleDeleteService = async (serviceId: string) => {
    setIsUpdating(true)
    try {
      const result = await deleteService(serviceId)
      if (result.success) {
        setServices(services.filter((service) => service.id !== serviceId))
        setSelectedService(null)
      }
    } catch (error) {
      console.error("Error deleting service:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle adding new service
  const handleAddService = async () => {
    setIsUpdating(true)
    try {
      const result = await addService(newService as Service)
      if (result.success) {
        setServices([...services, result.service])
        setNewService({
          platform: "",
          name: "",
          price: 0.5,
        })
      }
    } catch (error) {
      console.error("Error adding service:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle deposit approval
  const handleApproveDeposit = async (depositId: string) => {
    setIsUpdating(true)
    try {
      const result = await approveDeposit(depositId)
      if (result.success) {
        // Refresh deposits
        const depositsResult = await getPendingDepositsForAdmin()
        if (depositsResult.success) {
          setDeposits(depositsResult.deposits || [])
        }
        setSelectedDeposit(null)
      }
    } catch (error) {
      console.error("Error approving deposit:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle deposit rejection
  const handleRejectDeposit = async (depositId: string) => {
    setIsUpdating(true)
    try {
      const result = await rejectDeposit(depositId)
      if (result.success) {
        // Refresh deposits
        const depositsResult = await getPendingDepositsForAdmin()
        if (depositsResult.success) {
          setDeposits(depositsResult.deposits || [])
        }
        setSelectedDeposit(null)
      }
    } catch (error) {
      console.error("Error rejecting deposit:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await adminLogout()
      router.push("/admin-access")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  // Filter data based on search term
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.service.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredTestimonials = testimonials.filter(
    (testimonial) =>
      testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredServices = services.filter(
    (service) =>
      service.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredDeposits = deposits.filter(
    (deposit) =>
      deposit.deposit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deposit.user_id && deposit.user_id.toString().includes(searchTerm.toLowerCase())) ||
      deposit.payment_method.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // View payment screenshot
  const handleViewScreenshot = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setShowImageDialog(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="orders" value={activeTab} onValueChange={handleTabChange}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="orders" className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="deposits" className="flex items-center">
                <Wallet className="h-4 w-4 mr-2" />
                Deposits
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Testimonials
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Services
              </TabsTrigger>
            </TabsList>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>
          </div>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders Management</CardTitle>
                <CardDescription>View and manage all customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                            <TableCell>{order.email}</TableCell>
                            <TableCell>
                              {order.platform} - {order.service}
                            </TableCell>
                            <TableCell>${order.total.toFixed(2)}</TableCell>
                            <TableCell>
                              {new Date(order.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
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
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewScreenshot(order.screenshot)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Payment Proof
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "Pending")}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Set as Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "In Review")}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Set as In Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "Processing")}>
                                    <Package className="h-4 w-4 mr-2" />
                                    Set as Processing
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "Completed")}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Set as Completed
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Details Dialog */}
            {selectedOrder && (
              <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogDescription>Order ID: {selectedOrder.id}</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Customer Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span>{selectedOrder.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{selectedOrder.email}</span>
                        </div>
                        {selectedOrder.message && (
                          <div>
                            <span className="text-muted-foreground">Message:</span>
                            <p className="mt-1 p-2 bg-muted rounded">{selectedOrder.message}</p>
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-medium mt-6 mb-2">Order Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform:</span>
                          <span>{selectedOrder.platform}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service:</span>
                          <span>{selectedOrder.service}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantity:</span>
                          <span>{selectedOrder.quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total:</span>
                          <span>${selectedOrder.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>
                            {new Date(selectedOrder.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge
                            variant="outline"
                            className={statusConfig[selectedOrder.status as keyof typeof statusConfig]?.color}
                          >
                            {(() => {
                              const StatusIcon =
                                statusConfig[selectedOrder.status as keyof typeof statusConfig]?.icon || AlertCircle
                              return (
                                <div className="flex items-center">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {selectedOrder.status}
                                </div>
                              )
                            })()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Payment Screenshot</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Image
                          src={selectedOrder.screenshot || "/placeholder.svg"}
                          alt="Payment Screenshot"
                          width={400}
                          height={300}
                          className="w-full object-contain"
                        />
                      </div>

                      <h3 className="text-lg font-medium mt-6 mb-2">Update Status</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="flex items-center"
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, "Pending")}
                          disabled={isUpdating}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Pending
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center"
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, "In Review")}
                          disabled={isUpdating}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          In Review
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center"
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, "Processing")}
                          disabled={isUpdating}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Processing
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center"
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, "Completed")}
                          disabled={isUpdating}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deposits Management</CardTitle>
                <CardDescription>Verify and approve user deposits</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredDeposits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No pending deposits found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Deposit ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDeposits.map((deposit) => (
                          <TableRow key={deposit.deposit_id}>
                            <TableCell className="font-medium">{deposit.deposit_id.substring(0, 8)}...</TableCell>
                            <TableCell>{deposit.user_id}</TableCell>
                            <TableCell>
                              ${deposit.amount.toFixed(2)}
                              {deposit.amount_inr && (
                                <span className="text-xs text-muted-foreground ml-1">(₹{deposit.amount_inr})</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {deposit.payment_method === "qr" ? "QR/UPI" : "Cryptocurrency"}
                              {deposit.currency && <span className="text-xs ml-1">({deposit.currency})</span>}
                            </TableCell>
                            <TableCell>
                              {new Date(deposit.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  deposit.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                                    : deposit.status === "completed"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500"
                                }
                              >
                                <div className="flex items-center">
                                  {deposit.status === "pending" ? (
                                    <Clock className="h-3 w-3 mr-1" />
                                  ) : deposit.status === "completed" ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedDeposit(deposit)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewScreenshot(deposit.screenshot)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Payment Proof
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleApproveDeposit(deposit.deposit_id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Deposit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRejectDeposit(deposit.deposit_id)}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Deposit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deposit Details Dialog */}
            {selectedDeposit && (
              <Dialog open={!!selectedDeposit} onOpenChange={(open) => !open && setSelectedDeposit(null)}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Deposit Details</DialogTitle>
                    <DialogDescription>Deposit ID: {selectedDeposit.deposit_id}</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">User Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User ID:</span>
                          <span>{selectedDeposit.user_id}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-medium mt-6 mb-2">Deposit Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount (USD):</span>
                          <span>${selectedDeposit.amount.toFixed(2)}</span>
                        </div>
                        {selectedDeposit.amount_inr && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount (INR):</span>
                            <span>₹{selectedDeposit.amount_inr}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <span>{selectedDeposit.payment_method === "qr" ? "QR/UPI" : "Cryptocurrency"}</span>
                        </div>
                        {selectedDeposit.currency && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Currency:</span>
                            <span>{selectedDeposit.currency}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>
                            {new Date(selectedDeposit.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge
                            variant="outline"
                            className={
                              selectedDeposit.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                                : selectedDeposit.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500"
                            }
                          >
                            <div className="flex items-center">
                              {selectedDeposit.status === "pending" ? (
                                <Clock className="h-3 w-3 mr-1" />
                              ) : selectedDeposit.status === "completed" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {selectedDeposit.status.charAt(0).toUpperCase() + selectedDeposit.status.slice(1)}
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Payment Screenshot</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Image
                          src={selectedDeposit.screenshot || "/placeholder.svg"}
                          alt="Payment Screenshot"
                          width={400}
                          height={300}
                          className="w-full object-contain"
                        />
                      </div>

                      <h3 className="text-lg font-medium mt-6 mb-2">Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="flex items-center"
                          onClick={() => handleRejectDeposit(selectedDeposit.deposit_id)}
                          disabled={isUpdating || selectedDeposit.status !== "pending"}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          className="flex items-center"
                          onClick={() => handleApproveDeposit(selectedDeposit.deposit_id)}
                          disabled={isUpdating || selectedDeposit.status !== "pending"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Testimonials Management</CardTitle>
                <CardDescription>Review and manage customer testimonials</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredTestimonials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No testimonials found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTestimonials.map((testimonial) => (
                          <TableRow key={testimonial.id}>
                            <TableCell className="font-medium">{testimonial.name}</TableCell>
                            <TableCell>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < testimonial.rating
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "fill-gray-300 text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{testimonial.content}</TableCell>
                            <TableCell>
                              {new Date(testimonial.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  testimonial.approved
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                                }
                              >
                                {testimonial.approved ? (
                                  <div className="flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approved
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </div>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedTestimonial(testimonial)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleApproveTestimonial(testimonial.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRejectTestimonial(testimonial.id)}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Testimonial Details Dialog */}
            {selectedTestimonial && (
              <Dialog open={!!selectedTestimonial} onOpenChange={(open) => !open && setSelectedTestimonial(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Testimonial Details</DialogTitle>
                    <DialogDescription>Review testimonial content</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={selectedTestimonial.avatar || "/placeholder.svg?height=50&width=50"}
                        alt={selectedTestimonial.name}
                        width={60}
                        height={60}
                        className="rounded-full"
                      />
                      <div>
                        <h3 className="font-medium">{selectedTestimonial.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedTestimonial.title}</p>
                        <div className="flex mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < selectedTestimonial.rating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "fill-gray-300 text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Testimonial Content:</h4>
                      <p className="p-3 bg-muted rounded-md">{selectedTestimonial.content}</p>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Submitted on:{" "}
                        {new Date(selectedTestimonial.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          selectedTestimonial.approved
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                        }
                      >
                        {selectedTestimonial.approved ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </div>
                        )}
                      </Badge>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleRejectTestimonial(selectedTestimonial.id)}
                        disabled={isUpdating}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button onClick={() => handleApproveTestimonial(selectedTestimonial.id)} disabled={isUpdating}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Services Management</CardTitle>
                <CardDescription>Manage available services and pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Add New Service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="platform">Platform</Label>
                      <Input
                        id="platform"
                        value={newService.platform}
                        onChange={(e) => setNewService({ ...newService, platform: e.target.value })}
                        placeholder="e.g. Instagram"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Service Name</Label>
                      <Input
                        id="name"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        placeholder="e.g. Followers"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price per 1K</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: Number.parseFloat(e.target.value) })}
                        placeholder="0.5"
                      />
                    </div>
                  </div>
                  <Button
                    className="mt-4"
                    onClick={handleAddService}
                    disabled={isUpdating || !newService.platform || !newService.name || !newService.price}
                  >
                    Add Service
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No services found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Platform</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Price per 1K</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.platform}</TableCell>
                            <TableCell>{service.name}</TableCell>
                            <TableCell>${service.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedService(service)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteService(service.id)}>
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Edit Dialog */}
            {selectedService && (
              <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Service</DialogTitle>
                    <DialogDescription>Update service details</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-platform">Platform</Label>
                      <Input
                        id="edit-platform"
                        value={selectedService.platform}
                        onChange={(e) => setSelectedService({ ...selectedService, platform: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Service Name</Label>
                      <Input
                        id="edit-name"
                        value={selectedService.name}
                        onChange={(e) => setSelectedService({ ...selectedService, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Price per 1K</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={selectedService.price}
                        onChange={(e) =>
                          setSelectedService({ ...selectedService, price: Number.parseFloat(e.target.value) })
                        }
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setSelectedService(null)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleUpdateService(selectedService.id, selectedService)}
                        disabled={isUpdating}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Update Service
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
        </Tabs>

        {/* Image Preview Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Payment Screenshot</DialogTitle>
              <DialogDescription>View the uploaded payment proof</DialogDescription>
            </DialogHeader>
            {selectedImage && (
              <div className="flex justify-center">
                <Image
                  src={selectedImage || "/placeholder.svg"}
                  alt="Payment Screenshot"
                  width={600}
                  height={400}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}
