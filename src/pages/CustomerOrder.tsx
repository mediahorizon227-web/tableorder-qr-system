import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, where, documentId, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, OrderItem, Order } from '../types';
import { Minus, Plus, ShoppingBag, Utensils, Clock, ArrowRight, History, X, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  
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
          quantity: newQty,
          specialRequest: current?.specialRequest || ''
        }
      };
    });
  };

  const updateSpecialRequest = (menuItemId: string, request: string) => {
    setCart(prev => {
      if (!prev[menuItemId]) return prev;
      return {
        ...prev,
        [menuItemId]: {
          ...prev[menuItemId],
          specialRequest: request
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
    <div className={cn("min-h-screen bg-zinc-950 text-zinc-100 transition-all duration-300", totalItems > 0 ? "pb-28" : "pb-12")}>
      {/* Header */}
      <div className="bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-10 border-b border-zinc-900/80">
        <div className="px-5 py-5 flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-amber-400">TableOrder</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                Table {tableNumber}
              </span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full" />
              <span className="text-[11px] text-zinc-500">Dine-in Menu</span>
            </div>
          </div>
          <button 
            onClick={() => setShowHistory(true)} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all active:scale-95 text-xs font-medium"
          >
            <History className="w-3.5 h-3.5 text-amber-400/90" />
            <span>History</span>
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="px-5 pb-3 max-w-2xl mx-auto w-full">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name..." 
              className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation */}
        <div className="px-5 pb-4 max-w-2xl mx-auto w-full">
          <div 
            className="flex overflow-x-auto hide-scrollbar gap-2 snap-x snap-mandatory scroll-smooth w-full"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSearchQuery('');
                }}
                className={cn(
                  "snap-start shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 border",
                  activeCategory === cat && !searchQuery
                    ? "bg-amber-500 border-amber-500 text-zinc-950 font-semibold shadow-sm" 
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-5 py-6 max-w-2xl mx-auto">
        {activeOrders.length > 0 && (
          <div 
            onClick={() => navigate(`/status/${activeOrders[0].id}`)}
            className="mb-6 bg-zinc-900/80 border border-amber-500/30 p-4 rounded-2xl shadow-lg shadow-black/40 flex justify-between items-center cursor-pointer active:scale-[0.99] transition-all hover:border-amber-500/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-200 block tracking-wide">Active Order in Progress</span>
                <span className="text-[11px] text-zinc-400">Table {tableNumber} • Tap to view live status</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-amber-400">
              <span>Track</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {searchQuery && (
          <div className="mb-4 flex items-center justify-between text-xs text-zinc-400">
            <span>Showing results for "{searchQuery}"</span>
            <button onClick={() => setSearchQuery('')} className="text-amber-400 hover:underline">Clear</button>
          </div>
        )}

        <div className="space-y-4">
          {menuItems.filter(i => searchQuery ? i.name.toLowerCase().includes(searchQuery.toLowerCase()) : i.category === activeCategory).map(item => (
            <div 
              key={item.id}
              className={cn(
                "bg-zinc-900/40 border border-zinc-800/70 rounded-2xl p-4 transition-all duration-200 hover:border-zinc-700/80 shadow-sm shadow-black/40",
                !item.available && "opacity-60 grayscale-[30%]"
              )}
            >
              <div className="flex gap-3.5 sm:gap-4 items-start">
                {/* Dish Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-zinc-900 rounded-xl overflow-hidden relative border border-zinc-800 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-7 h-7 text-zinc-700" />
                  )}
                </div>

                {/* Dish Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Dietary Marker */}
                    {item.dietary === 'veg' && (
                      <span className="w-3 h-3 border border-emerald-600 rounded-[2px] flex items-center justify-center shrink-0 p-[1px]" title="Vegetarian">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      </span>
                    )}
                    {item.dietary === 'non-veg' && (
                      <span className="w-3 h-3 border border-red-600 rounded-[2px] flex items-center justify-center shrink-0 p-[1px]" title="Non-Vegetarian">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      </span>
                    )}
                    {item.isPopular && (
                      <span className="text-[10px] tracking-wider uppercase font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                        Popular
                      </span>
                    )}
                  </div>

                  <h3 className={cn("font-serif text-base sm:text-lg font-medium tracking-wide text-zinc-100 leading-snug", !item.available && "line-through text-zinc-500")}>
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-zinc-400 font-normal leading-relaxed line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}

                  {/* Price & Action Row */}
                  <div className="flex items-center justify-between mt-3 pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-semibold text-zinc-100">₹{item.price}</span>
                      {!item.available && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 ml-1.5">Sold Out</span>
                      )}
                    </div>

                    {item.available && (
                      <div>
                        {cart[item.id] ? (
                          <div className="flex items-center bg-zinc-950 border border-zinc-700/80 rounded-full p-0.5 shadow-sm">
                            <button 
                              onClick={() => updateQuantity(item, -1)}
                              aria-label="Decrease quantity"
                              className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors active:scale-95"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center font-semibold text-xs text-zinc-100">
                              {cart[item.id].quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item, 1)}
                              aria-label="Increase quantity"
                              className="w-7 h-7 flex items-center justify-center text-amber-400 hover:text-white hover:bg-amber-600 rounded-full transition-colors active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => updateQuantity(item, 1)}
                            className="px-4 py-1.5 bg-zinc-900 hover:bg-amber-500 text-zinc-200 hover:text-zinc-950 border border-zinc-700/80 hover:border-amber-500 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 shadow-sm"
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Integrated Special Request field (only shown cleanly when added to cart) */}
              {cart[item.id] && (
                <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center gap-2">
                  <input 
                    type="text" 
                    value={cart[item.id].specialRequest || ''}
                    onChange={(e) => updateSpecialRequest(item.id, e.target.value)}
                    placeholder="Add note for chef (e.g. extra spicy, no onions)..."
                    className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
                  />
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
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-20 max-w-2xl mx-auto"
          >
            <button 
              onClick={placeOrder}
              disabled={isPlacingOrder}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-3.5 rounded-2xl shadow-xl shadow-black/60 flex justify-between items-center active:scale-[0.99] transition-all duration-200 disabled:opacity-60 border border-amber-400/50"
            >
              <div className="flex items-center gap-3">
                <div className="bg-zinc-950/15 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-zinc-950">
                  {totalItems}
                </div>
                <span className="font-semibold tracking-wide text-sm sm:text-base">Place Order</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg">₹{totalPrice}</span>
                <ShoppingBag className="w-4 h-4 ml-1 opacity-80" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col"
          >
            <div className="px-5 py-5 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-serif font-medium text-zinc-100">Order History</h2>
                <p className="text-[11px] text-zinc-500">Table {tableNumber}</p>
              </div>
              <button 
                onClick={() => setShowHistory(false)} 
                className="p-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-full transition-colors active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl mx-auto w-full">
               {myOrders.filter(o => o.status !== 'Cancelled').length > 0 && (
                 <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex justify-between items-center mb-1">
                   <div>
                     <p className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase mb-0.5">Total Amount Due</p>
                     <p className="text-2xl font-serif font-medium text-amber-400">₹{myOrders.filter(o => o.status !== 'Cancelled').reduce((sum, order) => sum + order.totalPrice, 0)}</p>
                   </div>
                   <div className="text-right">
                     <span className="text-xs text-zinc-400 font-medium bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
                       {myOrders.filter(o => o.status !== 'Cancelled').length} order{myOrders.filter(o => o.status !== 'Cancelled').length > 1 ? 's' : ''}
                     </span>
                   </div>
                 </div>
               )}
               {myOrders.length === 0 ? (
                  <p className="text-zinc-500 text-center mt-12 text-sm">No order history found for this session.</p>
               ) : (
                  myOrders.sort((a,b) => b.createdAt - a.createdAt).map(order => (
                     <div 
                        key={order.id} 
                        onClick={() => navigate(`/status/${order.id}`)} 
                        className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/70 cursor-pointer hover:border-zinc-700/80 transition-all shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[11px] text-zinc-500 font-medium">
                              {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                           <span className={cn(
                              "text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider border", 
                              order.status === 'New' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                              order.status === 'Preparing' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                              order.status === 'Ready' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                              order.status === 'Served' && "bg-zinc-800/50 text-zinc-400 border-zinc-700/50",
                              order.status === 'Cancelled' && "bg-red-500/10 text-red-400 border-red-500/20"
                           )}>
                              {order.status}
                           </span>
                        </div>
                        <div className="space-y-1.5 mb-3">
                           {order.items.map(item => (
                              <div key={item.menuItemId} className="flex justify-between text-xs text-zinc-300">
                                 <span><span className="text-amber-400/90 font-medium mr-1.5">{item.quantity}x</span> {item.name}</span>
                              </div>
                           ))}
                        </div>
                        <div className="border-t border-zinc-800/70 pt-3 flex justify-between items-center text-xs">
                           <span className="text-zinc-400">Total</span>
                           <div className="flex items-center gap-3">
                             {order.status === 'New' && (
                               <button 
                                 onClick={(e) => handleCancelOrder(e, order.id)}
                                 className="text-[10px] text-red-400 font-medium uppercase tracking-wider hover:text-red-300 transition-colors border border-red-500/20 bg-red-500/10 px-2.5 py-1 rounded-full active:scale-95"
                               >
                                 Cancel
                               </button>
                             )}
                             <span className="font-semibold text-zinc-100 text-sm">₹{order.totalPrice}</span>
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
