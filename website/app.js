/* ========================
   OTT24x7 - Complete SPA
   ======================== */
const API = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';
let user = JSON.parse(localStorage.getItem('user') || 'null');
let token = localStorage.getItem('token') || '';
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let products = [], currentProduct = null;
let filters = { cat: '', min: 0, max: 10000, sale: false, stock: false, sort: 'newest' };

const $ = id => document.getElementById(id);
const fmt = n => '\u20B9' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toast(m, t) {
  t = t || 'info';
  const d = document.createElement('div');
  d.className = 'toast ' + t;
  const icon = t === 'success' ? 'check-circle' : t === 'error' ? 'exclamation-circle' : 'info-circle';
  d.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><i class="fas fa-' + icon + '"></i> ' + m + '</div>';
  $('toast-container').appendChild(d);
  requestAnimationFrame(function() { d.classList.add('show'); });
  setTimeout(function() { d.classList.remove('show'); setTimeout(function() { d.remove(); }, 400); }, 3000);
}

async function api(p, o) {
  o = o || {};
  const r = await fetch(API + p, {
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': 'Bearer ' + token } : {}) },
    ...o,
    body: o.body ? JSON.stringify(o.body) : undefined
  });
  const d = await r.json().catch(function() { return null; });
  if (!r.ok) throw new Error((d && d.message) || 'Failed');
  return d;
}

function buildNav() {
  $('main-nav').innerHTML = '<div class="flex items-center justify-between px-4 md:px-8 py-4 max-w-7xl mx-auto">' +
    '<div class="flex items-center gap-3 cursor-pointer" onclick="go(\'home\')">' +
      '<div class="w-10 h-10 bg-gradient-to-tr from-blue-500 to-pink-500 rounded-xl flex items-center justify-center pulse-glow">' +
        '<i class="fas fa-play text-white text-xs"></i></div>' +
      '<span class="font-extrabold text-xl tracking-tighter uppercase">OTT24<span class="text-pink-500 font-black">x</span>7</span></div>' +
    '<div class="hidden md:flex items-center gap-6">' +
      ['home','shop','about','contact','faq'].map(function(v) {
        return '<button onclick="go(\'' + v + '\')" class="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition">' +
        v[0].toUpperCase() + v.slice(1) + '</button>';
      }).join('') + '</div>' +
    '<div class="flex items-center gap-4">' +
      (!user ? '<button onclick="openDrawer(\'login-drawer\')" class="hidden md:block text-[11px] font-bold text-gray-400 hover:text-white uppercase transition">Login</button>' :
        '<div class="hidden md:flex items-center gap-2"><span class="text-xs font-bold text-pink-400">' + user.username + '</span>' +
        '<button onclick="logout()" class="text-[10px] font-bold text-gray-500 hover:text-red-400 uppercase">Logout</button></div>') +
      '<div class="flex items-center gap-3 border-l border-gray-700 pl-4 cursor-pointer" onclick="openCart()">' +
        '<div class="relative"><i class="fas fa-shopping-basket text-lg text-gray-300"></i>' +
        '<span id="cart-badge" class="absolute -top-2 -right-2 bg-pink-500 text-[9px] px-1.5 py-0.5 rounded-full font-black">' + cart.length + '</span></div>' +
        '<span id="cart-total-nav" class="text-xs font-bold text-gray-400 hidden sm:inline">' + fmt(cartTotal()) + '</span></div>' +
      '<button class="md:hidden text-gray-400 hover:text-white" onclick="openDrawer(\'mobile-menu\')">' +
        '<i class="fas fa-bars text-lg"></i></button></div>';
}

