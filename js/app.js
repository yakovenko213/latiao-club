// app.js
import { db } from './config.js';

// MOCK products (потім заміниш на Firebase)
const PRODUCTS = [
  {
    id: 'p1',
    name: 'Latiao Classic',
    price: 89,
    image: '/placeholder.svg',
    stock: 10,
    spiciness: 2
  },
  {
    id: 'p2',
    name: 'Latiao Extra Hot',
    price: 109,
    image: '/placeholder.svg',
    stock: 0,
    spiciness: 4
  }
];

function renderCategory(products) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = products.map(p => `
    <div class="bg-white rounded-2xl shadow p-4">
      <img src="${p.image}" class="w-full h-48 object-cover rounded-xl mb-3">

      <div class="text-sm font-bold mb-1 ${
        p.stock > 0 ? 'text-green-600' : 'text-gray-400'
      }">
        ${p.stock > 0 ? 'Готово до відправки' : 'Немає в наявності'}
      </div>

      <h3 class="font-bold text-lg">${p.name}</h3>
      <div class="text-orange-500 font-extrabold mb-2">${p.price} грн</div>

      <div class="mb-3">${'🌶️'.repeat(p.spiciness)}</div>

      <button
        class="add-to-cart-btn w-full py-3 rounded-xl font-bold text-white
        ${p.stock > 0 ? 'bg-orange-500' : 'bg-gray-300 cursor-not-allowed'}"
        ${p.stock <= 0 ? 'disabled' : ''}
        data-id="${p.id}"
        data-name="${p.name}"
        data-price="${p.price}"
        data-image="${p.image}"
        data-stock="${p.stock}"
        data-spiciness="${p.spiciness}"
      >
        В кошик
      </button>
    </div>
  `).join('');
}

// ЄДИНИЙ обробник
document.addEventListener('click', e => {
  const btn = e.target.closest('.add-to-cart-btn');
  if (!btn || btn.disabled) return;

  const product = {
    id: btn.dataset.id,
    name: btn.dataset.name,
    price: Number(btn.dataset.price),
    image: btn.dataset.image,
    stock: Number(btn.dataset.stock),
    spiciness: Number(btn.dataset.spiciness),
    quantity: 1
  };

  window.addToCart(product);
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Category page loaded');
  renderCategory(PRODUCTS);
});
  