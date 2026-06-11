"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { cn, parseLocalDate, toLocalDateString } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  className?: string
  clearable?: boolean
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Seleccionar fecha",
  className,
  clearable = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = value ? parseLocalDate(value) : undefined
  const minDate = min ? parseLocalDate(min) : undefined
  const maxDate = max ? parseLocalDate(max) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "flex w-full h-10 justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {selected ? format(selected, "dd/MM/yyyy", { locale: es }) : <span>{placeholder}</span>}
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              className="ml-auto rounded-sm opacity-60 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  e.preventDefault()
                  onChange("")
                }
              }}
            >
              <X className="size-4" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (date) {
              onChange(toLocalDateString(date))
              setOpen(false)
            }
          }}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
