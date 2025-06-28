// Create components/ProgressDashboard.tsx
"use client";
import { useStore } from "@/lib/store";

export default function ProgressDashboard() {
  const rows = useStore((s) => s.rows);
  const errors = useStore((s) => s.errors);

  const stats = Object.keys(rows).map((sheet) => {
    const rowCount = rows[sheet]?.length || 0;
    const errorCount = errors[sheet]?.length || 0;
    const validRows = rowCount - errorCount;
    const validationRate = rowCount > 0 ? (validRows / rowCount) * 100 : 0;

    return {
      sheet,
      rowCount,
      errorCount,
      validationRate: Math.max(0, validationRate),
    };
  });

  if (stats.length === 0) return null;

  return (
    <div className="my-6 bg-gray-50 p-4 rounded-lg">
      <h3 className="font-bold mb-4">📊 Data Quality Dashboard</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ sheet, rowCount, errorCount, validationRate }) => (
          <div key={sheet} className="bg-white p-3 rounded border">
            <h4 className="font-medium text-sm text-gray-700 mb-2">{sheet}</h4>
            <div className="space-y-1">
              <div className="text-lg font-bold">{rowCount} rows</div>
              <div className="text-sm text-red-600">{errorCount} errors</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${validationRate}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {validationRate.toFixed(1)}% valid
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
