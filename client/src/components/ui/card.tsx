import * as React from "react"

import { cn } from "@/lib/utils"
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"
const CardHeader = React.forwardRef<
    className={cn("flex flex-col space-y-1.5 p-6", className)}
CardHeader.displayName = "CardHeader"
const CardTitle = React.forwardRef<
      "text-2xl font-semibold leading-none tracking-tight",
CardTitle.displayName = "CardTitle"
const CardDescription = React.forwardRef<
    className={cn("text-sm text-muted-foreground", className)}
CardDescription.displayName = "CardDescription"
const CardContent = React.forwardRef<
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
CardContent.displayName = "CardContent"
const CardFooter = React.forwardRef<
    className={cn("flex items-center p-6 pt-0", className)}
CardFooter.displayName = "CardFooter"
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
