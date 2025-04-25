"use client"

import type React from "react"

import { useState } from "react"
import { Star, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { submitTestimonial } from "@/lib/actions"

interface TestimonialFormProps {
  onSuccess?: () => void
}

export default function TestimonialForm({ onSuccess }: TestimonialFormProps) {
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate form
      if (!name || !title || !content) {
        setError("Please fill in all required fields.")
        setIsSubmitting(false)
        return
      }

      const result = await submitTestimonial({
        name,
        title,
        rating,
        content,
        approved: false,
        avatar: null,
        createdAt: new Date().toISOString(),
      })

      if (result.success) {
        setSuccess(true)
        // Reset form
        setName("")
        setTitle("")
        setRating(5)
        setContent("")

        // Call onSuccess callback after a delay
        setTimeout(() => {
          if (onSuccess) onSuccess()
        }, 3000)
      } else {
        setError(result.error || "Failed to submit testimonial. Please try again.")
      }
    } catch (err) {
      setError("An error occurred while submitting your testimonial. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Experience</CardTitle>
        <CardDescription>Let others know about your experience with our services</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <Alert className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-500 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Thank you for your feedback!</AlertTitle>
            <AlertDescription>
              Your testimonial has been submitted and will be reviewed by our team before being published.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Your Title/Profession</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Instagram Influencer"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating ? "fill-yellow-500 text-yellow-500" : "fill-gray-300 text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Your Experience</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your experience with our services..."
                rows={4}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Testimonial"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
