// Create components/SearchBar.tsx
"use client";
import { useState } from "react";

interface Props {
  onFilter: (filteredRows: any[]) => void;
  allRows: any[];
  sheet: string;
}

export default function SearchBar({ onFilter, allRows, sheet }: Props) {
  const [query, setQuery] = useState("");

  const parseNaturalLanguage = (q: string, rows: any[]) => {
    const lowerQuery = q.toLowerCase();

    // Natural language patterns for different data types
    if (sheet.includes("client")) {
      if (lowerQuery.includes("high priority")) {
        return rows.filter((row) => parseInt(row.PriorityLevel) >= 4);
      }
      if (lowerQuery.includes("low priority")) {
        return rows.filter((row) => parseInt(row.PriorityLevel) <= 2);
      }
      if (lowerQuery.includes("group a")) {
        return rows.filter((row) => row.GroupTag === "GroupA");
      }
    }

    if (sheet.includes("task")) {
      if (lowerQuery.includes("duration > 1")) {
        return rows.filter((row) => parseInt(row.Duration) > 1);
      }
      if (lowerQuery.includes("phase 2")) {
        return rows.filter((row) => row.PreferredPhases?.includes("2"));
      }
    }

    // General text search
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(lowerQuery)
      )
    );
  };

  const handleSearch = (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      onFilter(allRows);
      return;
    }

    const filtered = parseNaturalLanguage(q, allRows);
    onFilter(filtered);
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder={`🔍 Try: "high priority clients", "duration > 1", or any text...`}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
      />
      {query && (
        <div className="mt-1 text-xs text-gray-500">
          Showing results for: &quot{query}&quot
        </div>
      )}
    </div>
  );
}
