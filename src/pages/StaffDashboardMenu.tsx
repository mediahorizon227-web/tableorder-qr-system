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
  const [editDescription, setEditDescription] = useState('');
  const [editDietary, setEditDietary] = useState<'veg' | 'non-veg'>('veg');
  const [editIsPopular, setEditIsPopular] = useState(false);

  // Add Item State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDietary, setNewDietary] = useState<'veg' | 'non-veg'>('veg');
  const [newIsPopular, setNewIsPopular] = useState(false);
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
    setEditName(item.name || '');
    setEditPrice(item.price || 0);
    setEditImageUrl(item.imageUrl || '');
    setEditDescription(item.description || '');
    setEditDietary(item.dietary || 'veg');
    setEditIsPopular(Boolean(item.isPopular));
  };

  const saveEdit = async (id: string) => {
    await updateDoc(doc(db, 'menuItems', id), {
      name: editName || '',
      price: Number(editPrice) || 0,
      imageUrl: editImageUrl || '',
      description: editDescription || '',
      dietary: editDietary || 'veg',
      isPopular: Boolean(editIsPopular)
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
        description: newDescription || '',
        dietary: newDietary || 'veg',
        isPopular: Boolean(newIsPopular),
        imageUrl: newImageUrl || ''
      });

      setIsAdding(false);
      setNewName('');
      setNewPrice('');
      setNewCategory('');
      setNewImageUrl('');
      setNewDescription('');
      setNewDietary('veg');
      setNewIsPopular(false);
    } catch (err) {
      console.error("Error adding item:", err);
      alert("Failed to add item.");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-sm shadow-black/40 overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-zinc-100 tracking-wide">Menu Management</h2>
            <p className="text-xs text-zinc-400 mt-1">Configure dishes, pricing, and live availability</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        {isAdding && (
          <div className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl mb-8 shadow-sm">
            <h3 className="text-base font-serif font-medium text-zinc-100 mb-4">Create New Dish</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Item Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                  placeholder="e.g. Truffle Mushroom Kulcha"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <input 
                  type="text" 
                  value={newDescription} 
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                  placeholder="e.g. Crisp tandoor-baked flatbread stuffed with wild mushrooms & truffle butter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Price (₹)</label>
                <input 
                  type="number" 
                  value={newPrice} 
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                  placeholder="e.g. 299"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                <input 
                  type="text" 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  list="category-options"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                  placeholder="e.g. Starters"
                />
                <datalist id="category-options">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Dietary Preference</label>
                <select 
                  value={newDietary} 
                  onChange={(e) => setNewDietary(e.target.value as 'veg' | 'non-veg')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Chef's Recommendation / Popular</label>
                <div className="flex items-center h-[38px]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={newIsPopular}
                      onChange={(e) => setNewIsPopular(e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 border border-zinc-700 peer-checked:border-amber-500 shadow-inner"></div>
                  </label>
                  <span className="ml-3 text-xs font-medium text-zinc-300">{newIsPopular ? 'Popular dish' : 'Standard'}</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Photo URL (Optional)</label>
                <input 
                  type="text" 
                  value={newImageUrl} 
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2.5 justify-end border-t border-zinc-800/80 pt-4">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleAddItem} 
                disabled={isSaving || !newName || !newPrice || !newCategory} 
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Dish
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">{category}</h3>
              <div className="divide-y divide-zinc-800/60 border-t border-zinc-800/60">
                {menuItems.filter(i => i.category === category).map(item => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-zinc-800/20 -mx-3 px-3 rounded-xl">
                    
                    {editingId === item.id ? (
                      <div className="flex-1 w-full bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          <div className="sm:col-span-2">
                            <input 
                              type="text" 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                              placeholder="Name"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input 
                              type="text" 
                              value={editDescription} 
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                              placeholder="Description"
                            />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-xs">₹</span>
                            <input 
                              type="number" 
                              value={editPrice} 
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                            />
                          </div>
                          <div>
                            <input 
                              type="text" 
                              value={editImageUrl} 
                              onChange={(e) => setEditImageUrl(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                              placeholder="Image URL"
                            />
                          </div>
                          <div>
                            <select 
                              value={editDietary || 'veg'} 
                              onChange={(e) => setEditDietary(e.target.value as 'veg' | 'non-veg')}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                            >
                              <option value="veg">Vegetarian</option>
                              <option value="non-veg">Non-Vegetarian</option>
                            </select>
                          </div>
                          <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={editIsPopular}
                                onChange={(e) => setEditIsPopular(e.target.checked)}
                              />
                              <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500 border border-zinc-700 peer-checked:border-amber-500 shadow-inner"></div>
                            </label>
                            <span className="ml-2 text-xs text-zinc-300">Popular</span>
                          </div>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs font-medium">
                            Cancel
                          </button>
                          <button onClick={() => saveEdit(item.id)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold tracking-wide">
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex justify-between items-center">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/50 overflow-hidden flex flex-shrink-0 items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              {item.dietary === 'veg' && (
                                <div className="w-3 h-3 border border-emerald-600 rounded-[2px] flex items-center justify-center p-[1px]" title="Vegetarian">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                </div>
                              )}
                              {item.dietary === 'non-veg' && (
                                <div className="w-3 h-3 border border-red-600 rounded-[2px] flex items-center justify-center p-[1px]" title="Non-Vegetarian">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                </div>
                              )}
                              <p className={cn("font-serif text-base tracking-wide font-medium", !item.available ? "text-zinc-500 line-through" : "text-zinc-200")}>
                                {item.name}
                              </p>
                              {item.isPopular && (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase font-medium tracking-wider rounded-full">Popular</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-zinc-500 mb-1 max-w-sm truncate">{item.description}</p>
                            )}
                            <p className={cn("text-xs font-semibold", item.available ? "text-zinc-100" : "text-zinc-600")}>
                              ₹{item.price}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEditing(item)}
                              className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-full transition-colors"
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
                            <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 border border-zinc-700 peer-checked:border-amber-500 shadow-inner"></div>
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
