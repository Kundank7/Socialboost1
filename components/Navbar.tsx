"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { Menu, X, User, LogIn, LogOut, Package, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { useMobile } from "@/hooks/use-mobile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import WalletBalance from "./WalletBalance"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMobile = useMobile()
  const { data: session, status } = useSession()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleSignIn = () => {
    signIn("google")
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            SocialBoost
          </span>
        </Link>

        {isMobile ? (
          <div className="flex items-center gap-4">
            {session && <WalletBalance />}
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        ) : (
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/select" className="text-sm font-medium transition-colors hover:text-primary">
              Services
            </Link>
            <Link href="#testimonials" className="text-sm font-medium transition-colors hover:text-primary">
              Testimonials
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
              How It Works
            </Link>
            <div className="flex items-center space-x-2">
              {session && <WalletBalance />}
              <ModeToggle />

              {status === "loading" ? (
                <Button variant="ghost" size="icon" disabled>
                  <span className="h-5 w-5 animate-pulse rounded-full bg-muted"></span>
                </Button>
              ) : session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
                        <AvatarFallback>
                          {session.user?.name
                            ? session.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {session.user?.name && <p className="font-medium">{session.user.name}</p>}
                        {session.user?.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wallet" className="cursor-pointer">
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Wallet</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/track" className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleSignIn} variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}

              <Button asChild>
                <Link href="/select">Get Started</Link>
              </Button>
            </div>
          </nav>
        )}
      </div>

      {/* Mobile menu */}
      {isMobile && isMenuOpen && (
        <div className="container mx-auto px-4 pb-4 pt-2">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/select"
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="#testimonials"
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>

            {status === "loading" ? (
              <div className="flex items-center justify-center py-2">
                <span className="h-5 w-5 animate-pulse rounded-full bg-muted"></span>
              </div>
            ) : session ? (
              <>
                <div className="flex items-center space-x-2 px-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
                    <AvatarFallback>
                      {session.user?.name
                        ? session.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{session.user?.name}</span>
                    <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/wallet"
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Wallet
                </Link>
                <Link
                  href="/track"
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package className="mr-2 h-4 w-4" />
                  My Orders
                </Link>
                <Button onClick={handleSignOut} variant="outline" className="w-full justify-start">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <Button onClick={handleSignIn} variant="outline" className="w-full justify-start">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}

            <Button asChild className="w-full">
              <Link href="/select" onClick={() => setIsMenuOpen(false)}>
                Get Started
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
