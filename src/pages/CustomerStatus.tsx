import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderStatus } from '../types';
import { Clock, ChefHat, CheckCircle2, Utensils, Receipt, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const STATUS_STEPS: OrderStatus[] = ['New', 'Preparing', 'Ready', 'Served'];

export default function CustomerStatus() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="animate-pulse bg-zinc-900 h-64 w-full max-w-md rounded-3xl border border-zinc-800"></div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-zinc-950 pb-12 text-zinc-100">
      {/* Header */}
      <div className="bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-900/80 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center gap-3 max-w-md mx-auto">
          <button 
            onClick={() => navigate(`/order?table=${order.tableNumber}`)} 
            className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-full transition-colors active:scale-95"
            aria-label="Back to Menu"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-serif font-medium tracking-wide text-zinc-100">Order Status</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Table {order.tableNumber}</span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full" />
              <span className="text-[11px] text-zinc-500">Live Kitchen Tracker</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 mt-8">
        
        {/* Status Tracker */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl shadow-sm shadow-black/40 border border-zinc-800/80 mb-6">
          <div className="relative">
            {/* Track Line */}
            <div className="absolute left-[22px] top-6 bottom-6 w-[2px] bg-zinc-800/80" />
            
            {/* Active Track Line */}
            <motion.div 
              className="absolute left-[22px] top-6 w-[2px] bg-amber-500"
              initial={{ height: 0 }}
              animate={{ height: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />

            <div className="space-y-8 relative">
              <StatusStep 
                icon={<Clock className="w-4 h-4" />}
                title="Order Placed"
                subtitle="We've received your order"
                isActive={currentStepIndex >= 0}
                isCurrent={currentStepIndex === 0}
              />
              <StatusStep 
                icon={<ChefHat className="w-4 h-4" />}
                title="Preparing"
                subtitle="Chefs are working their magic"
                isActive={currentStepIndex >= 1}
                isCurrent={currentStepIndex === 1}
              />
              <StatusStep 
                icon={<CheckCircle2 className="w-4 h-4" />}
                title="Ready"
                subtitle="Your food is ready to be served"
                isActive={currentStepIndex >= 2}
                isCurrent={currentStepIndex === 2}
              />
              <StatusStep 
                icon={<Utensils className="w-4 h-4" />}
                title="Served"
                subtitle="Enjoy your meal!"
                isActive={currentStepIndex >= 3}
                isCurrent={currentStepIndex === 3}
              />
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl shadow-sm shadow-black/40 border border-zinc-800/80">
          <div className="flex items-center gap-2.5 mb-5 text-zinc-400">
            <Receipt className="w-4 h-4 text-amber-400/90" />
            <h2 className="font-serif text-lg font-medium tracking-wide text-zinc-100">Receipt Summary</h2>
          </div>
          
          <ul className="space-y-3 mb-6">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex flex-col text-sm border-b border-zinc-900/60 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2.5 items-center">
                    <span className="font-semibold text-amber-400/90 text-xs">{item.quantity}x</span>
                    <span className="text-zinc-200 tracking-wide">{item.name}</span>
                  </div>
                  <span className="font-medium text-zinc-300">₹{item.price * item.quantity}</span>
                </div>
                {item.specialRequest && (
                  <div className="mt-1 ml-6">
                    <span className="inline-block px-2 py-0.5 bg-zinc-950/70 border border-zinc-800/80 text-zinc-400 text-xs rounded-md">
                      Note: {item.specialRequest}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          
          <div className="border-t border-zinc-800/80 pt-4 flex justify-between items-center">
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Total Amount</span>
            <span className="text-amber-400 text-xl font-serif font-medium">₹{order.totalPrice}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatusStep({ icon, title, subtitle, isActive, isCurrent }: { icon: React.ReactNode, title: string, subtitle: string, isActive: boolean, isCurrent: boolean }) {
  return (
    <div className={cn("flex gap-4 items-start transition-opacity duration-300", isActive ? "opacity-100" : "opacity-35")}>
      <div className={cn(
        "relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
        isActive ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/40" : "bg-zinc-900 border border-zinc-800 text-zinc-600",
        isCurrent && "ring-4 ring-amber-500/20 scale-105"
      )}>
        {icon}
      </div>
      <div className="pt-1">
        <h3 className={cn("font-serif text-base tracking-wide flex items-center gap-2", isActive ? "text-zinc-100" : "text-zinc-500")}>
          <span>{title}</span>
          {isCurrent && (title === 'Order Placed' || title === 'Preparing') && (
            <span className="text-[10px] font-sans text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-full font-medium tracking-wide">
              ~15 mins
            </span>
          )}
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}
