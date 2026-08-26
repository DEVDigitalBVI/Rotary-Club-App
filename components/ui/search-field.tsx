"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchField({
  value,
  onValueChange,
  className,
  inputClassName,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  inputClassName?: string;
}) {
  return (
    <div className={cn("relative", className)} role="search">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn("appearance-none pl-10 pr-11 [&::-webkit-search-cancel-button]:hidden", inputClassName)}
        {...props}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear search"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => onValueChange("")}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
