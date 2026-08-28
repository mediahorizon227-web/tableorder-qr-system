import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const INITIAL_MENU = [
  // Starters
  { name: 'Paneer Tikka', category: 'Starters', price: 250, available: true },
  { name: 'Crispy Corn', category: 'Starters', price: 180, available: true },
  { name: 'Spring Rolls', category: 'Starters', price: 150, available: true },
  { name: 'Chicken 65', category: 'Starters', price: 280, available: true },
  // Main Course
  { name: 'Butter Chicken', category: 'Main Course', price: 350, available: true },
  { name: 'Dal Makhani', category: 'Main Course', price: 220, available: true },
  { name: 'Garlic Naan', category: 'Main Course', price: 60, available: true },
  { name: 'Vegetable Biryani', category: 'Main Course', price: 250, available: true },
  // Beverages
  { name: 'Fresh Lime Soda', category: 'Beverages', price: 90, available: true },
  { name: 'Mango Lassi', category: 'Beverages', price: 120, available: true },
  { name: 'Cold Coffee', category: 'Beverages', price: 150, available: true },
  // Desserts
  { name: 'Gulab Jamun', category: 'Desserts', price: 100, available: true },
  { name: 'Chocolate Brownie', category: 'Desserts', price: 180, available: true },
  { name: 'Rasmalai', category: 'Desserts', price: 120, available: true },
];

export async function seedMenuIfNeeded() {
  const menuRef = collection(db, 'menuItems');
  const snapshot = await getDocs(menuRef);
  
  if (snapshot.empty) {
    console.log('Seeding initial menu items...');
    for (const item of INITIAL_MENU) {
      await addDoc(menuRef, item);
    }
    console.log('Menu seeding complete.');
  }
}
