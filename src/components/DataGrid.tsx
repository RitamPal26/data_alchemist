"use client";
import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useStore } from "@/lib/store";
import { validateClients } from "@/lib/schemas";

interface Props {
  sheet: string;
  rows?: any[];
}

export default function DataGrid({ sheet, rows: propRows }: Props) {
  const storeRows = useStore((s) => s.rows[sheet]) ?? [];
  const rows = propRows || storeRows;
  const setRows = useStore((s) => s.setRows);
  const setErrors = useStore((s) => s.setErrors);

  // ADD THIS FUNCTION - it was missing!
  const getCellErrorClass = (rowIndex: number, columnId: string) => {
    const errors = useStore((s) => s.errors[sheet]) ?? [];
    const hasError = errors.some(
      (error) =>
        error.includes(`Row ${rowIndex + 1}`) &&
        (error.toLowerCase().includes(columnId.toLowerCase()) ||
          (columnId === "PriorityLevel" && error.includes("PriorityLevel")))
    );
    return hasError ? "bg-red-100 border-red-300" : "";
  };

  const columns: ColumnDef<any>[] = Object.keys(rows[0] ?? {}).map((key) => ({
    header: key,
    accessorKey: key,
    cell: ({ getValue, row, column, table }) => {
      const initialValue = getValue() as string;
      const [value, setValue] = useState(initialValue);
      const errorClass = getCellErrorClass(row.index, column.id); // Now this will work!

      const onBlur = () => {
        const updatedRows = [...table.options.data];
        updatedRows[row.index] = {
          ...updatedRows[row.index],
          [column.id]: value,
        };
        setRows(sheet, updatedRows);
        setErrors(sheet, validateClients(updatedRows));
      };

      return (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          className={`w-full border-none bg-transparent ${errorClass}`}
        />
      );
    },
  }));

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="min-w-full border">
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((h) => (
              <th key={h.id} className="border px-2 py-1 bg-gray-100">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((r) => (
          <tr key={r.id}>
            {r.getVisibleCells().map((c) => (
              <td key={c.id} className="border px-2 py-1">
                {flexRender(c.column.columnDef.cell, c.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
