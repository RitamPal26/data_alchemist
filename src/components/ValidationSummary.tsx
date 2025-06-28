// Update components/ValidationSummary.tsx
"use client";
import { useStore } from "@/lib/store";

export default function ValidationSummary({ sheet }: { sheet: string }) {
  const errs = useStore((s) => s.errors[sheet]) ?? [];
  if (!errs.length) {
    return (
      <div className="my-4 bg-green-100 border border-green-400 p-3 rounded">
        <h4 className="font-semibold text-green-800">
          ✅ All validations passed!
        </h4>
      </div>
    );
  }

  // Group errors by type
  const errorGroups = errs.reduce((groups: Record<string, string[]>, error) => {
    let category = "Other";
    if (error.includes("Duplicate")) category = "Duplicate Records";
    if (error.includes("Invalid JSON")) category = "JSON Format Issues";
    if (error.includes("TaskID format")) category = "Invalid Task References";
    if (error.includes("PriorityLevel")) category = "Priority Level Issues";
    if (error.includes("required")) category = "Missing Required Fields";

    if (!groups[category]) groups[category] = [];
    groups[category].push(error);
    return groups;
  }, {});

  return (
    <div className="my-4 bg-red-50 border border-red-200 p-4 rounded">
      <h4 className="font-semibold mb-3 text-red-800">
        ⚠️ {errs.length} Validation Issues Found
      </h4>

      {Object.entries(errorGroups).map(([category, errors]) => (
        <div key={category} className="mb-3">
          <h5 className="font-medium text-red-700 mb-1">
            {category} ({errors.length})
          </h5>
          <ul className="list-disc list-inside text-sm text-red-600 ml-4">
            {errors.slice(0, 3).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
            {errors.length > 3 && (
              <li className="text-gray-500">
                ... and {errors.length - 3} more
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
