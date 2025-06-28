"use client";
import { useCallback, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useStore } from "@/lib/store";
import { validateClients, validateTasks, validateWorkers } from "@/lib/schemas";
import { fileExt } from "@/lib/utils";

// --- SVG Icon Components for a cleaner look ---
const UploadIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V16a4 4 0 01-4 4H7z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 11v6m0 0l-3-3m3 3l3-3"
    />
  </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

export default function FileUploader() {
  const { setRows, setErrors } = useStore();
  const [busy, setBusy] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  // NEW: State to track drag-over for visual feedback
  const [isDragging, setIsDragging] = useState(false);

  const detectFileType = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.includes("client")) return "clients";
    if (lower.includes("worker")) return "workers";
    if (lower.includes("task")) return "tasks";
    return "unknown";
  };

  const getValidator = (fileType: string) => {
    switch (fileType) {
      case "clients":
        return validateClients;
      case "workers":
        return validateWorkers;
      case "tasks":
        return validateTasks;
      default:
        return validateClients;
    }
  };

  const parse = useCallback(
    async (file: File) => {
      setBusy(true);
      const ext = fileExt(file.name);
      const fileType = detectFileType(file.name);

      let rows: any[] = [];

      try {
        if (ext === "csv") {
          rows = await new Promise<any[]>((resolve) => {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (res) => resolve(res.data as any[]),
            });
          });
        } else {
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf, { type: "buffer" });
          rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]], {
            defval: "",
          });
        }

        const validator = getValidator(fileType);
        // --- LOGIC UNCHANGED ---
        setRows(file.name, rows);
        setErrors(file.name, validator(rows));
        // --- END UNCHANGED LOGIC ---

        setUploadedFiles((prev) => [...new Set([...prev, file.name])]);
      } catch (error) {
        console.error("Failed to parse file:", file.name, error);
        // Optionally, add state to show an error message for this file
      } finally {
        setBusy(false);
      }
    },
    [setRows, setErrors]
  );

  // --- NEW: Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!busy) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (busy) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => parse(file));
    }
  };

  return (
    <div className="my-8">
      <input
        id="file-upload"
        type="file"
        accept=".csv,.xlsx,.xls"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            Array.from(e.target.files).forEach((file) => parse(file));
          }
        }}
        disabled={busy}
      />

      {/* --- NEW: Styled Drag and Drop Area --- */}
      <label
        htmlFor="file-upload"
        className={`enterprise-card drag-zone flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ease-in-out
          ${isDragging ? "border-primary bg-accent" : "border-border bg-card"}
          ${busy ? "cursor-not-allowed opacity-60" : "hover:border-primary/80"}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {busy ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="font-semibold text-primary">Processing files...</p>
            <p className="text-sm text-muted-foreground">Please wait.</p>
          </>
        ) : (
          <>
            <UploadIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="font-bold text-lg text-foreground">
              Click to upload or{" "}
              <span className="text-primary">drag and drop</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              CSV, XLSX, or XLS files
            </p>
          </>
        )}
      </label>

      {/* --- NEW: Styled Uploaded Files List --- */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-foreground mb-2">
            Uploaded Files
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((fileName) => (
              <div
                key={fileName}
                className="flex items-center justify-between p-3 bg-secondary rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <FileIcon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-secondary-foreground">
                    {fileName}
                  </span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Success
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
