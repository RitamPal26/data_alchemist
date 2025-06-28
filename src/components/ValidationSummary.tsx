"use client";
import React, { useState, useCallback } from "react";
import { useStore, StoreState } from "@/lib/store";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

export default function ValidationSummary({ sheet }: { sheet: string }) {
  const errs =
    useStore(useCallback((s: StoreState) => s.errors[sheet], [sheet])) ?? [];

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (errs.length === 0) {
    return (
      <div className="enterprise-card flex items-center gap-3 my-4 bg-green-50 border border-green-200 p-4 rounded-lg">
        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-green-800">
            All validations passed
          </h4>
          <p className="text-sm text-green-700">
            This file is ready for export.
          </p>
        </div>
      </div>
    );
  }

  // --- FIX APPLIED HERE ---
  const errorGroups = errs.reduce((groups: Record<string, string[]>, error) => {
    // 1. Determine the message text, regardless of error format
    const currentMessage = typeof error === "string" ? error : error.message;

    // 2. Safely categorize based on the guaranteed string
    let category = "General Errors";
    if (currentMessage?.includes("Duplicate")) category = "Duplicate Records";
    else if (currentMessage?.includes("Invalid JSON"))
      category = "JSON Format Issues";
    else if (currentMessage?.includes("TaskID format"))
      category = "Invalid Task References";
    else if (currentMessage?.includes("PriorityLevel"))
      category = "Priority Level Issues";
    else if (currentMessage?.includes("required"))
      category = "Missing Required Fields";

    if (!groups[category]) groups[category] = [];
    groups[category].push(currentMessage);
    return groups;
  }, {});

  return (
    <div className="enterprise-card my-4 bg-card border border-border p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-foreground">
            {errs.length} Validation Issues Found
          </h4>
          <p className="text-sm text-muted-foreground">
            Expand a category to see details.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(errorGroups).map(([category, errors]) => {
          const isExpanded = expandedCategories.has(category);
          return (
            <div
              key={category}
              className="bg-secondary border border-border rounded-md"
            >
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 text-left font-medium text-secondary-foreground hover:bg-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  {category}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                  {errors.length}
                </span>
              </button>

              {isExpanded && (
                <div className="p-3 border-t border-border">
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {errors.length > 5 && (
                      <li className="text-xs italic">
                        ...and {errors.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
