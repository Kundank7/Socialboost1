"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Instagram,
  Facebook,
  Youtube,
  TextIcon as Telegram,
  ChevronRight,
  Users,
  ThumbsUp,
  Eye,
  CheckCircle,
  CreditCard,
  Package,
  Star,
  MessageSquare,
} from "lucide-react"
import TestimonialForm from "@/components/TestimonialForm"
import type { Testimonial } from "@/lib/types"
import { getApprovedTestimonials } from "@/lib/actions"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

export default function Home() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [showTestimonialForm, setShowTestimonialForm] = useState(false)

  // Fetch testimonials on component mount
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await getApprovedTestimonials()
        setTestimonials(data)
      } catch (error) {
        console.error("Failed to fetch testimonials:", error)
      }
    }

    fetchTestimonials()
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 -z-10" />
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible" variants={fadeIn}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Boost Your Social Media Presence
            </h1>
            <p className="text-xl mb-8 text-muted-foreground">
              Get real likes, followers, and views for your social media accounts. Enhance your online presence and grow
              your audience today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="text-lg">
                <Link href="/select">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link href="#services">
                  Explore Services <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from our wide range of social media boosting services to enhance your online presence.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Instagram */}
            <motion.div variants={fadeIn}>
              <Link href="/select?platform=instagram">
                <div className="service-card glass-card rounded-xl p-6 h-full">
                  <div className="bg-gradient-to-br from-pink-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <Instagram className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Instagram</h3>
                  <p className="text-muted-foreground mb-4">
                    Boost your Instagram presence with likes, followers, and views.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Likes</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Followers</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Views</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Facebook */}
            <motion.div variants={fadeIn}>
              <Link href="/select?platform=facebook">
                <div className="service-card glass-card rounded-xl p-6 h-full">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <Facebook className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Facebook</h3>
                  <p className="text-muted-foreground mb-4">
                    Enhance your Facebook page with likes, followers, and engagement.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Page Likes</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Followers</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Post Reach</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* YouTube */}
            <motion.div variants={fadeIn}>
              <Link href="/select?platform=youtube">
                <div className="service-card glass-card rounded-xl p-6 h-full">
                  <div className="bg-gradient-to-br from-red-500 to-red-700 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <Youtube className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">YouTube</h3>
                  <p className="text-muted-foreground mb-4">
                    Grow your YouTube channel with subscribers, views, and likes.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Subscribers</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Views</span>
                    </div>
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Likes</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Telegram */}
            <motion.div variants={fadeIn}>
              <Link href="/select?platform=telegram">
                <div className="service-card glass-card rounded-xl p-6 h-full">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <Telegram className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Telegram</h3>
                  <p className="text-muted-foreground mb-4">
                    Expand your Telegram channel with members and post views.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Channel Members</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Post Views</span>
                    </div>
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Reactions</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started with SocialBoost in just a few simple steps.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center" variants={fadeIn}>
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Choose a Service</h3>
              <p className="text-muted-foreground">
                Select the platform and service you need from our wide range of offerings.
              </p>
            </motion.div>

            <motion.div className="text-center" variants={fadeIn}>
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Make Payment</h3>
              <p className="text-muted-foreground">Complete your purchase using one of our secure payment methods.</p>
            </motion.div>

            <motion.div className="text-center" variants={fadeIn}>
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. See Results</h3>
              <p className="text-muted-foreground">
                Watch as your social media presence grows with our premium services.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Read testimonials from our satisfied customers who have experienced real growth.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {testimonials.length > 0 ? (
              testimonials.map((testimonial) => (
                <motion.div key={testimonial.id} className="testimonial-card" variants={fadeIn}>
                  <div className="flex items-center mb-4">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg?height=50&width=50"}
                      alt={testimonial.name}
                      width={50}
                      height={50}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < testimonial.rating ? "fill-yellow-500 text-yellow-500" : "fill-gray-300 text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground">{testimonial.content}</p>
                </motion.div>
              ))
            ) : (
              // Fallback testimonials if none are in the database yet
              <>
                <motion.div className="testimonial-card" variants={fadeIn}>
                  <div className="flex items-center mb-4">
                    <Image
                      src="/placeholder.svg?height=50&width=50"
                      alt="Sarah Johnson"
                      width={50}
                      height={50}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">Sarah Johnson</h4>
                      <p className="text-sm text-muted-foreground">Instagram Influencer</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    "SocialBoost helped me grow my Instagram following by over 10,000 in just one month. The engagement
                    is real and my reach has increased dramatically!"
                  </p>
                </motion.div>

                <motion.div className="testimonial-card" variants={fadeIn}>
                  <div className="flex items-center mb-4">
                    <Image
                      src="/placeholder.svg?height=50&width=50"
                      alt="Michael Chen"
                      width={50}
                      height={50}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">Michael Chen</h4>
                      <p className="text-sm text-muted-foreground">YouTube Creator</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    "I was struggling to get my YouTube channel off the ground until I found SocialBoost. Their services
                    helped me gain subscribers and views, which led to monetization!"
                  </p>
                </motion.div>

                <motion.div className="testimonial-card" variants={fadeIn}>
                  <div className="flex items-center mb-4">
                    <Image
                      src="/placeholder.svg?height=50&width=50"
                      alt="Emily Rodriguez"
                      width={50}
                      height={50}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">Emily Rodriguez</h4>
                      <p className="text-sm text-muted-foreground">Business Owner</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    "As a small business owner, social media presence is crucial. SocialBoost helped me establish
                    credibility with a strong following on Facebook and Instagram."
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>

          <div className="mt-12 text-center">
            <Button variant="outline" onClick={() => setShowTestimonialForm(!showTestimonialForm)} className="mx-auto">
              <MessageSquare className="mr-2 h-4 w-4" />
              {showTestimonialForm ? "Cancel" : "Share Your Experience"}
            </Button>

            {showTestimonialForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 max-w-md mx-auto"
              >
                <TestimonialForm onSuccess={() => setShowTestimonialForm(false)} />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/20 to-purple-500/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Boost Your Social Media?</h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Get started today and see real results in your social media growth.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="text-lg">
                <Link href="/select">Get Started Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link href="/track">Track Your Order</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
