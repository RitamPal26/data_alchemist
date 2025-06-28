// Create components/AutoFixSuggestions.tsx
"use client";
import { useStore } from "@/lib/store";

interface Props {
  sheet: string;
}

export default function AutoFixSuggestions({ sheet }: Props) {
  const rows = useStore((s) => s.rows[sheet]) ?? [];
  const errors = useStore((s) => s.errors[sheet]) ?? [];
  const setRows = useStore((s) => s.setRows);
  const setErrors = useStore((s) => s.setErrors);

  const generateFixes = () => {
    const fixes: Array<{
      description: string;
      action: () => void;
    }> = [];

    // Fix priority levels out of range
    if (errors.some((e) => e.includes("PriorityLevel"))) {
      fixes.push({
        description: "Set all invalid priority levels to 3 (medium)",
        action: () => {
          const fixedRows = rows.map((row) => ({
            ...row,
            PriorityLevel:
              isNaN(parseInt(row.PriorityLevel)) ||
              parseInt(row.PriorityLevel) < 1 ||
              parseInt(row.PriorityLevel) > 5
                ? 3
                : row.PriorityLevel,
          }));
          setRows(sheet, fixedRows);
          // Re-validate after fix
          import("@/lib/schemas").then(({ validateClients }) => {
            setErrors(sheet, validateClients(fixedRows));
          });
        },
      });
    }

    // Fix invalid JSON
    if (errors.some((e) => e.includes("Invalid JSON"))) {
      fixes.push({
        description: "Clear invalid JSON in AttributesJSON fields",
        action: () => {
          const fixedRows = rows.map((row) => {
            let attributesJSON = row.AttributesJSON;
            if (attributesJSON) {
              try {
                JSON.parse(attributesJSON);
              } catch {
                attributesJSON = "{}"; // Replace with empty object
              }
            }
            return { ...row, AttributesJSON: attributesJSON };
          });
          setRows(sheet, fixedRows);
          import("@/lib/schemas").then(({ validateClients }) => {
            setErrors(sheet, validateClients(fixedRows));
          });
        },
      });
    }

    return fixes;
  };

  const fixes = generateFixes();

  if (fixes.length === 0) return null;

  return (
    <div className="my-4 bg-blue-50 border border-blue-200 p-4 rounded">
      <h4 className="font-semibold mb-3 text-blue-800">
        🤖 AI Auto-Fix Suggestions
      </h4>
      <div className="space-y-2">
        {fixes.map((fix, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-blue-700">{fix.description}</span>
            <button
              onClick={fix.action}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              Apply Fix
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
