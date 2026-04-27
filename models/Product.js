const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  category: { type: String, required: true, enum: ['Streaming', 'Software', 'Storage', 'Gaming', 'VPN', 'Antivirus', 'Education', 'Other'] },
  image: { type: String, default: '' },
  iconClass: { type: String, default: 'fas fa-box' },
  iconColor: { type: String, default: '#ff2d55' },
  stock: { type: Number, default: 100, min: 0 },
  rating: { type: Number, default: 5, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },
  badge: { type: String, default: '' },
  badgeColor: { type: String, default: 'bg-red-600' },
  inStock: { type: Boolean, default: true },
  onSale: { type: Boolean, default: false },
  features: [{ type: String }],
  deliveryInfo: { type: String, default: 'Instant digital delivery via email within 5 minutes.' },
  tags: [{ type: String }]
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);

