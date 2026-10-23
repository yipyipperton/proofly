import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-secondary text-secondary-foreground",
      low: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      medium: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
      high: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      outline: "ring-1 ring-border text-muted-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
