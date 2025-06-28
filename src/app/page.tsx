"use client";

import { useState, useEffect } from "react";
import FileUploader from "@/components/FileUploader";
import DataGrid from "@/components/DataGrid";
import ValidationSummary from "@/components/ValidationSummary";
import RuleBuilder from "@/components/RuleBuilder";
import Priorities from "@/components/Priorities";
import { useStore } from "@/lib/store";
import { saveAs } from "file-saver";
import SearchBar from "@/components/SearchBar";
import AutoFixSuggestions from "@/components/AutoFixSuggestions";
import ProgressDashboard from "@/components/ProgressDashboard";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [filteredRows, setFilteredRows] = useState<Record<string, any[]>>({});

  // ✅ ALWAYS call useStore - never conditionally
  const rows = useStore((s) => s.rows);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExport = async () => {
    try {
      const { rows, rules, weights } = useStore.getState();
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, rules, weights }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      saveAs(blob, "cleaned_scheduler_data.zip");
    } catch (error) {
      alert("Export failed. Please try again.");
    }
  };

  // ✅ Show loading only in the JSX, not by skipping hooks
  if (!mounted) {
    return (
      <main className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <header className="enterprise-header">
        <h1 className="text-2xl font-bold mb-4">Scheduler Data Cleaner</h1>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="text-2xl font-bold text-blue-600">{Object.keys(rows).length}</div>
            <div className="text-sm text-gray-600">Files</div>
          </div>
          
          <div className="stat-card">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(rows).reduce((total, sheetRows) => total + (sheetRows?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Records</div>
          </div>
          
          <div className="stat-card">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(useStore((s) => s.errors)).reduce((total, sheetErrors) => total + (sheetErrors?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Issues</div>
          </div>
          
          <div className="stat-card">
            <div className="text-2xl font-bold text-emerald-600">
              {Object.values(rows).reduce((total, sheetRows) => total + (sheetRows?.length || 0), 0) - 
               Object.values(useStore((s) => s.errors)).reduce((total, sheetErrors) => total + (sheetErrors?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Valid</div>
          </div>
        </div>
      </header>

      <FileUploader />

      <ProgressDashboard />

      {Object.keys(rows).map((sheet) => (
        <section key={sheet} className="my-8">
          <h2 className="text-xl font-semibold mb-2">{sheet}</h2>

          <SearchBar
            onFilter={(filtered) =>
              setFilteredRows({ ...filteredRows, [sheet]: filtered })
            }
            allRows={rows[sheet] || []}
            sheet={sheet}
          />

          <DataGrid sheet={sheet} rows={filteredRows[sheet] || rows[sheet]} />

          <ValidationSummary sheet={sheet} />
          <AutoFixSuggestions sheet={sheet} />
        </section>
      ))}

      <RuleBuilder />
      <Priorities />

      <div className="mt-8">
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium"
          disabled={Object.keys(rows).length === 0}
        >
          📥 Export Cleaned Data
        </button>
      </div>
    </main>
  );
}
