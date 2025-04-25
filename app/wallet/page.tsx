"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  CreditCard,
  QrCode,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowDown,
  ArrowUp,
  Bitcoin,
  DollarSign,
} from "lucide-react"
import { getWalletBalance, getUserDeposits, getUserTransactions, createDeposit, convertUsdToInr } from "@/lib/actions"
import type { Deposit, Transaction } from "@/lib/types"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function WalletPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState("overview")
  const [balance, setBalance] = useState(0)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [depositAmount, setDepositAmount] = useState(1) // Default to minimum $1
  const [depositAmountInr, setDepositAmountInr] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "crypto">("qr")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/wallet")
    }
  }, [status, router])

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      if (session?.user?.id) {
        setIsLoading(true)
        try {
          // Fetch wallet balance
          const balanceResult = await getWalletBalance(Number(session.user.id))
          if (balanceResult.success) {
            setBalance(balanceResult.balance || 0)
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
          console.error("Failed to fetch wallet data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (session?.user) {
      fetchWalletData()
    }
  }, [session])

  // Convert USD to INR when deposit amount changes
  useEffect(() => {
    const updateInrAmount = async () => {
      if (depositAmount >= 1) {
        try {
          const result = await convertUsdToInr(depositAmount)
          if (result.success) {
            setDepositAmountInr(result.amountInr || 0)
          }
        } catch (error) {
          console.error("Failed to convert currency:", error)
        }
      }
    }

    updateInrAmount()
  }, [depositAmount])

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setScreenshot(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setScreenshotPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle deposit submission
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate form
      if (depositAmount < 1) {
        setError("Minimum deposit amount is $1")
        setIsSubmitting(false)
        return
      }

      if (!screenshot) {
        setError("Please upload a payment screenshot")
        setIsSubmitting(false)
        return
      }

      // Convert screenshot to base64 for storage
      const reader = new FileReader()
      reader.readAsDataURL(screenshot)

      reader.onload = async () => {
        const base64Screenshot = reader.result as string

        // Create deposit request
        const result = await createDeposit({
          user_id: Number(session?.user?.id),
          amount: depositAmount,
          amount_inr: paymentMethod === "qr" ? depositAmountInr : undefined,
          payment_method: paymentMethod,
          currency: paymentMethod === "crypto" ? "USDT" : undefined,
          screenshot: base64Screenshot,
        })

        if (result.success) {
          setSuccess(
            "Your deposit request has been submitted successfully. It will be processed within 30 minutes. If not, please contact our support.",
          )

          // Reset form
          setDepositAmount(1)
          setScreenshot(null)
          setScreenshotPreview(null)

          // Refresh deposits after a short delay
          setTimeout(async () => {
            if (session?.user?.id) {
              const depositsResult = await getUserDeposits(Number(session.user.id))
              if (depositsResult.success) {
                setDeposits(depositsResult.deposits || [])
              }
            }
          }, 1000)
        } else {
          setError(result.error || "Failed to submit deposit request")
        }

        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error submitting deposit:", error)
      setError("An error occurred while submitting your deposit request")
      setIsSubmitting(false)
    }
  }

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
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Your Wallet</h1>
        <p className="text-xl mb-8 text-muted-foreground text-center">
          Manage your funds, make deposits, and view your transaction history
        </p>

        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Wallet Balance</CardTitle>
                    <CardDescription>Your current available balance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center">
                      <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
                        <Wallet className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Available Balance</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button onClick={() => setActiveTab("deposit")}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Add Funds
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your recent transactions and deposits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 && deposits.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground mb-4">No recent activity</p>
                        <Button onClick={() => setActiveTab("deposit")}>Make Your First Deposit</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Recent Transactions */}
                        {transactions.slice(0, 3).map((transaction) => (
                          <div
                            key={transaction.transaction_id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  transaction.type === "deposit"
                                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
                                    : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500"
                                }`}
                              >
                                {transaction.type === "deposit" ? (
                                  <ArrowDown className="h-5 w-5" />
                                ) : (
                                  <ArrowUp className="h-5 w-5" />
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(transaction.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`font-medium ${
                                transaction.amount > 0
                                  ? "text-green-600 dark:text-green-500"
                                  : "text-blue-600 dark:text-blue-500"
                              }`}
                            >
                              {transaction.amount > 0 ? "+" : ""}
                              {transaction.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}

                        {/* Recent Deposits */}
                        {deposits.slice(0, 3).map((deposit) => (
                          <div
                            key={deposit.deposit_id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  deposit.status === "completed"
                                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
                                    : deposit.status === "pending"
                                      ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500"
                                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500"
                                }`}
                              >
                                {deposit.status === "completed" ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : deposit.status === "pending" ? (
                                  <Clock className="h-5 w-5" />
                                ) : (
                                  <AlertCircle className="h-5 w-5" />
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium">
                                  Deposit via {deposit.payment_method === "qr" ? "QR/UPI" : "Cryptocurrency"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(deposit.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">${deposit.amount.toFixed(2)}</span>
                              <Badge
                                className={`ml-2 ${
                                  deposit.status === "completed"
                                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
                                    : deposit.status === "pending"
                                      ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500"
                                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500"
                                }`}
                              >
                                {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button variant="outline" onClick={() => setActiveTab("history")}>
                      View All Transactions
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* Deposit Tab */}
            <TabsContent value="deposit">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Make a Deposit</CardTitle>
                    <CardDescription>Add funds to your wallet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitDeposit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            step="1"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(Number(e.target.value))}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">Minimum deposit: $1</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            type="button"
                            variant={paymentMethod === "qr" ? "default" : "outline"}
                            className="flex items-center justify-center"
                            onClick={() => setPaymentMethod("qr")}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            QR Code / UPI
                          </Button>
                          <Button
                            type="button"
                            variant={paymentMethod === "crypto" ? "default" : "outline"}
                            className="flex items-center justify-center"
                            onClick={() => setPaymentMethod("crypto")}
                          >
                            <Bitcoin className="mr-2 h-4 w-4" />
                            Cryptocurrency
                          </Button>
                        </div>
                      </div>

                      {paymentMethod === "qr" && (
                        <div className="space-y-4">
                          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                            <QrCode className="h-32 w-32 mb-4 text-primary" />
                            <p className="text-center text-sm text-muted-foreground">
                              Scan this QR code with your UPI app to make the payment of ₹{depositAmountInr}
                            </p>
                          </div>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">UPI ID: socialboost@upi</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "crypto" && (
                        <div className="space-y-4">
                          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                            <Image
                              src="/placeholder.svg?height=128&width=128"
                              alt="Crypto QR Code"
                              width={128}
                              height={128}
                              className="mb-4"
                            />
                            <p className="text-center text-sm text-muted-foreground">
                              Send ${depositAmount.toFixed(2)} worth of USDT to the address below
                            </p>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono bg-muted p-2 rounded">
                                0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="screenshot">Payment Screenshot</Label>
                        <div
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {screenshotPreview ? (
                            <div className="relative">
                              <Image
                                src={screenshotPreview || "/placeholder.svg"}
                                alt="Payment Screenshot"
                                width={300}
                                height={200}
                                className="mx-auto rounded-lg max-h-[200px] w-auto object-contain"
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setScreenshot(null)
                                  setScreenshotPreview(null)
                                }}
                              >
                                Change
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground mb-1">Click to upload payment screenshot</p>
                              <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 5MB)</p>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            id="screenshot"
                            className="hidden"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleFileChange}
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {success && (
                        <Alert className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-500 border-green-200 dark:border-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle>Success</AlertTitle>
                          <AlertDescription>{success}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || !screenshot || depositAmount < 1}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Submit Deposit"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Deposit Information</CardTitle>
                    <CardDescription>Important details about deposits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Minimum Deposit</h3>
                      <p className="text-sm text-muted-foreground">
                        The minimum deposit amount is $1. For QR/UPI payments, the amount will be converted to INR.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Processing Time</h3>
                      <p className="text-sm text-muted-foreground">
                        Deposits are typically processed within 30 minutes. If your deposit is not credited within this
                        time, please contact our support.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Payment Methods</h3>
                      <p className="text-sm text-muted-foreground">
                        We accept payments via QR Code/UPI and Cryptocurrency (USDT). Make sure to upload a screenshot
                        of your payment as proof.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Need Help?</h3>
                      <p className="text-sm text-muted-foreground">
                        If you encounter any issues with your deposit, please contact our support team via:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        <li>WhatsApp: +1 (555) 123-4567</li>
                        <li>Telegram: @SocialBoost</li>
                        <li>Email: support@socialboost.com</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Deposit History</CardTitle>
                    <CardDescription>All your deposit requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deposits.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground mb-4">No deposits found</p>
                        <Button onClick={() => setActiveTab("deposit")}>Make Your First Deposit</Button>
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
                            {deposits.map((deposit) => (
                              <TableRow key={deposit.deposit_id}>
                                <TableCell>{new Date(deposit.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>${deposit.amount.toFixed(2)}</TableCell>
                                <TableCell>{deposit.payment_method === "qr" ? "QR/UPI" : "Cryptocurrency"}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={`${
                                      deposit.status === "completed"
                                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
                                        : deposit.status === "pending"
                                          ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500"
                                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500"
                                    }`}
                                  >
                                    {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>All your wallet transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 ? (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground mb-4">No transactions found</p>
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
                            {transactions.map((transaction) => (
                              <TableRow key={transaction.transaction_id}>
                                <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={`${
                                      transaction.type === "deposit"
                                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
                                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500"
                                    }`}
                                  >
                                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={`font-medium ${
                                    transaction.amount > 0
                                      ? "text-green-600 dark:text-green-500"
                                      : "text-blue-600 dark:text-blue-500"
                                  }`}
                                >
                                  {transaction.amount > 0 ? "+" : ""}
                                  {transaction.amount.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  )
}
