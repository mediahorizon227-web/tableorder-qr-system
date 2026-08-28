import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderStatus } from '../types';
import { Check, ChefHat, Clock, Utensils, X } from 'lucide-react';
import { cn } from '../lib/utils';

const STATUS_ICONS = {
  New: <Clock className="w-4 h-4" />,
  Preparing: <ChefHat className="w-4 h-4" />,
  Ready: <Check className="w-4 h-4" />,
  Served: <Utensils className="w-4 h-4" />,
  Cancelled: <X className="w-4 h-4" />,
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  New: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Served',
  Served: null,
  Cancelled: null,
};

export default function StaffDashboardOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });
      // Sort by newest first
      ordersData.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;

    await updateDoc(doc(db, 'orders', orderId), {
      status: nextStatus
    });
  };

  const activeOrders = orders.filter(o => o.status !== 'Served' && o.status !== 'Cancelled');
  const pastOrders = orders.filter(o => o.status === 'Served' || o.status === 'Cancelled');

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-serif text-zinc-100 tracking-wide mb-6 flex items-center gap-3">
          Active Orders 
          <span className="bg-amber-500 text-zinc-950 text-xs font-bold px-2.5 py-0.5 rounded-full font-sans">{activeOrders.length}</span>
        </h2>
        {activeOrders.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-12 text-center">
            <p className="text-zinc-500 font-serif italic text-lg">No active orders right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onUpdateStatus={() => handleStatusUpdate(order.id, order.status)} 
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-serif text-zinc-500 tracking-wide mb-6">Past Orders (Served)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
          {pastOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}

const OrderCard: React.FC<{ order: Order, onUpdateStatus?: () => void }> = ({ order, onUpdateStatus }) => {
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-3xl p-6 shadow-xl shadow-black/20 flex flex-col h-full transition-all hover:border-zinc-700/50 hover:shadow-black/40">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-serif text-zinc-100">Table {order.tableNumber}</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className={cn(
          "px-3 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 border",
          order.status === 'New' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
          order.status === 'Preparing' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
          order.status === 'Ready' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          order.status === 'Served' && "bg-zinc-800/50 text-zinc-500 border-zinc-700/50",
          order.status === 'Cancelled' && "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          {STATUS_ICONS[order.status]}
          {order.status}
        </div>
      </div>

      <div className="flex-1 mb-6">
        <ul className="space-y-3">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between text-sm items-start">
              <span className="flex gap-3 text-zinc-300">
                <span className="font-bold text-amber-500">{item.quantity}x</span> 
                <span>{item.name}</span>
              </span>
              <span className="text-zinc-500 font-medium">₹{item.price * item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-zinc-800/80 pt-5 mt-auto">
        <div className="flex justify-between items-center mb-5">
          <span className="tracking-wide text-zinc-400 text-sm font-medium uppercase">Total</span>
          <span className="text-xl font-serif text-amber-500 font-bold">₹{order.totalPrice}</span>
        </div>
        
        {nextStatus && onUpdateStatus && (
          <button
            onClick={onUpdateStatus}
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] border shadow-lg",
              order.status === 'New' && "bg-zinc-100 text-zinc-950 border-white hover:bg-zinc-300 shadow-white/10",
              order.status === 'Preparing' && "bg-amber-600 text-white border-amber-500 hover:bg-amber-500 shadow-amber-900/30",
              order.status === 'Ready' && "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 shadow-emerald-900/30"
            )}
          >
            Mark as {nextStatus}
          </button>
        )}
      </div>
    </div>
  );
}
