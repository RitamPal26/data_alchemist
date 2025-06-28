"use client";
import { useCallback } from "react";
import { useStore, StoreState, ValidationError } from "@/lib/store";
import { Wand2 } from "lucide-react";

interface Props {
  sheet: string;
}

type Severity = "low" | "medium" | "high";

interface FixSuggestion {
  description: string;
  action: () => void;
  severity: Severity;
}

export default function AutoFixSuggestions({ sheet }: Props) {
  const rows =
    useStore(useCallback((s: StoreState) => s.rows[sheet], [sheet])) ?? [];
  const errors: ValidationError[] =
    useStore(useCallback((s: StoreState) => s.errors[sheet], [sheet])) ?? [];
  const setRows = useStore((s) => s.setRows);
  const setErrors = useStore((s) => s.setErrors);

  const generateFixes = (): FixSuggestion[] => {
    const fixes: FixSuggestion[] = [];

    // --- FIX APPLIED HERE ---
    // A helper function to safely get the message from a mixed-type error array
    const getErrorMessage = (error: ValidationError): string => {
      return typeof error === "string" ? error : error.message;
    };

    // --- FIX 1: HIGH SEVERITY ---
    if (errors.some((e) => getErrorMessage(e).includes("Invalid JSON"))) {
      fixes.push({
        description: "Clear invalid JSON in 'AttributesJSON' fields",
        severity: "high",
        action: () => {
          const fixedRows = rows.map((row) => {
            try {
              if (row.AttributesJSON) JSON.parse(row.AttributesJSON);
              return row;
            } catch {
              return { ...row, AttributesJSON: "{}" };
            }
          });
          setRows(sheet, fixedRows);
          import("@/lib/schemas").then(({ validateClients }) =>
            setErrors(sheet, validateClients(fixedRows))
          );
        },
      });
    }

    // --- FIX 2: MEDIUM SEVERITY ---
    if (errors.some((e) => getErrorMessage(e).includes("PriorityLevel"))) {
      fixes.push({
        description:
          "Clamp out-of-range priority levels to a valid range (1-5)",
        severity: "medium",
        action: () => {
          const fixedRows = rows.map((row) => {
            const priority = parseInt(row.PriorityLevel, 10);
            if (isNaN(priority) || priority < 1 || priority > 5) {
              const clampedPriority = Math.max(1, Math.min(priority || 1, 5));
              return { ...row, PriorityLevel: clampedPriority };
            }
            return row;
          });
          setRows(sheet, fixedRows);
          import("@/lib/schemas").then(({ validateClients }) =>
            setErrors(sheet, validateClients(fixedRows))
          );
        },
      });
    }

    return fixes;
  };

  const fixes = generateFixes();

  const severityStyles: Record<Severity, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  if (fixes.length === 0) return null;

  return (
    <div className="enterprise-card my-4 bg-card border border-border p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Wand2 className="w-6 h-6 text-primary flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-foreground">
            Auto-Fix Suggestions
          </h4>
          <p className="text-sm text-muted-foreground">
            Apply these automated fixes to improve data quality.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {fixes.map((fix, index) => (
          <div
            key={index}
            className="flex justify-between items-center gap-4 p-3 bg-secondary rounded-md"
          >
            <p className="text-sm text-secondary-foreground flex-grow">
              {fix.description}
            </p>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                severityStyles[fix.severity]
              }`}
            >
              {fix.severity}
            </span>
            <button
              onClick={fix.action}
              className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:bg-primary/90 flex-shrink-0"
            >
              Apply Fix
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