function buildDrawers() {
  $('mobile-menu').innerHTML = '<div class="flex justify-between items-center mb-8">' +
    '<span class="font-extrabold text-xl tracking-tighter uppercase">OTT24<span class="text-pink-500 font-black">x</span>7</span>' +
    '<button onclick="closeAll()" class="text-gray-400 hover:text-white"><i class="fas fa-times text-lg"></i></button></div>' +
    '<div class="space-y-1">' +
    ['home','shop','about','contact','faq'].map(function(v) {
      return '<button onclick="go(\'' + v + '\');closeAll()" class="block w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-sm font-semibold">' +
      v[0].toUpperCase() + v.slice(1) + '</button>';
    }).join('') +
    '<hr class="border-gray-800 my-4">' +
    (!user ? '<button onclick="openDrawer(\'login-drawer\');closeAll()" class="block w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-sm font-semibold text-pink-400">Login / Register</button>' :
      '<div class="px-4 py-3"><p class="text-sm font-bold text-pink-400">' + user.username + '</p>' +
      '<button onclick="logout();closeAll()" class="text-xs text-gray-500 mt-1">Logout</button></div>') + '</div>';

  $('cart-drawer').innerHTML = '<div class="p-6 h-full flex flex-col">' +
    '<div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">' +
    '<h2 class="text-lg font-bold"><i class="fas fa-shopping-basket text-pink-500 mr-2"></i>Cart (<span id="cart-count">' + cart.length + '</span>)</h2>' +
    '<button onclick="closeAll()" class="text-xs font-bold text-gray-500 uppercase hover:text-white">Close</button></div>' +
    '<div id="cart-items" class="flex-1 overflow-y-auto space-y-4 pr-2"></div>' +
    '<div id="cart-footer" class="pt-4 border-t border-gray-800">' +
    '<div class="flex justify-between items-center mb-4"><span class="text-sm font-bold text-gray-400">Subtotal</span>' +
    '<span id="cart-total" class="text-xl font-black">' + fmt(cartTotal()) + '</span></div>' +
    '<button onclick="go(\'checkout\');closeAll()" class="w-full bg-[#ff2d55] py-3 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-pink-600 transition">Checkout</button>' +
    '<button onclick="clearCart()" class="w-full mt-2 py-2 text-xs font-bold text-gray-500 uppercase hover:text-red-400 transition">Clear Cart</button></div>';

  $('login-drawer').innerHTML = '<div class="p-8"><div class="flex justify-between items-center mb-10">' +
    '<h2 class="text-xl font-bold">Sign in</h2><button onclick="closeAll()" class="text-xs font-bold text-gray-500 uppercase hover:text-white">Close</button></div>' +
    '<form onsubmit="handleLogin(event)" class="space-y-6">' +
    '<input id="le" type="email" placeholder="Email *" required class="w-full bg-transparent border-b border-gray-800 py-3 outline-none text-sm focus:border-pink-500">' +
    '<input id="lp" type="password" placeholder="Password *" required class="w-full bg-transparent border-b border-gray-800 py-3 outline-none text-sm focus:border-pink-500">' +
    '<button class="w-full bg-[#ff2d55] py-3 font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-pink-600 transition">Log in</button></form>' +
    '<div class="mt-8 text-center"><p class="text-xs text-gray-500 mb-3">No account?</p>' +
    '<button onclick="closeAll();openDrawer(\'register-drawer\')" class="text-sm font-bold text-pink-500 hover:underline">Create Account</button></div>';

  $('register-drawer').innerHTML = '<div class="p-8"><div class="flex justify-between items-center mb-10">' +
    '<h2 class="text-xl font-bold">Create Account</h2><button onclick="closeAll()" class="text-xs font-bold text-gray-500 uppercase hover:text-white">Close</button></div>' +
    '<form onsubmit="handleRegister(event)" class="space-y-5">' +
    '<input id="ru" type="text" placeholder="Username *" required minlength="3" class="w-full bg-transparent border-b border-gray-800 py-3 outline-none text-sm focus:border-pink-500">' +
    '<input id="re" type="email" placeholder="Email *" required class="w-full bg-transparent border-b border-gray-800 py-3 outline-none text-sm focus:border-pink-500">' +
    '<input id="rp" type="password" placeholder="Password *" required minlength="6" class="w-full bg-transparent border-b border-gray-800 py-3 outline-none text-sm focus:border-pink-500">' +
    '<button class="w-full bg-[#ff2d55] py-3 font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-pink-600 transition">Register</button></form>' +
    '<div class="mt-8 text-center"><p class="text-xs text-gray-500 mb-3">Have an account?</p>' +
    '<button onclick="closeAll();openDrawer(\'login-drawer\')" class="text-sm font-bold text-pink-500 hover:underline">Sign in</button></div>';
}

function cartTotal() {
  return cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
}
function addToCart(p) {
  var idx = cart.findIndex(function(x) { return x._id === p._id; });
  if (idx >= 0) cart[idx].qty += 1;
  else cart.push({ _id: p._id, name: p.name, price: p.price, image: (p.images && p.images[0]) || '', qty: 1 });
  localStorage.setItem('cart', JSON.stringify(cart));
  toast('Added to cart', 'success');
  updateCartUI();
}
function removeFromCart(id) {
  cart = cart.filter(function(x) { return x._id !== id; });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}
