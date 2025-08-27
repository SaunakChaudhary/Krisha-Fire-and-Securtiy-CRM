const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseorder.controller');

router.post('/', purchaseOrderController.createPurchaseOrder);
router.get('/', purchaseOrderController.getPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrderById);
router.put('/:id', purchaseOrderController.updatePurchaseOrder);
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

module.exports = router;
