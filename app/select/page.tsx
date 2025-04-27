"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import {
  Instagram,
  Facebook,
  Youtube,
  TextIcon as Telegram,
  Calculator,
  Link2,
  Wallet,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { getServicesByPlatform, getAllPlatforms, getUserWallet } from "@/lib/actions"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

// Platform data for icons
const platformIcons = {
  instagram: { icon: Instagram, color: "from-pink-500 to-purple-600" },
  facebook: { icon: Facebook, color: "from-blue-500 to-blue-700" },
  youtube: { icon: Youtube, color: "from-red-500 to-red-700" },
  telegram: { icon: Telegram, color: "from-blue-400 to-blue-600" },
}

export default function SelectService() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [platforms, setPlatforms] = useState<string[]>([])
  const [services, setServices] = useState<{ id: number; name: string; price: number }[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [servicePrice, setServicePrice] = useState(0.5)
  const [socialLink, setSocialLink] = useState("")
  const [quantity, setQuantity] = useState<string>("")
  const [total, setTotal] = useState(0.5)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [useWallet, setUseWallet] = useState(false)
  const [insufficientBalance, setInsufficientBalance] = useState(false)
  const [isPlatformInitialized, setIsPlatformInitialized] = useState(false)

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/select")
    }
  }, [status, router])

  // Show loading state while checking authentication
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

  // Initialize from URL params if available
  useEffect(() => {
    const platform = searchParams.get("platform")
    if (platform) {
      setSelectedPlatform(platform)
    }
    setIsPlatformInitialized(true)
  }, [searchParams])

  // Fetch all platforms
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const result = await getAllPlatforms()
        if (result.success) {
          setPlatforms(result.platforms)
        }
      } catch (error) {
        console.error("Failed to fetch platforms:", error)
      }
    }

    fetchPlatforms()
    setIsLoading(false)
  }, [])

  // Fetch wallet balance if user is logged in
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (session?.user?.id) {
        try {
          const userId = Number.parseInt(session.user.id as string)
          const result = await getUserWallet(userId)
          if (result.success) {
            setWalletBalance(Number.parseFloat(result.wallet.balance))
          }
        } catch (error) {
          console.error("Failed to fetch wallet balance:", error)
        }
      }
    }

    if (session?.user) {
      fetchWalletBalance()
    }
  }, [session])

  // Fetch services when platform changes
  useEffect(() => {
    const fetchServices = async () => {
      if (selectedPlatform) {
        setIsLoading(true)
        try {
          const result = await getServicesByPlatform(selectedPlatform)
          if (result.success) {
            setServices(result.services)

            // Set default service if available
            if (result.services.length > 0) {
              setSelectedService(result.services[0].name)
              setServicePrice(result.services[0].price)
            } else {
              setSelectedService("")
              setServicePrice(0.5)
            }
          }
        } catch (error) {
          console.error("Failed to fetch services:", error)
          setError("Failed to load services. Please try again.")
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (isPlatformInitialized) {
      fetchServices()
    }
  }, [selectedPlatform, isPlatformInitialized])

  // Calculate total when quantity or service price changes
  useEffect(() => {
    if (quantity && !isNaN(Number.parseInt(quantity)) && Number.parseInt(quantity) >= 1000) {
      setTotal((Number.parseInt(quantity) / 1000) * servicePrice)
    } else {
      setTotal(0)
    }
  }, [quantity, servicePrice])

  // Check if wallet balance is sufficient
  useEffect(() => {
    if (useWallet && walletBalance < total) {
      setInsufficientBalance(true)
    } else {
      setInsufficientBalance(false)
    }
  }, [useWallet, walletBalance, total])

  // Handle platform change
  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value)
    setSocialLink("")
    setError(null)
  }

  // Handle service change
  const handleServiceChange = (value: string) => {
    setSelectedService(value)

    // Update price based on selected service
    const service = services.find((s) => s.name === value)
    if (service) {
      setServicePrice(service.price)
    }

    setError(null)
  }

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuantity(value)

    // Calculate total if value is valid
    const numValue = Number.parseInt(value)
    if (!isNaN(numValue) && numValue >= 1000) {
      setTotal((numValue / 1000) * servicePrice)
    } else {
      setTotal(0)
    }
  }

  // Handle social link change
  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSocialLink(e.target.value)
  }

  // Handle wallet checkbox change
  const handleWalletCheckboxChange = (checked: boolean) => {
    setUseWallet(checked)
  }

  // Handle buy now button
  const handleBuyNow = () => {
    if (selectedPlatform && selectedService && quantity >= 1000) {
      // Validate social link
      if (!socialLink.trim()) {
        setError("Please enter a valid social media link or username.")
        return
      }

      // Check if using wallet and has insufficient balance
      if (useWallet && walletBalance < total) {
        setError("Insufficient wallet balance. Please deposit funds or use another payment method.")
        return
      }

      const queryParams = new URLSearchParams({
        platform: selectedPlatform,
        service: selectedService,
        link: socialLink,
        quantity: quantity.toString(),
        total: total.toString(),
        price: servicePrice.toString(),
        wallet: useWallet ? "true" : "false",
      }).toString()

      router.push(`/payment?${queryParams}`)
    }
  }

  // Handle deposit button
  const handleDeposit = () => {
    router.push("/deposit")
  }

  // Get current platform icon
  const getPlatformIcon = () => {
    if (selectedPlatform && platformIcons[selectedPlatform as keyof typeof platformIcons]) {
      const { icon: Icon } = platformIcons[selectedPlatform as keyof typeof platformIcons]
      return <Icon className="h-4 w-4 mr-2" />
    }
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div className="max-w-3xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Select Your Service</h1>
        <p className="text-xl mb-8 text-muted-foreground text-center">
          Choose a platform, service, and quantity to get started.
        </p>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Service Selection</CardTitle>
            <CardDescription>Configure your social media boosting service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={selectedPlatform} onValueChange={handlePlatformChange}>
                <SelectTrigger id="platform" className="w-full">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      <div className="flex items-center">
                        {platformIcons[platform as keyof typeof platformIcons]?.icon &&
                          React.createElement(platformIcons[platform as keyof typeof platformIcons].icon, {
                            className: "h-4 w-4 mr-2",
                          })}
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Selection - Only show if platform is selected */}
            {selectedPlatform && (
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select value={selectedService} onValueChange={handleServiceChange}>
                  <SelectTrigger id="service" className="w-full">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name} - ${service.price.toFixed(2)} per 1K
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Social Link Input - Only show if platform and service are selected */}
            {selectedPlatform && selectedService && (
              <div className="space-y-2">
                <Label htmlFor="socialLink">
                  {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Link or Username
                </Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="socialLink"
                    value={socialLink}
                    onChange={handleSocialLinkChange}
                    className="pl-10"
                    placeholder={`Enter your ${selectedPlatform} link or username`}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedPlatform === "instagram" && "Example: https://instagram.com/username or just username"}
                  {selectedPlatform === "facebook" && "Example: https://facebook.com/pagename or just pagename"}
                  {selectedPlatform === "youtube" && "Example: https://youtube.com/c/channelname or video URL"}
                  {selectedPlatform === "telegram" && "Example: https://t.me/channelname or just @channelname"}
                </p>
              </div>
            )}

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1000"
                step="1000"
                value={quantity}
                onChange={handleQuantityChange}
                placeholder="Minimum 1000 required"
              />
              {quantity && Number.parseInt(quantity) < 1000 && (
                <p className="text-sm text-destructive">Minimum quantity is 1000.</p>
              )}
              <p className="text-sm text-muted-foreground">Price: ${servicePrice.toFixed(2)} per 1,000</p>
            </div>

            {/* Wallet Payment Option - Only show if user is logged in */}
            {session?.user && (
              <div className="flex items-start space-x-2">
                <Checkbox id="useWallet" checked={useWallet} onCheckedChange={handleWalletCheckboxChange} />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="useWallet"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Pay with Wallet Balance
                  </Label>
                  <p className="text-sm text-muted-foreground">Your balance: ${walletBalance.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Price Calculation */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-medium">Total Price:</span>
                </div>
                <span className="text-xl font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {insufficientBalance && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Insufficient Balance</AlertTitle>
                <AlertDescription>
                  You have no balance or insufficient funds. Please deposit first to continue.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            {insufficientBalance ? (
              <Button onClick={handleDeposit} className="w-full" size="lg">
                <Wallet className="mr-2 h-4 w-4" />
                Deposit Funds
              </Button>
            ) : (
              <Button
                onClick={handleBuyNow}
                className="w-full"
                size="lg"
                disabled={
                  !selectedPlatform ||
                  !selectedService ||
                  !socialLink ||
                  !quantity ||
                  Number.parseInt(quantity) < 1000 ||
                  (useWallet && walletBalance < total)
                }
              >
                Buy Now
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Platform Preview - Show if platform is selected */}
        {selectedPlatform && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className={`bg-gradient-to-br ${platformIcons[selectedPlatform as keyof typeof platformIcons]?.color} text-white`}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center">
                    {platformIcons[selectedPlatform as keyof typeof platformIcons]?.icon &&
                      React.createElement(platformIcons[selectedPlatform as keyof typeof platformIcons].icon, {
                        className: "h-6 w-6",
                      })}
                  </div>
                  <div>
                    <CardTitle>{selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</CardTitle>
                    <CardDescription className="text-white/70">Boost your {selectedPlatform} presence</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Our {selectedPlatform} boosting services help you grow your audience and increase engagement.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2 bg-white/10 p-2 rounded">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                      <span className="text-sm">{service.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
