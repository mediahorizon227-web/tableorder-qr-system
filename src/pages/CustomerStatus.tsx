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
      <div className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 sticky top-0 z-40">
        <div className="px-5 py-6 flex items-center gap-4 max-w-md mx-auto">
          <button onClick={() => navigate(`/order?table=${order.tableNumber}`)} className="p-2 -ml-2 bg-zinc-900 text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 rounded-full transition-colors active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-serif tracking-wide text-zinc-100">Order Status</h1>
            <p className="text-[11px] text-amber-500 font-bold uppercase tracking-widest mt-0.5">Table {order.tableNumber}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 mt-12">
        
        {/* Status Tracker */}
        <div className="bg-zinc-900/60 p-8 rounded-3xl shadow-2xl shadow-black/40 border border-zinc-800/60 mb-8">
          <div className="relative">
            {/* Track Line */}
            <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-zinc-800/80" />
            
            {/* Active Track Line */}
            <motion.div 
              className="absolute left-6 top-6 w-[2px] bg-amber-500"
              initial={{ height: 0 }}
              animate={{ height: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />

            <div className="space-y-10 relative">
              <StatusStep 
                icon={<Clock className="w-5 h-5" />}
                title="Order Placed"
                subtitle="We've received your order"
                isActive={currentStepIndex >= 0}
                isCurrent={currentStepIndex === 0}
              />
              <StatusStep 
                icon={<ChefHat className="w-5 h-5" />}
                title="Preparing"
                subtitle="Chefs are working their magic"
                isActive={currentStepIndex >= 1}
                isCurrent={currentStepIndex === 1}
              />
              <StatusStep 
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="Ready"
                subtitle="Your food is ready to be served"
                isActive={currentStepIndex >= 2}
                isCurrent={currentStepIndex === 2}
              />
              <StatusStep 
                icon={<Utensils className="w-5 h-5" />}
                title="Served"
                subtitle="Enjoy your meal!"
                isActive={currentStepIndex >= 3}
                isCurrent={currentStepIndex === 3}
              />
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-zinc-900/60 p-8 rounded-3xl shadow-xl shadow-black/20 border border-zinc-800/60">
          <div className="flex items-center gap-3 mb-6 text-amber-500">
            <Receipt className="w-5 h-5" />
            <h2 className="font-serif text-xl tracking-wide text-zinc-100">Receipt</h2>
          </div>
          
          <ul className="space-y-4 mb-8">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <div className="flex gap-4 items-center">
                  <span className="font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-xs">{item.quantity}x</span>
                  <span className="text-zinc-200 tracking-wide">{item.name}</span>
                </div>
                <span className="font-semibold text-zinc-300">₹{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
          
          <div className="border-t border-zinc-800/80 pt-5 flex justify-between items-center text-lg font-bold">
            <span className="tracking-wide">Total</span>
            <span className="text-amber-500 text-2xl font-serif">₹{order.totalPrice}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatusStep({ icon, title, subtitle, isActive, isCurrent }: { icon: React.ReactNode, title: string, subtitle: string, isActive: boolean, isCurrent: boolean }) {
  return (
    <div className={cn("flex gap-5 items-start transition-opacity duration-500", isActive ? "opacity-100" : "opacity-30")}>
      <div className={cn(
        "relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
        isActive ? "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-900/40" : "bg-zinc-950 border-2 border-zinc-800 text-zinc-600",
        isCurrent && "ring-4 ring-amber-500/20 scale-110"
      )}>
        {icon}
      </div>
      <div className="pt-1.5">
        <h3 className={cn("font-serif text-lg tracking-wide", isActive ? "text-zinc-100" : "text-zinc-500")}>{title}</h3>
        <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
