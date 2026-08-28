import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffDashboardOrders from './StaffDashboardOrders';
import StaffDashboardMenu from './StaffDashboardMenu';
import StaffDashboardQRCodes from './StaffDashboardQRCodes';
import { LayoutDashboard, Menu as MenuIcon, QrCode, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'qrcodes'>('orders');
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = localStorage.getItem('staff_auth') === 'true';
    if (!isAuth) {
      navigate('/staff/login');
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('staff_auth');
    navigate('/staff/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-amber-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-900 sticky top-0 z-20 shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <span className="text-2xl font-serif tracking-wide text-amber-500 font-semibold">TableOrder <span className="text-zinc-600 font-sans text-xs uppercase tracking-[0.2em] ml-3 font-bold">Staff</span></span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2.5 transition-all duration-300",
                  activeTab === 'orders' ? "bg-amber-600/10 text-amber-500 shadow-inner shadow-amber-500/10" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Orders</span>
              </button>
              <button 
                onClick={() => setActiveTab('menu')}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2.5 transition-all duration-300",
                  activeTab === 'menu' ? "bg-amber-600/10 text-amber-500 shadow-inner shadow-amber-500/10" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                )}
              >
                <MenuIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Menu</span>
              </button>
              <button 
                onClick={() => setActiveTab('qrcodes')}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2.5 transition-all duration-300",
                  activeTab === 'qrcodes' ? "bg-amber-600/10 text-amber-500 shadow-inner shadow-amber-500/10" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                )}
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR Codes</span>
              </button>
              <div className="w-px h-8 bg-zinc-800 mx-3"></div>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'orders' && <StaffDashboardOrders />}
        {activeTab === 'menu' && <StaffDashboardMenu />}
        {activeTab === 'qrcodes' && <StaffDashboardQRCodes />}
      </main>
    </div>
  );
}
