const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/top-rated', productController.getTopRated);
router.get('/:id', productController.getProduct);
router.post('/', auth, adminAuth, productController.createProduct);
router.put('/:id', auth, adminAuth, productController.updateProduct);
router.delete('/:id', auth, adminAuth, productController.deleteProduct);

module.exports = router;

