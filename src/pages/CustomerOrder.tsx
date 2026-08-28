import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, where, documentId, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, OrderItem, Order } from '../types';
import { Minus, Plus, ShoppingBag, Utensils, Clock, ArrowRight, History, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function CustomerOrder() {
  const [searchParams] = useSearchParams();
  const tableNumber = parseInt(searchParams.get('table') || '1', 10);
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, OrderItem>>({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Starters');
  
  const [savedOrderIds, setSavedOrderIds] = useState<string[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`customer_orders_table_${tableNumber}`) || '[]');
    setSavedOrderIds(stored);
  }, [tableNumber]);

  useEffect(() => {
    if (savedOrderIds.length === 0) {
      setMyOrders([]);
      return;
    }
    const recentOrders = savedOrderIds.slice(-10);
    const q = query(collection(db, 'orders'), where(documentId(), 'in', recentOrders));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Order[] = [];
      snapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() } as Order;
        if (orderData.tableNumber === tableNumber) {
          fetched.push(orderData);
        }
      });
      setMyOrders(fetched);
    });
    return () => unsubscribe();
  }, [savedOrderIds, tableNumber]);

  const activeOrders = myOrders.filter(o => o.status !== 'Served' && o.status !== 'Cancelled').sort((a, b) => b.createdAt - a.createdAt);

  const handleCancelOrder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'Cancelled' });
    } catch (error) {
      console.error("Error cancelling order: ", error);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'menuItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setMenuItems(items);
    });

    return () => unsubscribe();
  }, []);

  const dynamicCategories = Array.from(new Set(menuItems.map(item => item.category)));
  const categories = dynamicCategories.length > 0 ? dynamicCategories : ['Starters', 'Main Course', 'Beverages', 'Desserts'];

  // Ensure active category is valid
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const updateQuantity = (item: MenuItem, delta: number) => {
    if (!item.available) return;

    setCart(prev => {
      const current = prev[item.id];
      const currentQty = current ? current.quantity : 0;
      const newQty = Math.max(0, currentQty + delta);

      if (newQty === 0) {
        const newCart = { ...prev };
        delete newCart[item.id];
        return newCart;
      }

      return {
        ...prev,
        [item.id]: {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: newQty
        }
      };
    });
  };

  const cartItems = Object.values(cart) as OrderItem[];
  const totalPrice = cartItems.reduce((sum: number, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum: number, item) => sum + item.quantity, 0);

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    setIsPlacingOrder(true);

    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        tableNumber,
        items: cartItems,
        totalPrice,
        status: 'New',
        createdAt: Date.now()
      });
      
      const storageKey = `customer_orders_table_${tableNumber}`;
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      stored.push(orderRef.id);
      localStorage.setItem(storageKey, JSON.stringify(stored));

      navigate(`/status/${orderRef.id}`);
    } catch (error) {
      console.error("Error placing order: ", error);
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-zinc-950 text-zinc-100 transition-all duration-300", totalItems > 0 ? "pb-32" : "pb-12")}>
      {/* Header */}
      <div className="bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10 border-b border-zinc-900 shadow-sm">
        <div className="px-5 py-6 flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-amber-500">TableOrder</h1>
            <p className="text-xs text-zinc-400 font-semibold tracking-widest uppercase mt-1">Table {tableNumber}</p>
          </div>
          <button 
            onClick={() => setShowHistory(true)} 
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-amber-500 transition-colors active:scale-95"
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </button>
        </div>
        
        {/* Category Navigation */}
        <div className="px-5 pb-5 max-w-2xl mx-auto w-full">
          <div 
            className="flex overflow-x-auto hide-scrollbar gap-3 snap-x snap-mandatory scroll-smooth w-full"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{ width: 'calc((100% - 1.5rem) / 3)' }}
                className={cn(
                  "snap-start shrink-0 py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm font-bold tracking-wide transition-all duration-300 border flex items-center justify-center",
                  activeCategory === cat 
                    ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/40" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                <span className="truncate px-1">{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-5 py-8 max-w-2xl mx-auto">
        {activeOrders.length > 0 && (
          <div 
            onClick={() => navigate(`/status/${activeOrders[0].id}`)}
            className="mb-6 bg-gradient-to-r from-amber-600 to-amber-500 p-4 rounded-2xl shadow-lg shadow-amber-900/20 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-zinc-950 animate-pulse" />
              <span className="text-zinc-950 font-bold tracking-wide">View active order</span>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-950 opacity-80" />
          </div>
        )}

        <div className="space-y-4">
          {menuItems.filter(i => i.category === activeCategory).map(item => (
            <div 
              key={item.id} 
              className={cn(
                "bg-zinc-900/60 p-4 rounded-2xl shadow-xl shadow-black/20 border border-zinc-800/60 flex justify-between items-center transition-all duration-300 hover:border-zinc-700/60 gap-4",
                !item.available && "opacity-50 grayscale"
              )}
            >
              <div className="w-20 h-20 shrink-0 bg-zinc-800/80 rounded-xl overflow-hidden relative border border-zinc-700/50 flex items-center justify-center">
                 {item.imageUrl ? (
                   <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                 ) : (
                   <Utensils className="w-8 h-8 text-zinc-600" />
                 )}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h3 className={cn("font-serif text-lg tracking-wide truncate", !item.available && "line-through text-zinc-500")}>
                  {item.name}
                </h3>
                <p className="text-amber-500 font-medium mt-1">₹{item.price}</p>
                {!item.available && <p className="text-[10px] text-zinc-500 font-bold mt-1.5 uppercase tracking-widest">Unavailable</p>}
              </div>

              {item.available && (
                <div className="flex items-center shrink-0">
                  {cart[item.id] ? (
                    <div className="flex items-center bg-zinc-950 rounded-full p-1 border border-zinc-800">
                      <button 
                        onClick={() => updateQuantity(item, -1)}
                        className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors active:scale-95"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{cart[item.id].quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item, 1)}
                        className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateQuantity(item, 1)}
                      className="px-6 py-2.5 bg-zinc-950 hover:bg-amber-600 hover:text-white text-zinc-300 hover:border-amber-500 rounded-full text-sm font-semibold transition-all duration-300 active:scale-95 border border-zinc-800 shadow-sm"
                    >
                      Add
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Checkout */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-20 max-w-2xl mx-auto"
          >
            <button 
              onClick={placeOrder}
              disabled={isPlacingOrder}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-amber-900/40 flex justify-between items-center active:scale-[0.98] transition-all duration-300 hover:from-amber-500 hover:to-amber-400 disabled:opacity-70 border border-amber-400/30"
            >
              <div className="flex items-center gap-4">
                <div className="bg-zinc-950/30 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm backdrop-blur-md border border-white/10">
                  {totalItems}
                </div>
                <span className="font-semibold tracking-wide text-lg">Place Order</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-xl">₹{totalPrice}</span>
                <ShoppingBag className="w-5 h-5 opacity-90" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col"
          >
            <div className="px-5 py-6 flex items-center justify-between border-b border-zinc-900 bg-zinc-950">
              <h2 className="text-2xl font-serif text-amber-500">Your Orders</h2>
              <button 
                onClick={() => setShowHistory(false)} 
                className="p-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl mx-auto w-full">
               {myOrders.filter(o => o.status !== 'Cancelled').length > 0 && (
                 <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex justify-between items-center mb-2 shadow-inner">
                   <div>
                     <p className="text-xs text-amber-500/80 font-bold tracking-widest uppercase mb-1">Total Amount Due</p>
                     <p className="text-2xl font-serif text-amber-500">₹{myOrders.filter(o => o.status !== 'Cancelled').reduce((sum, order) => sum + order.totalPrice, 0)}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-zinc-400 font-medium">{myOrders.filter(o => o.status !== 'Cancelled').length} order{myOrders.filter(o => o.status !== 'Cancelled').length > 1 ? 's' : ''}</p>
                   </div>
                 </div>
               )}
               {myOrders.length === 0 ? (
                  <p className="text-zinc-500 text-center mt-10 font-medium">No order history found.</p>
               ) : (
                  myOrders.sort((a,b) => b.createdAt - a.createdAt).map(order => (
                     <div 
                        key={order.id} 
                        onClick={() => navigate(`/status/${order.id}`)} 
                        className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/60 cursor-pointer hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-xs text-zinc-500 font-bold tracking-widest uppercase">
                              {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                           <span className={cn(
                              "text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border", 
                              order.status === 'New' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                              order.status === 'Preparing' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                              order.status === 'Ready' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                              order.status === 'Served' && "bg-zinc-800/50 text-zinc-500 border-zinc-700/50",
                              order.status === 'Cancelled' && "bg-red-500/10 text-red-400 border-red-500/20"
                           )}>
                              {order.status}
                           </span>
                        </div>
                        <div className="space-y-2 mb-4">
                           {order.items.map(item => (
                              <div key={item.menuItemId} className="flex justify-between text-sm text-zinc-300">
                                 <span><span className="text-amber-500 font-bold mr-2">{item.quantity}x</span> {item.name}</span>
                              </div>
                           ))}
                        </div>
                        <div className="border-t border-zinc-800/80 pt-4 flex justify-between items-center text-zinc-100 font-bold">
                           <span>Total</span>
                           <div className="flex items-center gap-4">
                             {order.status === 'New' && (
                               <button 
                                 onClick={(e) => handleCancelOrder(e, order.id)}
                                 className="text-[10px] text-red-400 font-bold uppercase tracking-wider hover:text-red-300 transition-colors border border-red-500/20 bg-red-500/10 px-3 py-1.5 rounded-full active:scale-95"
                               >
                                 Cancel Order
                               </button>
                             )}
                             <span className="text-amber-500">₹{order.totalPrice}</span>
                           </div>
                        </div>
                     </div>
                  ))
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
