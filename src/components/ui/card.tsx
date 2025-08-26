import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

const variants = cva(
  "relative z-100 bg-background border-[0.7px] border-foreground/20 dark:border-transparent dark:bg-background/80 overflow-hidden rounded-3xl",
  {
    variants: {
      tone: {
        light: "bg-background",
        dark: "bg-background",
      },
      size: {
        sm: "h-[40lvh] overflow-hidden",
        md: "h-[56lvh] overflow-hidden",
        lg: "h-[70lvh]",
      },
    },
    defaultVariants: {
      tone: "light",
      size: "md",
    },
  },
);
type Div = ComponentProps<"div">;
interface CardProps extends Div, VariantProps<typeof variants> {}

const Card = ({ className, tone, size, ref, ...props }: CardProps) => (
  <div
    ref={ref}
    className={cn(variants({ tone, size }), className)}
    {...props}
  />
);

const CardHeader = ({ className, ref, ...props }: Div) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
);

const CardTitle = ({ className, ref, ...props }: Div) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: Div) => (
  <div className={cn("text-sm text-muted-foreground", className)} {...props} />
);

const CardContent = ({ className, ...props }: Div) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }: Div) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
