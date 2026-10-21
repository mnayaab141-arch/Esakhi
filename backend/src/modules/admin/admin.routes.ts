import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { adminDashboard, getCustomer, listCustomerOrders, listCustomers, updateCustomerRole, updateCustomerStatus } from './admin.controller.js';

export const adminRoutes = Router();
adminRoutes.use(requireAuth, requireRole('admin'));
adminRoutes.get('/dashboard', adminDashboard);
adminRoutes.get('/customers', listCustomers);
adminRoutes.get('/customers/:customerId', getCustomer);
adminRoutes.get('/customers/:customerId/orders', listCustomerOrders);
adminRoutes.patch('/users/:userId/role', updateCustomerRole);
adminRoutes.patch('/users/:userId/status', updateCustomerStatus);
