'use client';
import { useStore } from '@/lib/store';
import { saveAs } from 'file-saver';

export default function ExportButton() {
  const { rows, rules, weights } = useStore();
  
  const handleExport = async () => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, rules, weights }),
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      saveAs(blob, 'cleaned_scheduler_data.zip');
    } catch (error) {
      alert('Export failed. Please try again.');
    }
  };
  
  return (
    <button 
      onClick={handleExport}
      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium"
      disabled={Object.keys(rows).length === 0}
    >
      📥 Export Cleaned Data
    </button>
  );
}
