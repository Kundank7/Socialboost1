"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Instagram,
  Facebook,
  Youtube,
  TextIcon as Telegram,
  CreditCard,
  QrCode,
  Upload,
  Send,
  Check,
  AlertCircle,
  Loader2,
  Link2,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createOrder, checkSufficientBalance, deductFromWallet, getWalletBalance } from "@/lib/actions"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

// Platform data
const platforms = {
  instagram: { name: "Instagram", icon: Instagram, color: "text-pink-500" },
  facebook: { name: "Facebook", icon: Facebook, color: "text-blue-500" },
  youtube: { name: "YouTube", icon: Youtube, color: "text-red-500" },
  telegram: { name: "Telegram", icon: Telegram, color: "text-blue-400" },
}

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get query parameters
  const platform = searchParams.get("platform") || ""
  const service = searchParams.get("service") || ""
  const link = searchParams.get("link") || ""
  const quantity = Number.parseInt(searchParams.get("quantity") || "0")
  const total = Number.parseFloat(searchParams.get("total") || "0")

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "manual">("wallet")
  const [walletBalance, setWalletBalance] = useState(0)
  const [hasWallet, setHasWallet] = useState(false)

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")

      // Check wallet balance
      const fetchWalletBalance = async () => {
        if (session.user?.id) {
          try {
            const result = await getWalletBalance(Number(session.user.id))
            if (result.success) {
              setWalletBalance(result.balance || 0)
              setHasWallet(true)

              // Set default payment method based on balance
              if ((result.balance || 0) >= total) {
                setPaymentMethod("wallet")
              } else {
                setPaymentMethod("manual")
              }
            }
          } catch (error) {
            console.error("Failed to fetch wallet balance:", error)
          }
        }
      }

      fetchWalletBalance()
    }
  }, [session, total])

  // Get platform data
  const platformData = platforms[platform as keyof typeof platforms]

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!name || !email) {
      setError("Please fill in all required fields.")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    // If using manual payment, validate screenshot
    if (paymentMethod === "manual" && !screenshot) {
      setError("Please upload a payment screenshot.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // If using wallet payment, check balance and deduct
      if (paymentMethod === "wallet" && session?.user?.id) {
        const balanceCheck = await checkSufficientBalance(Number(session.user.id), total)

        if (!balanceCheck.success) {
          setError("Failed to check wallet balance. Please try again.")
          setIsSubmitting(false)
          return
        }

        if (!balanceCheck.hasBalance) {
          setError("Insufficient wallet balance. Please deposit funds or choose manual payment.")
          setIsSubmitting(false)
          return
        }
      }

      // Convert screenshot to base64 for storage if using manual payment
      let base64Screenshot = null
      if (paymentMethod === "manual" && screenshot) {
        const reader = new FileReader()
        reader.readAsDataURL(screenshot)

        await new Promise((resolve) => {
          reader.onload = () => {
            base64Screenshot = reader.result as string
            resolve(null)
          }
        })
      }

      // Create order in the database
      const result = await createOrder({
        user_id: session?.user?.id ? Number(session.user.id) : undefined,
        platform,
        service,
        link,
        quantity,
        total,
        name,
        email,
        message,
        screenshot: base64Screenshot,
      })

      if (result.success && result.orderId) {
        // If using wallet payment, deduct from wallet
        if (paymentMethod === "wallet" && session?.user?.id) {
          const deductResult = await deductFromWallet(Number(session.user.id), total, result.orderId)

          if (!deductResult.success) {
            setError("Failed to process wallet payment. Please try again.")
            setIsSubmitting(false)
            return
          }

          // Update wallet balance
          setWalletBalance(deductResult.newBalance || 0)
        }

        setOrderId(result.orderId)
        setIsSubmitted(true)

        // Reset form
        setName("")
        setEmail("")
        setMessage("")
        setScreenshot(null)
        setScreenshotPreview(null)
      } else {
        setError(result.error || "Failed to create order. Please try again.")
      }
    } catch (err) {
      setError("An error occurred while processing your payment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // If no valid query parameters, show error
  if (!platform || !service || !quantity || !total) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Request</AlertTitle>
          <AlertDescription>
            The payment information is incomplete. Please go back and select your service.
          </AlertDescription>
        </Alert>
        <div className="text-center mt-6">
          <Button asChild>
            <Link href="/select">Go Back to Services</Link>
          </Button>
        </div>
      </div>
    )
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
              <CardTitle className="text-center text-2xl">Payment Submitted Successfully!</CardTitle>
              <CardDescription className="text-center">
                Thank you for your order. We'll process it shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6">
                We've sent a confirmation email to your email address. You'll receive updates about your order status.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Order Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-medium">{orderId}</span>
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="font-medium">{platformData?.name}</span>
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{service}</span>
                  <span className="text-muted-foreground">Link:</span>
                  <span className="font-medium truncate max-w-[200px]">{link}</span>
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{quantity.toLocaleString()}</span>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">
                    {paymentMethod === "wallet" ? "Wallet Balance" : "Manual Payment"}
                  </span>
                </div>
              </div>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Please save your Order ID: <span className="font-bold">{orderId}</span> for tracking your order
                  status.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button asChild variant="outline">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild>
                <Link href="/track" onClick={() => router.push(`/track?orderId=${orderId}`)}>
                  Track Your Order
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Complete Your Payment</h1>
            <p className="text-xl mb-8 text-muted-foreground text-center">
              Review your order and submit payment to complete your purchase.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Order Summary */}
              <Card className="md:col-span-1 glass-card">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${platformData?.color}`}
                    >
                      {platformData && <platformData.icon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{platformData?.name}</p>
                      <p className="text-sm text-muted-foreground">{service}</p>
                    </div>
                  </div>

                  {link && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{link}</span>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span>{quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Price per 1K:</span>
                      <span>${(total / (quantity / 1000)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {hasWallet && (
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Wallet Balance:</span>
                        <span className="font-medium">${walletBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Form */}
              <Card className="md:col-span-2 glass-card">
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>Complete the form below to submit your payment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message (Optional)</Label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Any special instructions or your social media username"
                        />
                      </div>

                      {/* Payment Method Selection */}
                      {session && hasWallet && (
                        <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <RadioGroup
                            value={paymentMethod}
                            onValueChange={(value) => setPaymentMethod(value as "wallet" | "manual")}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="wallet" id="wallet" disabled={walletBalance < total} />
                              <Label
                                htmlFor="wallet"
                                className={`flex items-center space-x-2 ${walletBalance < total ? "opacity-50" : ""}`}
                              >
                                <Wallet className="h-4 w-4" />
                                <span>Pay with Wallet Balance (${walletBalance.toFixed(2)})</span>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="manual" id="manual" />
                              <Label htmlFor="manual" className="flex items-center space-x-2">
                                <CreditCard className="h-4 w-4" />
                                <span>Manual Payment</span>
                              </Label>
                            </div>
                          </RadioGroup>

                          {walletBalance < total && paymentMethod === "wallet" && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Insufficient Balance</AlertTitle>
                              <AlertDescription>
                                Your wallet balance is insufficient. Please deposit funds or choose manual payment.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}

                      {/* Manual Payment Options */}
                      {(!session || !hasWallet || paymentMethod === "manual") && (
                        <Tabs defaultValue="qr">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="qr">QR Code Payment</TabsTrigger>
                            <TabsTrigger value="crypto">Crypto Payment</TabsTrigger>
                          </TabsList>
                          <TabsContent value="qr" className="space-y-4">
                            <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                              <QrCode className="h-32 w-32 mb-4 text-primary" />
                              <p className="text-center text-sm text-muted-foreground">
                                Scan this QR code with your UPI app to make the payment of ${total.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center justify-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">UPI ID: socialboost@upi</span>
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="crypto" className="space-y-4">
                            <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                              <Image
                                src="/placeholder.svg?height=128&width=128"
                                alt="Crypto QR Code"
                                width={128}
                                height={128}
                                className="mb-4"
                              />
                              <p className="text-center text-sm text-muted-foreground">
                                Send ${total.toFixed(2)} worth of USDT to the address below
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
                      )}

                      {/* Payment Screenshot - Only show for manual payment */}
                      {(!session || !hasWallet || paymentMethod === "manual") && (
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
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={
                        isSubmitting ||
                        (paymentMethod === "manual" && !screenshot) ||
                        (paymentMethod === "wallet" && walletBalance < total)
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          {paymentMethod === "wallet" ? "Pay with Wallet" : "Submit Payment"}
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
