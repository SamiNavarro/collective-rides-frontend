"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { LoginForm } from "./login-form"
import { SignupForm } from "./signup-form"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: "login" | "signup"
}

export function AuthDialog({ isOpen, onClose, initialMode = "login" }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>{mode === "login" ? "Sign In" : "Sign Up"}</DialogTitle>
        </VisuallyHidden>
        {mode === "login" ? (
          <LoginForm onToggleMode={toggleMode} onClose={onClose} />
        ) : (
          <SignupForm onToggleMode={toggleMode} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
