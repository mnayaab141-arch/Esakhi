import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
  addInternalNote,
  assignDeliveryPartner,
  createOrderController,
  getAdminOrder,
  getMyOrder,
  listAdminOrders,
  listMyOrders,
  requestOrderCancellation,
  reviewCancellation,
  reviewPayment,
  updateFulfilmentStatus,
} from './order.controller.js';

export const customerOrderRoutes = Router();
export const adminOrderRoutes = Router();

customerOrderRoutes.use(requireAuth);
customerOrderRoutes.post('/', createOrderController);
customerOrderRoutes.get('/', listMyOrders);
customerOrderRoutes.get('/:id', getMyOrder);
customerOrderRoutes.post('/:id/cancellation-requests', requestOrderCancellation);

adminOrderRoutes.use(requireAuth, requireRole('admin', 'staff'));
adminOrderRoutes.get('/', listAdminOrders);
adminOrderRoutes.get('/:id', getAdminOrder);
adminOrderRoutes.patch('/:id/fulfilment', updateFulfilmentStatus);
adminOrderRoutes.put('/:id/delivery-partner', assignDeliveryPartner);
adminOrderRoutes.post('/:id/notes', requireRole('admin', 'staff'), addInternalNote);
adminOrderRoutes.post('/:id/payment-review', requireRole('admin'), reviewPayment);
adminOrderRoutes.post('/:id/cancellation-review', requireRole('admin'), reviewCancellation);
