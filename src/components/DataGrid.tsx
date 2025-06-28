"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useStore, StoreState } from "@/lib/store";
import {
  validateClients,
  validateTasks,
  validateWorkers,
  ValidationError,
} from "@/lib/schemas";
import { Edit3, AlertCircle } from "lucide-react";

// This interface was missing but is good practice
interface Props {
  sheet: string;
  rows?: any[];
}

// Helper to get the right validator based on sheet name
const getValidatorForSheet = (sheet: string) => {
  if (sheet.toLowerCase().includes("client")) return validateClients;
  if (sheet.toLowerCase().includes("task")) return validateTasks;
  if (sheet.toLowerCase().includes("worker")) return validateWorkers;
  return () => []; // Default to no validation if no match
};

export default function DataGrid({ sheet, rows: propRows }: Props) {
  // --- FIX: SELECT STATE INDIVIDUALLY FOR STABILITY ---
  // Each of these selectors will only trigger a re-render if its specific
  // slice of state changes. This is the key to preventing the loop.
  const storeRows =
    useStore(useCallback((s: StoreState) => s.rows[sheet], [sheet])) ?? [];
  const errors =
    useStore(useCallback((s: StoreState) => s.errors[sheet], [sheet])) ?? [];
  const setRows = useStore((s) => s.setRows);
  const setErrors = useStore((s) => s.setErrors);

  const data = propRows || storeRows;

  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);

  const getCellError = (
    rowIndex: number,
    columnId: string
  ): ValidationError | undefined => {
    return errors.find(
      (e) =>
        e.rowIndex === rowIndex &&
        e.column.toLowerCase() === columnId.toLowerCase()
    );
  };

  const columns: ColumnDef<any>[] = useMemo(
    () =>
      Object.keys(data[0] ?? {}).map((key) => ({
        accessorKey: key,
        header: () => <span className="font-semibold">{key}</span>,
        cell: ({ getValue, row, column }) => {
          const isEditing =
            editingCell?.rowIndex === row.index &&
            editingCell?.columnId === column.id;
          const initialValue = getValue<string>() ?? "";
          const [value, setValue] = useState(initialValue);
          const cellError = getCellError(row.index, column.id);

          const handleUpdate = () => {
            setEditingCell(null);
            if (value === initialValue) return;

            const updatedRows = data.map((r, index) =>
              index === row.index ? { ...r, [column.id]: value } : r
            );

            const validator = getValidatorForSheet(sheet);
            setRows(sheet, updatedRows);
            setErrors(sheet, validator(updatedRows));
          };

          if (isEditing) {
            return (
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleUpdate}
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                autoFocus
                className="w-full bg-transparent p-0 m-0 outline-none"
              />
            );
          }

          return (
            <div
              className="flex items-center justify-between w-full h-full cursor-pointer group-hover:bg-primary/5 rounded-md px-2 -mx-2"
              onClick={() => {
                setValue(initialValue);
                setEditingCell({ rowIndex: row.index, columnId: column.id });
              }}
            >
              <span className="truncate">{initialValue}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                {cellError ? (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                ) : (
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          );
        },
      })),
    [data, editingCell, errors, sheet, setRows, setErrors]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="enterprise-card overflow-hidden border border-border rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="table-modern w-full text-sm">
          <thead className="bg-secondary">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3 text-left">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border group">
                {row.getVisibleCells().map((cell) => {
                  const cellError = getCellError(
                    cell.row.index,
                    cell.column.id
                  );
                  const isEditing =
                    editingCell?.rowIndex === cell.row.index &&
                    editingCell?.columnId === cell.column.id;

                  const cellBgClass = isEditing
                    ? "bg-accent"
                    : cellError
                      ? "bg-red-50"
                      : "bg-green-50";

                  return (
                    <td
                      key={cell.id}
                      className={`px-2 py-1 transition-colors ${cellBgClass}`}
                      title={cellError?.message}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-secondary border-t border-border">
              <td
                colSpan={columns.length}
                className="px-4 py-2 text-muted-foreground font-medium"
              >
                Total rows: {data.length.toLocaleString()} – Issues:{" "}
                {errors.length.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
