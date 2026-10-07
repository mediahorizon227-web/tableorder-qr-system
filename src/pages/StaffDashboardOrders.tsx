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
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-2.5 mb-6">
          <h2 className="text-xl font-serif font-medium text-zinc-100 tracking-wide">
            Active Orders
          </h2>
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full font-sans">
            {activeOrders.length}
          </span>
        </div>
        {activeOrders.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-10 text-center">
            <p className="text-zinc-500 font-serif italic text-base">No active orders right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
        <h2 className="text-base font-serif font-medium text-zinc-500 tracking-wide mb-4">Past Orders (Served)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
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
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-sm shadow-black/40 flex flex-col h-full transition-all hover:border-zinc-700/80">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-xl font-serif font-medium text-zinc-100">Table {order.tableNumber}</h3>
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className={cn(
          "px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide flex items-center gap-1.5 border",
          order.status === 'New' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
          order.status === 'Preparing' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
          order.status === 'Ready' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          order.status === 'Served' && "bg-zinc-800/50 text-zinc-400 border-zinc-700/50",
          order.status === 'Cancelled' && "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          {STATUS_ICONS[order.status]}
          <span>{order.status}</span>
        </div>
      </div>

      <div className="flex-1 mb-5">
        <ul className="space-y-3">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex flex-col text-xs sm:text-sm border-b border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <span className="flex gap-2 text-zinc-300">
                  <span className="font-semibold text-amber-400/90">{item.quantity}x</span> 
                  <span>{item.name}</span>
                </span>
                <span className="text-zinc-400 font-medium">₹{item.price * item.quantity}</span>
              </div>
              {item.specialRequest && (
                <div className="mt-1 ml-5">
                  <span className="inline-block px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-normal rounded-md">
                    Note: {item.specialRequest}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-zinc-800/80 pt-4 mt-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="tracking-wider text-zinc-400 text-xs font-medium uppercase">Total</span>
          <span className="text-lg font-serif text-zinc-100 font-medium">₹{order.totalPrice}</span>
        </div>
        
        {nextStatus && onUpdateStatus && (
          <button
            onClick={onUpdateStatus}
            className={cn(
              "w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all active:scale-[0.99] border shadow-sm",
              order.status === 'New' && "bg-zinc-100 text-zinc-950 border-zinc-200 hover:bg-zinc-200",
              order.status === 'Preparing' && "bg-amber-500 text-zinc-950 border-amber-400 hover:bg-amber-400",
              order.status === 'Ready' && "bg-emerald-500 text-zinc-950 border-emerald-400 hover:bg-emerald-400"
            )}
          >
            Mark as {nextStatus}
          </button>
        )}
      </div>
    </div>
  );
}
