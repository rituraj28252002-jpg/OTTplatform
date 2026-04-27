const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.createOrder = async (req, res) => {
  try {
    const { billingDetails, paymentMethod, whatsappOrder } = req.body;
    let items, total;

    if (whatsappOrder && req.body.items) {
      items = req.body.items.map(i => ({ product: i.productId, name: i.name, quantity: i.quantity, price: i.price }));
      total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    } else {
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });
      items = cart.items.map(i => ({ product: i.product._id, name: i.product.name, quantity: i.quantity, price: i.price }));
      total = cart.total;
    }

    const order = new Order({
      user: req.user._id,
      items,
      total,
      billingDetails,
      paymentMethod: paymentMethod || 'upi',
      whatsappOrder: whatsappOrder || false
    });
    await order.save();

    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    if (!whatsappOrder) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], total: 0 });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

