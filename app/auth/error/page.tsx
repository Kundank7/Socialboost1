"use client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthError() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "default"

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "AccessDenied":
        return "Access denied. You may not have permission to sign in."
      case "Configuration":
        return "There is a problem with the server configuration."
      case "Verification":
        return "The verification link may have expired or already been used."
      case "OAuthSignin":
        return "Error in the OAuth sign-in process. Please try again."
      case "OAuthCallback":
        return "Error in the OAuth callback process. Please try again."
      case "OAuthCreateAccount":
        return "Error creating your account. Please try again."
      case "EmailCreateAccount":
        return "Error creating your account. Please try again."
      case "Callback":
        return "Error during the authentication callback. Please try again."
      case "OAuthAccountNotLinked":
        return "This email is already associated with another account."
      case "EmailSignin":
        return "Error sending the sign-in email. Please try again."
      case "CredentialsSignin":
        return "Invalid credentials. Please check your username and password."
      case "SessionRequired":
        return "You must be signed in to access this page."
      default:
        return "An unexpected error occurred during authentication. Please try again."
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border-destructive">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
            <CardDescription>{getErrorMessage(error)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Please try signing in again or contact support if the problem persists.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button asChild variant="outline">
              <Link href="/">Return Home</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signin">Try Again</Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
