"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { seedDatabase } from "@/lib/seed-db"
import { initializeDatabase } from "@/lib/init-db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SeedPage() {
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [initResult, setInitResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [seedResult, setSeedResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleInitialize = async () => {
    setIsInitializing(true)
    try {
      const result = await initializeDatabase()
      setInitResult(result)
    } catch (error) {
      setInitResult({ success: false, error: "An unexpected error occurred" })
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      const result = await seedDatabase()
      setSeedResult(result)
    } catch (error) {
      setSeedResult({ success: false, error: "An unexpected error occurred" })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>Initialize and seed the database</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="initialize">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="initialize">Initialize Schema</TabsTrigger>
              <TabsTrigger value="seed">Seed Data</TabsTrigger>
            </TabsList>
            <TabsContent value="initialize" className="space-y-4 mt-4">
              <p>
                This will create all necessary database tables. Run this first before seeding the database with data.
              </p>

              {initResult && (
                <Alert variant={initResult.success ? "default" : "destructive"} className="mb-4">
                  {initResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{initResult.success ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{initResult.message || initResult.error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleInitialize} disabled={isInitializing} className="w-full">
                {isInitializing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isInitializing ? "Initializing..." : "Initialize Database"}
              </Button>
            </TabsContent>
            <TabsContent value="seed" className="space-y-4 mt-4">
              <p>
                This will populate the database with initial services, admin user, and settings. Use this after
                initializing the database schema.
              </p>

              {seedResult && (
                <Alert variant={seedResult.success ? "default" : "destructive"} className="mb-4">
                  {seedResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{seedResult.success ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{seedResult.message || seedResult.error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSeed} disabled={isSeeding} className="w-full">
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSeeding ? "Seeding..." : "Seed Database"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => router.push("/admin-access")} className="w-full">
            Back to Admin
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
