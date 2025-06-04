import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(0 0% 100%)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      position="top-center"
      toastOptions={{
        style: {
          zIndex: 50,
        },
        classNames: {
          toast: 'group-[.toaster]:bg-white group-[.toaster]:text-foreground',
        },
      }}
      gap={8}
      visibleToasts={1}
      {...props}
    />
  )
}

  
export { Toaster }
