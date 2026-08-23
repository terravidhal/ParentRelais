"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        // Icônes portées par une pastille de couleur d'état : l'icône seule
        // en 16px passait inaperçue, et rien ne distinguait un succès d'une
        // erreur au premier regard.
        success: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
            <CircleCheckIcon className="size-4" />
          </span>
        ),
        info: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <InfoIcon className="size-4" />
          </span>
        ),
        warning: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
            <TriangleAlertIcon className="size-4" />
          </span>
        ),
        error: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive-soft text-destructive">
            <OctagonXIcon className="size-4" />
          </span>
        ),
        loading: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
          </span>
        ),
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !gap-3 !p-4 !shadow-[0_12px_32px_-12px_rgb(22_36_31_/_0.28)] !border-border",
          title: "!font-display !text-sm !font-bold !text-foreground",
          description: "!text-xs !text-muted-foreground !mt-0.5",
          actionButton: "!bg-primary !text-primary-foreground !font-semibold",
          cancelButton: "!bg-muted !text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
