import os

filepath = r'c:\Users\Lenovo\Downloads\NivaBackend\website\app.js'

# Read current file
with open(filepath, 'r', encoding='utf-8') as f:
    js = f.read()

# Check if file is broken
if js.rstrip().endswith('24/7'):
    # Find where to truncate
    idx = js.rfind("'<div><span class=\\\"block text-gray-600\\\">Support</span>24/7")
    if idx < 0:
        idx = js.rfind('24/7')
    # Truncate and fix
    js = js[:idx] + "' + '</div></div></section>'\n}\n\n"
    
    # Append all remaining functions
    remaining = r'''
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
'''
    # Write complete file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(js + remaining)
    print('SUCCESS: Fixed app.js')
else:
    print('File appears complete, no fix needed')
