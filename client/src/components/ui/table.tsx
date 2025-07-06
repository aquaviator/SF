import * as React from "react"

import { cn } from "@/lib/utils"
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
TableHeader.displayName = "TableHeader"
const TableBody = React.forwardRef<
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
TableBody.displayName = "TableBody"
const TableFooter = React.forwardRef<
  <tfoot
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
TableFooter.displayName = "TableFooter"
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
  <tr
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
TableRow.displayName = "TableRow"
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
  <th
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
TableHead.displayName = "TableHead"
const TableCell = React.forwardRef<
  React.TdHTMLAttributes<HTMLTableCellElement>
  <td
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
TableCell.displayName = "TableCell"
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
  <caption
    className={cn("mt-4 text-sm text-muted-foreground", className)}
TableCaption.displayName = "TableCaption"
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
