import { NextResponse } from 'next/server';
import { useStore } from '@/lib/store';   // cannot be used server-side directly
import { Parser as Json2Csv } from 'json2csv';
import JSZip from 'jszip';

/* Because Zustand store is client-only, you would POST the rows/rules
   from the client to this route. Below is the bare-bones handler. */

export async function POST(req: Request) {
  const { rows, rules, weights } = await req.json();

  const zip = new JSZip();
  const csv = new Json2Csv();
  Object.entries(rows).forEach(([name, data]) =>
    zip.file(`${name}.csv`, csv.parse(data as any[])),
  );
  zip.file('rules.json', JSON.stringify({ rules, weights }, null, 2));

  const blob = await zip.generateAsync({ type: 'nodebuffer' });
  return new NextResponse(blob, {
    headers: { 'Content-Type': 'application/zip' },
  });
}
