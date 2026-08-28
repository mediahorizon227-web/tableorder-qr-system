import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';

export default function StaffDashboardQRCodes() {
  const baseUrl = 'https://tableorder.ai.studio';
  const tables = Array.from({ length: 12 }, (_, i) => i + 1);

  const downloadQR = (tableNumber: number) => {
    const canvas = document.getElementById(`qr-code-table-${tableNumber}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `table-${tableNumber}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif text-zinc-100 mb-2">Table QR Codes</h2>
          <p className="text-zinc-400">Download and print QR codes for your tables.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {tables.map(table => {
          const url = `${baseUrl}/order?table=${table}`;
          return (
            <div key={table} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center gap-4 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-900/10 group">
              <div className="bg-white p-3 rounded-xl shadow-inner group-hover:scale-105 transition-transform duration-300">
                <QRCodeCanvas 
                  id={`qr-code-table-${table}`}
                  value={url} 
                  size={120}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="text-center w-full">
                <p className="text-lg font-bold text-zinc-100 mb-3">Table {table}</p>
                <button 
                  onClick={() => downloadQR(table)}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl py-2 px-3 text-sm font-semibold transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
