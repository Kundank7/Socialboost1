"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CreditCard,
  QrCode,
  Upload,
  Send,
  Check,
  AlertCircle,
  Loader2,
  DollarSign,
  Bitcoin,
  Wallet,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createDeposit, getUSDToINRRate } from "@/lib/actions"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function DepositPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [amount, setAmount] = useState<number>(1)
  const [amountINR, setAmountINR] = useState<number>(0)
  const [exchangeRate, setExchangeRate] = useState<number>(83.5) // Default rate
  const [paymentMethod, setPaymentMethod] = useState<string>("QR/UPI")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string>("")

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [depositId, setDepositId] = useState<number | null>(null)

  // Fetch exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const rate = await getUSDToINRRate()
        setExchangeRate(rate)
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error)
      }
    }

    fetchExchangeRate()
  }, [])

  // Calculate INR amount when USD amount or exchange rate changes
  useEffect(() => {
    if (paymentMethod === "QR/UPI") {
      setAmountINR(Math.ceil(amount * exchangeRate))
    }
  }, [amount, exchangeRate, paymentMethod])

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/deposit")
    }
  }, [status, router])

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

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 1) {
      setAmount(value)
    } else {
      setAmount(1) // Minimum $1
    }
  }

  // Handle payment method change
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value)
    setScreenshot(null)
    setScreenshotPreview(null)
    setTransactionId("")
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (amount < 1) {
      setError("Minimum deposit amount is $1.")
      return
    }

    if (!screenshot && paymentMethod === "QR/UPI") {
      setError("Please upload a payment screenshot.")
      return
    }

    if (!transactionId && paymentMethod === "Crypto") {
      setError("Please enter the transaction ID.")
      return
    }

    if (!session?.user?.id) {
      setError("You must be logged in to make a deposit.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Convert screenshot to base64 for storage
      let base64Screenshot = null
      if (screenshot) {
        const reader = new FileReader()
        reader.readAsDataURL(screenshot)

        base64Screenshot = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
        })
      }

      // Create deposit
      const result = await createDeposit({
        userId: Number.parseInt(session.user.id as string),
        amountUSD: amount,
        paymentMethod,
        screenshot: base64Screenshot,
        transactionId: transactionId || undefined,
      })

      if (result.success) {
        setDepositId(result.deposit.id)
        setIsSubmitted(true)

        // Reset form
        setAmount(1)
        setScreenshot(null)
        setScreenshotPreview(null)
        setTransactionId("")
      } else {
        setError(result.error || "Failed to process deposit. Please try again.")
      }
    } catch (err) {
      setError("An error occurred while processing your deposit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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
      <motion.div className="max-w-3xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        {isSubmitted ? (
          <Card className="glass-card">
            <CardHeader>
              <div className="mx-auto bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-center text-2xl">Deposit Submitted Successfully!</CardTitle>
              <CardDescription className="text-center">
                Your deposit request has been received and is being processed.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6">Your deposit will be added to your wallet within 30 minutes after verification.</p>
              <div className="bg-muted/50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Deposit Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Deposit ID:</span>
                  <span className="font-medium">{depositId}</span>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                  {paymentMethod === "QR/UPI" && (
                    <>
                      <span className="text-muted-foreground">Amount (INR):</span>
                      <span className="font-medium">₹{amountINR}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">{paymentMethod}</span>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">Pending</span>
                </div>
              </div>
              <Alert className="mb-6">
                <RefreshCw className="h-4 w-4" />
                <AlertTitle>Processing</AlertTitle>
                <AlertDescription>
                  Your deposit is being processed. It will be added to your wallet within 30 minutes. If not, please
                  contact us via WhatsApp, Telegram, or Email.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button asChild variant="outline">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild>
                <Link href="/profile">View Profile</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Add Funds to Your Wallet</h1>
            <p className="text-xl mb-8 text-muted-foreground text-center">
              Deposit money to your wallet to purchase services.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wallet Summary */}
              <Card className="md:col-span-1 glass-card">
                <CardHeader>
                  <CardTitle>Wallet Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Your Balance</p>
                      <p className="text-2xl font-bold">$0.00</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Minimum Deposit:</span>
                      <span>$1.00</span>
                    </div>
                    {paymentMethod === "QR/UPI" && (
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Exchange Rate:</span>
                        <span>1 USD = ₹{exchangeRate.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Processing Time:</span>
                      <span>~30 minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deposit Form */}
              <Card className="md:col-span-2 glass-card">
                <CardHeader>
                  <CardTitle>Deposit Funds</CardTitle>
                  <CardDescription>Choose your preferred payment method and amount.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="QR/UPI" onValueChange={handlePaymentMethodChange}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="QR/UPI" className="flex items-center">
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code / UPI
                      </TabsTrigger>
                      <TabsTrigger value="Crypto" className="flex items-center">
                        <Bitcoin className="h-4 w-4 mr-2" />
                        Cryptocurrency
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="QR/UPI" className="space-y-4">
                      <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                        <QrCode className="h-32 w-32 mb-4 text-primary" />
                        <p className="text-center text-sm text-muted-foreground">
                          Scan this QR code with your UPI app to make the payment of ₹{amountINR}
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">UPI ID: socialboost@upi</span>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="Crypto" className="space-y-4">
                      <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                        <Image
                          src="/placeholder.svg?height=128&width=128"
                          alt="Crypto QR Code"
                          width={128}
                          height={128}
                          className="mb-4"
                        />
                        <p className="text-center text-sm text-muted-foreground">
                          Send ${amount.toFixed(2)} worth of USDT to the address below
                        </p>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono bg-muted p-2 rounded">
                            0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
                          </span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Deposit Amount (USD)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            step="0.01"
                            value={amount}
                            onChange={handleAmountChange}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">Minimum deposit: $1.00</p>
                      </div>

                      {paymentMethod === "QR/UPI" && (
                        <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="text-sm text-muted-foreground">Amount in INR:</span>
                            <p className="text-lg font-bold">₹{amountINR}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm text-muted-foreground">Pay exactly:</span>
                            <p className="text-lg font-bold">₹{amountINR}</p>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "Crypto" && (
                        <div className="space-y-2">
                          <Label htmlFor="transactionId">Transaction ID</Label>
                          <Input
                            id="transactionId"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter your transaction ID"
                            required={paymentMethod === "Crypto"}
                          />
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
                            required={paymentMethod === "QR/UPI"}
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Deposit
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <span>Need help?</span>
                    <Link href="#" className="ml-1 underline">
                      Contact support
                    </Link>
                  </div>
                  <div>
                    <span>WhatsApp: +1 (555) 123-4567</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
