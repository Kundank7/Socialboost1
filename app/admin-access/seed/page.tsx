"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { seedDatabase } from "@/lib/seed-db"

export default function SeedPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleSeed = async () => {
    setIsLoading(true)
    try {
      const result = await seedDatabase()
      setResult(result)
    } catch (error) {
      setResult({ success: false, error: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Database Seed</CardTitle>
          <CardDescription>Initialize the database with sample data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This will populate the database with initial services, admin user, and settings. Use this only once when
            setting up the application.
          </p>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{result.message || result.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin-access")}>
            Back to Admin
          </Button>
          <Button onClick={handleSeed} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Seeding..." : "Seed Database"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
