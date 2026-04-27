import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-11 items-center justify-center rounded-xl border border-neon-blue/40 bg-[hsl(var(--neon-card))] p-1 text-slate-300 gap-1 overflow-hidden shadow-[0_0_18px_-10px_hsl(var(--neon-blue))]",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 xs:py-2.5 text-xs xs:text-sm md:text-sm font-semibold transition-all duration-300 min-h-[40px] text-slate-400 hover:bg-neon-blue/10 hover:text-neon-blue data-[state=active]:border data-[state=active]:border-neon-blue/70 data-[state=active]:bg-neon-blue/15 data-[state=active]:text-neon-blue data-[state=active]:shadow-[0_0_16px_-6px_hsl(var(--neon-blue)/0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