function updateQty(id, q) {
  var item = cart.find(function(x) { return x._id === id; });
  if (!item) return;
  item.qty = Math.max(1, q);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}
function clearCart() {
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}
function updateCartUI() {
  var badge = $('cart-badge');
  if (badge) badge.textContent = cart.length;
  var navTotal = $('cart-total-nav');
  if (navTotal) navTotal.textContent = fmt(cartTotal());
  var count = $('cart-count');
  if (count) count.textContent = cart.length;
  var total = $('cart-total');
  if (total) total.textContent = fmt(cartTotal());
  var items = $('cart-items');
  if (items) {
    if (!cart.length) items.innerHTML = '<p class="text-center text-gray-500 text-sm py-8">Your cart is empty</p>';
    else items.innerHTML = cart.map(function(i) {
      return '<div class="flex gap-4 items-center">' +
      '<div class="w-14 h-14 bg-gray-800 rounded-lg flex-shrink-0 bg-cover bg-center" style="background-image:url(' + (i.image || '') + ')"></div>' +
      '<div class="flex-1"><p class="text-sm font-bold">' + i.name + '</p><p class="text-xs text-gray-500">' + fmt(i.price) + '</p></div>' +
      '<div class="flex items-center gap-2"><button onclick="updateQty(\'' + i._id + '\',' + (i.qty - 1) + ')" class="w-6 h-6 rounded bg-gray-800 text-xs">-</button>' +
      '<span class="text-xs font-bold">' + i.qty + '</span><button onclick="updateQty(\'' + i._id + '\',' + (i.qty + 1) + ')" class="w-6 h-6 rounded bg-gray-800 text-xs">+</button></div>' +
      '<button onclick="removeFromCart(\'' + i._id + '\')" class="text-gray-500 hover:text-red-400"><i class="fas fa-trash text-xs"></i></button></div>';
    }).join('');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  try {
    const d = await api('/auth/login', { method: 'POST', body: { email: $('le').value, password: $('lp').value } });
    user = d.user; token = d.token;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    toast('Welcome back, ' + user.username + '!', 'success');
    closeAll(); init();
  } catch (err) { toast(err.message, 'error'); }
}
async function handleRegister(e) {
  e.preventDefault();
  try {
    const d = await api('/auth/register', { method: 'POST', body: { username: $('ru').value, email: $('re').value, password: $('rp').value } });
    user = d.user; token = d.token;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    toast('Account created!', 'success');
    closeAll(); init();
  } catch (err) { toast(err.message, 'error'); }
}
function logout() {
  user = null; token = '';
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  toast('Logged out', 'info');
  init();
}

function openDrawer(id) {
  $('overlay').classList.add('active');
  $(id).classList.add('active');
  if (id === 'cart-drawer') updateCartUI();
}
function closeAll() {
  document.querySelectorAll('.drawer, .overlay, .mobile-menu').forEach(function(el) { el.classList.remove('active'); });
}
function openCart() { openDrawer('cart-drawer'); }

function productCard(p) {
  var img = (p.images && p.images[0]) || '';
  return '<div class="glass rounded-2xl overflow-hidden product-card cursor-pointer" onclick="go(\'product\',\'' + p._id + '\')">' +
    '<div class="h-48 bg-gray-800 bg-cover bg-center" style="background-image:url(' + img + ')"></div>' +
    '<div class="p-5"><h3 class="font-bold text-sm mb-1 truncate">' + p.name + '</h3>' +
    '<p class="text-xs text-gray-500 mb-3">' + (p.category || 'Digital') + '</p>' +
    '<div class="flex items-center justify-between"><span class="text-lg font-black text-pink-500">' + fmt(p.price) + '</span>' +
    '<button onclick="event.stopPropagation();addToCart(' + JSON.stringify(p).replace(/"/g, '"') + ')" class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-500 transition">' +
    '<i class="fas fa-plus text-xs"></i></button></div></div>';
}

function buildHome() {
  setTimeout(function() {
    var cats = [
      {n:'Streaming',i:'fa-play',c:'from-red-500 to-pink-500'},
      {n:'Gaming',i:'fa-gamepad',c:'from-blue-500 to-purple-600'},
      {n:'Software',i:'fa-laptop-code',c:'from-green-500 to-teal-400'},
      {n:'Cloud',i:'fa-cloud',c:'from-yellow-500 to-orange-500'}
    ];
    var cg = $('category-grid');
    if (cg) cg.innerHTML = cats.map(function(x) {
      return '<div class="glass rounded-2xl p-6 text-center cursor-pointer hover:scale-105 transition" onclick="go(\'shop\');filters.cat=\'' + x.n + '\';buildShop()">' +
      '<div class="w-14 h-14 mx-auto mb-4 bg-gradient-to-br ' + x.c + ' rounded-2xl flex items-center justify-center"><i class="fas ' + x.i + ' text-xl"></i></div>' +
      '<p class="text-sm font-bold">' + x.n + '</p></div>';
    }).join('');
    var tg = $('trending-grid');
    if (tg) tg.innerHTML = products.slice(0, 4).map(function(p) { return productCard(p); }).join('');
  }, 10);

  return '<header class="relative pt-16 pb-20 text-center px-4 overflow-hidden">' +
    '<div class="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-[100px]"></div>' +
    '<div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>' +
    '<div class="relative z-10 max-w-5xl mx-auto">' +
    '<div class="glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-green-400 text-[10px] font-bold tracking-widest uppercase mb-8">' +
    '<span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Instant Digital Delivery &middot; Worldwide</div>' +
    '<h1 class="text-5xl md:text-7xl font-extrabold mb-5 leading-[0.95] uppercase tracking-tighter">Premium Digital<br><span class="gradient-text">Subscriptions</span></h1>' +
    '<p class="text-gray-400 text-sm md:text-base max-w-xl mx-auto mb-10 font-medium">Get instant access to streaming platforms, software licenses, gaming subscriptions, and cloud storage.</p>' +
    '<div class="flex flex-wrap justify-center gap-4">' +
    '<button onclick="go(\'shop\')" class="bg-[#ff2d55] px-8 py-3.5 rounded-md font-bold text-[11px] uppercase tracking-wider hover:bg-pink-600 transition">Browse All</button>' +
    '<a href="https://wa.me/919999999999" target="_blank" class="bg-[#25D366] px-8 py-3.5 rounded-md font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-green-600 transition">' +
    '<i class="fab fa-whatsapp"></i> WhatsApp</a></div>' +
    '<div class="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-14 pt-6 border-t border-gray-800/50">' +
    '<div class="text-[10px] font-bold text-gray-400 flex items-center gap-2"><i class="fas fa-users text-pink-500"></i> 50,000+ Customers</div>' +
    '<div class="text-[10px] font-bold text-gray-400 flex items-center gap-2"><i class="fas fa-bolt text-yellow-500"></i> Instant Delivery</div>' +
    '<div class="text-[10px] font-bold text-gray-400 flex items-center gap-2"><i class="fas fa-shield-alt text-green-500"></i> Secure Payment</div>' +
    '<div class="text-[10px] font-bold text-gray-400 flex items-center gap-2"><i class="fas fa-headset text-blue-500"></i> 24/7 Support</div></div></header>' +
    '<section class="px-4 md:px-10 py-16 max-w-7xl mx-auto"><div class="text-center mb-12"><h2 class="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">Browse Categories</h2>' +
    '<p class="text-gray-500 text-sm">Find exactly what you need</p></div><div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="category-grid"></div></section>' +
    '<section class="px-4 md:px-10 py-16 bg-[#0a0c11]"><div class="max-w-7xl mx-auto"><div class="flex justify-between items-end mb-10">' +
    '<div><h2 class="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">Trending Now</h2><p class="text-gray-500 text-sm">Most popular products</p></div>' +
    '<button onclick="go(\'shop\')" class="text-xs font-bold text-pink-500 uppercase tracking-wider hover:underline hidden md:block">View All &rarr;</button></div>' +
    '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="trending-grid"><div class="flex justify-center py-12 col-span-full"><div class="loader"></div></div></section>' +
    '<section class="px-4 md:px-10 py-20 max-w-7xl mx-auto"><div class="text-center mb-14"><h2 class="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">How It Works</h2>' +
    '<p class="text-gray-500 text-sm">3 simple steps</p></div><div class="grid grid-cols-1 md:grid-cols-3 gap-8">' +
    '<div class="glass rounded-2xl p-8 text-center hover:scale-105 transition"><div class="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center"><i class="fas fa-mouse-pointer text-2xl"></i></div>' +
    '<h3 class="text-lg font-bold mb-3">1. Choose Product</h3><p class="text-gray-400 text-sm leading-relaxed">Browse our catalog and select the subscription or software key you need.</p></div>' +
    '<div class="glass rounded-2xl p-8 text-center hover:scale-105 transition"><div class="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center"><i class="fas fa-credit-card text-2xl"></i></div>' +
    '<h3 class="text-lg font-bold mb-3">2. Secure Payment</h3><p class="text-gray-400 text-sm leading-relaxed">Pay securely via UPI, Card, or Wallet. Your data is always encrypted.</p></div>' +
    '<div class="glass rounded-2xl p-8 text-center hover:scale-105 transition"><div class="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-teal-400 rounded-2xl flex items-center justify-center"><i class="fas fa-envelope-open-text text-2xl"></i></div>' +
    '<h3 class="text-lg font-bold mb-3">3. Instant Delivery</h3><p class="text-gray-400 text-sm leading-relaxed">Receive your key or login credentials via email within 5 minutes.</p></div></section>' +
    '<section class="px-4 md:px-10 py-16 bg-[#0a0c11]"><div class="max-w-7xl mx-auto"><div class="text-center mb-14"><h2 class="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">What Customers Say</h2>' +
    '<p class="text-gray-500 text-sm">Trusted by thousands of happy customers worldwide</p></div><div class="grid grid-cols-1 md:grid-cols-3 gap-6">' +
    '<div class="glass rounded-2xl p-6"><div class="flex text-yellow-500 text-xs mb-4">' + Array(5).fill('<i class="fas fa-star"></i>').join('') + '</div>' +
    '<p class="text-gray-300 text-sm mb-6 leading-relaxed">"Got my Netflix subscription within 2 minutes. Best prices I have found anywhere. Highly recommended!"</p>' +
    '<div class="flex items-center gap-3"><div class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">RK</div>' +
    '<div><p class="text-sm font-bold">Rahul Kumar</p><p class="text-xs text-gray-500">Delhi, India</p></div></div>' +
    '<div class="glass rounded-2xl p-6"><div class="flex text-yellow-500 text-xs mb-4">' + Array(5).fill('<i class="fas fa-star"></i>').join('') + '</div>' +
    '<p class="text-gray-300 text-sm mb-6 leading-relaxed">"Purchased Adobe Creative Cloud for my design work. Legitimate license, full features working perfectly."</p>' +
    '<div class="flex items-center gap-3"><div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">SP</div>' +
    '<div><p class="text-sm font-bold">Sarah Patel</p><p class="text-xs text-gray-500">Mumbai, India</p></div></div>' +
    '<div class="glass rounded-2xl p-6"><div class="flex text-yellow-500 text-xs mb-4">' + Array(4).fill('<i class="fas fa-star"></i>').join('') + '<i class="fas fa-star-half-alt"></i></div>' +
    '<p class="text-gray-300 text-sm mb-6 leading-relaxed">"Great customer support. Had an issue with my Xbox Game Pass and they resolved it within an hour."</p>' +
    '<div class="flex items-center gap-3"><div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">AM</div>' +
    '<div><p class="text-sm font-bold">Amit Mishra</p><p class="text-xs text-gray-500">Bangalore, India</p></div></div></section>' +
    '<section class="px-4 md:px-10 py-20 max-w-4xl mx-auto text-center"><h2 class="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Stay Updated</h2>' +
    '<p class="text-gray-500 text-sm mb-8">Subscribe to get exclusive deals and early access to new products.</p>' +
    '<div class="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">' +
    '<input type="email" placeholder="Enter your email" class="flex-1 bg-white/5 border border-gray-800 rounded-lg px-5 py-3 text-sm outline-none focus:border-pink-500 transition">' +
    '<button onclick="toast(\'Thanks for subscribing!\',\'success\')" class="bg-[#ff2d55] px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-pink-600 transition">Subscribe</button></div></section>';
}

function buildShop() {
  setTimeout(function() {
    var list = products;
    if (filters.cat) list = list.filter(function(p) { return p.category === filters.cat; });
    if (filters.min) list = list.filter(function(p) { return p.price >= filters.min; });
    if (filters.max < 10000) list = list.filter(function(p) { return p.price <= filters.max; });
    if (filters.sale) list = list.filter(function(p) { return p.salePrice; });
    if (filters.stock) list = list.filter(function(p) { return p.stock > 0; });
    var sg = $('shop-grid');
    if (sg) {
      if (!list.length) sg.innerHTML = '<p class="text-center text-gray-500 col-span-full py-12">No products found</p>';
      else sg.innerHTML = list.map(function(p) { return productCard(p); }).join('');
    }
  }, 10);

  return '<section class="px-4 md:px-10 py-12 max-w-7xl mx-auto"><div class="flex flex-col md:flex-row gap-8">' +
    '<aside class="w-full md:w-64 flex-shrink-0"><div class="glass rounded-2xl p-6 sticky top-4">' +
    '<h3 class="font-bold mb-4 text-sm uppercase tracking-wider">Filters</h3>' +
    '<div class="mb-4"><label class="text-xs text-gray-500 mb-1 block">Category</label>' +
    '<select onchange="filters.cat=this.value;buildShop()" class="w-full bg-white/5 border border-gray-800 rounded-lg px-3 py-2 text-sm">' +
    '<option value="">All</option><option>Streaming</option><option>Gaming</option><option>Software</option><option>Cloud</option></select></div>' +
    '<div class="mb-4"><label class="text-xs text-gray-500 mb-1 block">Max Price: <span id="price-val">' + filters.max + '</span></label>' +
    '<input type="range" min="0" max="10000" value="' + filters.max + '" oninput="filters.max=+this.value;$(\'price-val\').textContent=this.value;buildShop()" class="w-full"></div>' +
    '<div class="flex items-center gap-2 mb-2"><input type="checkbox" id="f-sale" onchange="filters.sale=this.checked;buildShop()" class="accent-pink-500">' +
    '<label for="f-sale" class="text-xs text-gray-400">On Sale</label></div>' +
    '<div class="flex items-center gap-2"><input type="checkbox" id="f-stock" onchange="filters.stock=this.checked;buildShop()" class="accent-pink-500">' +
    '<label for="f-stock" class="text-xs text-gray-400">In Stock</label></div></aside>' +
    '<div class="flex-1"><div class="flex justify-between items-center mb-6">' +
    '<h2 class="text-2xl font-black uppercase tracking-tight">Shop</h2>' +
    '<select onchange="filters.sort=this.value;buildShop()" class="bg-white/5 border border-gray-800 rounded-lg px-3 py-2 text-sm">' +
    '<option value="newest">Newest</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option></select></div>' +
    '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="shop-grid"><div class="flex justify-center py-12 col-span-full"><div class="loader"></div></div></div></section>';
}

function buildProduct(id) {
  var p = products.find(function(x) { return x._id === id; });
  if (!p) return '<div class="text-center py-20"><p class="text-gray-500">Product not found</p><button onclick="go(\'shop\')" class="mt-4 text-pink-500 font-bold text-sm">Back to Shop</button></div>';
  currentProduct = p;
  var img = (p.images && p.images[0]) || '';

  return '<section class="px-4 md:px-10 py-12 max-w-6xl mx-auto"><div class="grid grid-cols-1 md:grid-cols-2 gap-10">' +
    '<div class="rounded-2xl overflow-hidden bg-gray-800 h-80 md:h-[500px] bg-cover bg-center" style="background-image:url(' + img + ')"></div>' +
    '<div><div class="text-xs font-bold text-pink-500 uppercase tracking-wider mb-2">' + (p.category || 'Digital') + '</div>' +
    '<h1 class="text-3xl md:text-4xl font-black mb-4">' + p.name + '</h1>' +
    '<p class="text-gray-400 text-sm mb-6 leading-relaxed">' + (p.description || '') + '</p>' +
    '<div class="flex items-center gap-4 mb-8"><span class="text-3xl font-black text-pink-500">' + fmt(p.price) + '</span>' +
    (p.salePrice ? '<span class="text-lg text-gray-500 line-through">' + fmt(p.salePrice) + '</span>' : '') + '</div>' +
    '<div class="flex gap-3">' +
    '<button onclick="addToCart(currentProduct)" class="flex-1 bg-[#ff2d55] py-3.5 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-pink-600 transition">Add to Cart</button>' +
    '<button onclick="openCart()" class="px-6 py-3.5 rounded-md border border-gray-700 font-bold text-xs uppercase hover:bg-white/5 transition">View Cart</button></div>' +
    '<div class="mt-8 glass rounded-xl p-5"><h3 class="font-bold text-sm mb-3">Product Details</h3>' +
    '<div class="grid grid-cols-2 gap-3 text-xs text-gray-400">' +
    '<div><span class="block text-gray-600">Stock</span>' + (p.stock || 'Unlimited') + '</div>' +
    '<div><span class="block text-gray-600">Delivery</span>Instant Email</div>' +
    '<div><span class="block text-gray-600">Warranty</span>30 Days</div>' +
    '<div><span class="block text-gray-600">Support</span>' + '</div></div></section>'
}


function buildCheckout() {
  return '<section class="px-4 md:px-10 py-12 max-w-3xl mx-auto">' +
    '<h2 class="text-2xl font-black uppercase tracking-tight mb-8">Checkout</h2>' +
    '<div class="glass rounded-2xl p-6 mb-6"><h3 class="font-bold mb-4">Order Summary</h3>' +
    '<div class="space-y-3 mb-4">' +
    cart.map(function(i) {
      return '<div class="flex justify-between text-sm"><span>' + i.name + ' x' + i.qty + '</span><span class="font-bold">' + fmt(i.price * i.qty) + '</span></div>';
    }).join('') +
    '</div><div class="border-t border-gray-800 pt-3 flex justify-between font-bold"><span>Total</span><span class="text-pink-500">' + fmt(cartTotal()) + '</span></div>' +
    '<form onsubmit="handleCheckout(event)" class="space-y-4">' +
    '<input type="text" id="co-name" placeholder="Full Name *" required class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-pink-500">' +
    '<input type="email" id="co-email" placeholder="Email *" required class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-pink-500">' +
    '<input type="tel" id="co-phone" placeholder="Phone *" required class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-pink-500">' +
    '<textarea id="co-address" placeholder="Address *" required rows="3" class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-pink-500"></textarea>' +
    '<button type="submit" class="w-full bg-[#ff2d55] py-3.5 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-pink-600 transition">Place Order</button></form></section>';
}

async function handleCheckout(e) {
  e.preventDefault();
  if (!cart.length) { toast('Cart is empty', 'error'); return; }
  try {
    await api('/orders', {
      method: 'POST',
      body: {
        items: cart.map(function(i) { return { product: i._id, quantity: i.qty, price: i.price }; }),
        total: cartTotal(),
        shippingAddress: $('co-address').value,
        phone: $('co-phone').value
      }
    });
    toast('Order placed successfully!', 'success');
    clearCart();
    go('home');
  } catch (err) { toast(err.message, 'error'); }
}

function buildAbout() {
  return '<section class="px-4 md:px-10 py-16 max-w-4xl mx-auto text-center">' +
    '<h2 class="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6">About Us</h2>' +
    '<p class="text-gray-400 text-sm leading-relaxed mb-6">OTT24x7 is India\'s leading digital subscription marketplace. We provide instant access to premium streaming services, software licenses, gaming subscriptions, and cloud storage at unbeatable prices.</p>' +
    '<p class="text-gray-400 text-sm leading-relaxed mb-6">Founded in 2020, we have served over 50,000 customers with a 99% satisfaction rate. Our mission is to make digital products accessible and affordable for everyone.</p>' +
    '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">' +
    '<div class="glass rounded-xl p-5"><div class="text-2xl font-black text-pink-500">50K+</div><div class="text-xs text-gray-500 mt-1">Customers</div>' +
    '<div class="glass rounded-xl p-5"><div class="text-2xl font-black text-pink-500">100+</div><div class="text-xs text-gray-500 mt-1">Products</div>' +
    '<div class="glass rounded-xl p-5"><div class="text-2xl font-black text-pink-500">4.8</div><div class="text-xs text-gray-500 mt-1">Rating</div>' +
    '<div class="glass rounded-xl p-5"><div class="text-2xl font-black text-pink-500">24/7</div><div class="text-xs text-gray-500 mt-1">Support</div></div></section>';
}

function buildContact() {
  return '<section class="px-4 md:px-10 py-16 max-w-2xl mx-auto">' +
    '<h2 class="text-3xl font-black uppercase tracking-tight mb-8 text-center">Contact Us</h2>' +
    '<div class="glass rounded-2xl p-8 mb-8"><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">' +
    '<div class="flex items-center gap-3"><div class="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center"><i class="fas fa-envelope text-pink-500"></i></div>' +
    '<div><p class="text-xs text-gray-500">Email</p><p class="text-sm font-bold">support@ott24x7.com</p></div>' +
    '<div class="flex items-center gap-3"><div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center"><i class="fab fa-whatsapp text-green-500"></i></div>' +
    '<div><p class="text-xs text-gray-500">WhatsApp</p><p class="text-sm font-bold">+91 99999 99999</p></div></div>' +
    '<form onsubmit="handleContact(event)" class="space-y-4">' +
    '<input type="text" id="ct-name" placeholder="Name *" required class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-pink-500">' +
    '<input type="email" id="ct-email" placeholder="Email *" required class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-pink-500">' +
    '<textarea id="ct-msg" placeholder="Message *" required rows="4" class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-pink-500"></textarea>' +
    '<button type="submit" class="w-full bg-[#ff2d55] py-3.5 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-pink-600 transition">Send Message</button></form></div></section>';
}

async function handleContact(e) {
  e.preventDefault();
  try {
    await api('/contact', {
      method: 'POST',
      body: { name: $('ct-name').value, email: $('ct-email').value, message: $('ct-msg').value }
    });
    toast('Message sent!', 'success');
    $('ct-name').value = ''; $('ct-email').value = ''; $('ct-msg').value = '';
  } catch (err) { toast(err.message, 'error'); }
}

function buildFAQ() {
  var faqs = [
    {q: 'How does instant delivery work?', a: 'Once your payment is confirmed, your digital product key or login credentials are sent to your registered email within 5 minutes.'},
    {q: 'Are the subscriptions legitimate?', a: 'Yes, all our products are 100% genuine and sourced directly from authorized distributors.'},
    {q: 'What payment methods do you accept?', a: 'We accept UPI, Credit/Debit Cards, Net Banking, and all major wallets.'},
    {q: 'Do you offer refunds?', a: 'Yes, we offer a 7-day refund policy for unused products. Please contact support for assistance.'}
  ];
  return '<section class="px-4 md:px-10 py-16 max-w-3xl mx-auto">' +
    '<h2 class="text-3xl font-black uppercase tracking-tight mb-8 text-center">FAQ</h2>' +
    '<div class="space-y-3">' +
    faqs.map(function(f, i) {
      return '<div class="glass rounded-xl overflow-hidden">' +
        '<button onclick="this.nextElementSibling.classList.toggle(\'hidden\')" class="w-full text-left px-6 py-4 flex justify-between items-center">' +
        '<span class="text-sm font-bold">' + f.q + '</span><i class="fas fa-chevron-down text-gray-500 text-xs"></i></button>' +
        '<div class="hidden px-6 pb-4 text-sm text-gray-400 leading-relaxed">' + f.a + '</div>';
    }).join('') +
    '</div></section>';
}

function buildFooter() {
  $('main-footer').innerHTML = '<div class="border-t border-gray-800 px-4 md:px-10 py-12 max-w-7xl mx-auto">' +
    '<div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">' +
    '<div><div class="flex items-center gap-2 mb-4"><div class="w-8 h-8 bg-gradient-to-tr from-blue-500 to-pink-500 rounded-lg flex items-center justify-center"><i class="fas fa-play text-white text-[10px]"></i></div>' +
    '<span class="font-extrabold text-lg tracking-tighter uppercase">OTT24<span class="text-pink-500 font-black">x</span>7</span></div>' +
    '<p class="text-xs text-gray-500 leading-relaxed">Premium digital subscriptions at unbeatable prices. Instant delivery, 24/7 support.</p></div>' +
    '<div><h4 class="font-bold text-sm mb-4">Quick Links</h4><div class="space-y-2">' +
    ['home','shop','about','contact','faq'].map(function(v) {
      return '<button onclick="go(\'' + v + '\')" class="block text-xs text-gray-500 hover:text-white transition">' + v[0].toUpperCase() + v.slice(1) + '</button>';
    }).join('') + '</div>' +
    '<div><h4 class="font-bold text-sm mb-4">Support</h4><div class="space-y-2">' +
    '<a href="https://wa.me/919999999999" target="_blank" class="block text-xs text-gray-500 hover:text-white transition">WhatsApp</a>' +
    '<p class="text-xs text-gray-500">support@ott24x7.com</p></div>' +
    '<div><h4 class="font-bold text-sm mb-4">Legal</h4><div class="space-y-2">' +
    '<button onclick="toast(\'Coming soon!\')" class="block text-xs text-gray-500 hover:text-white transition">Privacy Policy</button>' +
    '<button onclick="toast(\'Coming soon!\')" class="block text-xs text-gray-500 hover:text-white transition">Terms of Service</button></div></div>' +
    '<div class="border-t border-gray-800 pt-6 text-center text-[10px] text-gray-600">&copy; 2024 OTT24x7. All rights reserved.</div>';
}

/* ================= INIT ================= */
async function init() {
  buildNav();
  buildDrawers();
  buildFooter();
  go('home');
  try {
    var d = await api('/products');
    products = d.products || d || [];
    if (currentView === 'home') buildHome();
    if (currentView === 'shop') buildShop();
  } catch (e) { console.log('API not available'); }
}

document.addEventListener('DOMContentLoaded', init);
