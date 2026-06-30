'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import { brand, TOTAL_TABLES } from '@/lib/constants';
import { ExternalLink, Minus, Plus, Printer, QrCode, Table2 } from 'lucide-react';

const STORAGE_KEY = 'ember-grill-table-count';

export default function QRCodesPage() {
  const [tableCount, setTableCount] = useState(TOTAL_TABLES);

  // Load saved table count from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed >= 1) setTableCount(parsed);
    }
  }, []);

  function addTable() {
    const newCount = tableCount + 1;
    setTableCount(newCount);
    localStorage.setItem(STORAGE_KEY, String(newCount));
  }

  function removeTable() {
    if (tableCount <= 1) return;
    const newCount = tableCount - 1;
    setTableCount(newCount);
    localStorage.setItem(STORAGE_KEY, String(newCount));
  }

  function handlePrint() {
    window.print();
  }

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/dine-in`
      : '/dine-in';
  const tables = Array.from({ length: tableCount }, (_, index) => index + 1);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Dine-In Ordering"
        title="QR Codes"
        description="Generate table-specific QR codes that open the dine-in ordering flow with the table number prefilled."
        action={
          <Button
            onClick={handlePrint}
            className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 print:hidden"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print All
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 print:hidden">
        <AdminStatCard label="Tables" value={tableCount} icon={Table2} tone="blue" />
        <AdminStatCard label="QR Codes" value={tables.length} icon={QrCode} tone="amber" />
      </div>

      {/* Add/Remove table controls */}
      <AdminPanel className="print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Manage Tables</h3>
            <p className="text-xs text-slate-500 mt-0.5">Add or remove tables and generate QR codes instantly</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={removeTable}
              disabled={tableCount <= 1}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-bold text-slate-900 w-8 text-center">{tableCount}</span>
            <Button
              onClick={addTable}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              onClick={addTable}
              className="ml-2 rounded-2xl bg-amber text-white hover:bg-amber-light"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="Table QR Library" description="Print these as table tents or use the links for quick QA.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-3">
          {tables.map((tableNumber) => {
            const href = `${baseUrl}/${tableNumber}`;
            return (
              <div
                key={tableNumber}
                className="rounded-[1.4rem] border border-slate-100 bg-white p-5 text-center shadow-sm print:break-inside-avoid print:border-slate-300 print:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <Badge className="rounded-full bg-slate-950 text-white">
                    Table {tableNumber}
                  </Badge>
                  <a href={href} className="text-slate-400 transition hover:text-amber print:hidden">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-5 flex justify-center rounded-3xl bg-slate-50 p-5">
                  <QRCodeSVG
                    value={href}
                    size={168}
                    level="M"
                    includeMargin
                    bgColor="#FFFFFF"
                    fgColor="#0F172A"
                  />
                </div>

                <p className="mt-4 font-heading text-lg font-bold text-slate-950">
                  {brand.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">Scan to order at Table {tableNumber}</p>
                <p className="mt-3 truncate text-[11px] text-slate-300 print:hidden">{href}</p>
              </div>
            );
          })}
        </div>
      </AdminPanel>
    </div>
  );
}
