import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter, Edit, Trash2 } from "lucide-react";
export interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  addLabel?: string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  title,
  onAdd,
  onEdit,
  onDelete,
  addLabel = "Add Item",
  isLoading = false,
  emptyState,
}: DataTableProps<T>) {
  const getCellValue = (item: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell(item);
    }
    
    const value = item[column.key as keyof T];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    return String(value || "");
  };
  const defaultEmptyState = (
    <div className="text-center py-8">
      <p className="text-gray-500">No data available</p>
    </div>
  );
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="page-section__title sm:mb-0">{title}</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex min-h-[44px]">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            {onAdd && (
              <Button onClick={onAdd} size="sm" className="flex-1 sm:flex-none min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />
                {addLabel}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
        ) : data.length === 0 ? (
          emptyState || defaultEmptyState
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block table-scroll overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column, index) => (
                      <TableHead key={index} className="min-w-[120px]">{column.header}</TableHead>
                    ))}
                    {(onEdit || onDelete) && <TableHead className="min-w-[120px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data && Array.isArray(data) && data.map((item) => (
                    <TableRow key={item.id}>
                      {columns.map((column, index) => (
                        <TableCell key={index} className="min-w-[120px]">
                          {getCellValue(item, column)}
                        </TableCell>
                      ))}
                      {(onEdit || onDelete) && (
                        <TableCell className="min-w-[120px]">
                          <div className="flex items-center gap-2">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                className="min-h-[44px] min-w-[44px]"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {onDelete && (
                                onClick={() => onDelete(item)}
                                <Trash2 className="w-4 h-4" />
                          </div>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {data && Array.isArray(data) && data.map((item) => (
                <Card key={item.id} className="p-4 border border-gray-200">
                  <div className="space-y-3">
                      <div key={index} className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-gray-600">{column.header}</span>
                        <div className="text-sm text-gray-900">
                        </div>
                      </div>
                    {(onEdit || onDelete) && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="flex-1 min-h-[44px]"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                            onClick={() => onDelete(item)}
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                    )}
                  </div>
                </Card>
              ))}
          </>
        )}
      </CardContent>
    </Card>
