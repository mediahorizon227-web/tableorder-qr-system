import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem } from '../types';
import { Edit2, Check, X, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StaffDashboardMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editImageUrl, setEditImageUrl] = useState('');

  // Add Item State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const toggleAvailability = async (item: MenuItem) => {
    await updateDoc(doc(db, 'menuItems', item.id), {
      available: !item.available
    });
  };

  const startEditing = (item: MenuItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditImageUrl(item.imageUrl || '');
  };

  const saveEdit = async (id: string) => {
    await updateDoc(doc(db, 'menuItems', id), {
      name: editName,
      price: editPrice,
      imageUrl: editImageUrl
    });
    setEditingId(null);
  };

  const handleAddItem = async () => {
    if (!newName || !newPrice || !newCategory) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'menuItems'), {
        name: newName,
        price: Number(newPrice),
        category: newCategory,
        available: true,
        ...(newImageUrl ? { imageUrl: newImageUrl } : {})
      });

      setIsAdding(false);
      setNewName('');
      setNewPrice('');
      setNewCategory('');
      setNewImageUrl('');
    } catch (err) {
      console.error("Error adding item:", err);
      alert("Failed to add item.");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl shadow-xl shadow-black/20 overflow-hidden">
      <div className="p-6 sm:p-10">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-serif text-zinc-100 tracking-wide">Menu Management</h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-amber-900/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </button>
        </div>

        {isAdding && (
          <div className="bg-zinc-900 border border-zinc-700/60 p-6 rounded-2xl mb-10 shadow-lg shadow-black/20">
            <h3 className="text-lg font-serif text-amber-500 mb-5">Create New Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Item Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  placeholder="e.g. Truffle Fries"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Price (₹)</label>
                <input 
                  type="number" 
                  value={newPrice} 
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  placeholder="e.g. 299"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Category</label>
                <input 
                  type="text" 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  list="category-options"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  placeholder="e.g. Starters"
                />
                <datalist id="category-options">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Item Photo URL (Optional)</label>
                <input 
                  type="text" 
                  value={newImageUrl} 
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  placeholder="e.g. https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end border-t border-zinc-800/80 pt-5">
              <button onClick={() => setIsAdding(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleAddItem} 
                disabled={isSaving || !newName || !newPrice || !newCategory} 
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all shadow-lg shadow-emerald-900/30 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Item
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-12">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-xs font-bold text-amber-500 mb-4 uppercase tracking-[0.2em]">{category}</h3>
              <div className="divide-y divide-zinc-800/50 border-t border-zinc-800/50">
                {menuItems.filter(i => i.category === category).map(item => (
                  <div key={item.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-zinc-800/20 -mx-4 px-4 rounded-xl">
                    
                    {editingId === item.id ? (
                      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex gap-3 w-full sm:w-auto flex-1">
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 min-w-[120px] bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                            placeholder="Name"
                          />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm">₹</span>
                            <input 
                              type="number" 
                              value={editPrice} 
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-20 sm:w-24 pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                            />
                          </div>
                        </div>
                        <div className="flex w-full sm:w-auto flex-1 items-center gap-3">
                          <input 
                            type="text" 
                            value={editImageUrl} 
                            onChange={(e) => setEditImageUrl(e.target.value)}
                            className="flex-1 min-w-[120px] bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                            placeholder="Image URL"
                          />
                          <div className="flex items-center gap-2">
                            <button onClick={() => saveEdit(item.id)} className="p-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2.5 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-zinc-800/80 border border-zinc-700/50 overflow-hidden flex flex-shrink-0 items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <p className={cn("font-serif text-lg tracking-wide", !item.available ? "text-zinc-500 line-through" : "text-zinc-200")}>
                              {item.name}
                            </p>
                            <p className={cn("text-sm font-medium mt-0.5", item.available ? "text-amber-500" : "text-zinc-600")}>
                              ₹{item.price}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEditing(item)}
                              className="p-2 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-full transition-colors"
                              title="Edit Item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={item.available}
                              onChange={() => toggleAvailability(item)}
                            />
                            <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 border border-zinc-700 peer-checked:border-amber-500 shadow-inner"></div>
                          </label>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
