import { Router } from 'express';
import * as workerController from '../controllers/workerController';
import * as inventoryController from '../controllers/inventoryController';
import * as salesController from '../controllers/salesController';
import * as statsController from '../controllers/statsController';

const router = Router();

// Workers & Attendance
router.get('/workers', workerController.getWorkers);
router.post('/workers', workerController.createWorker);
router.get('/attendance', workerController.getAttendance);
router.post('/attendance', workerController.logAttendance);
router.get('/salaries/calculate', workerController.calculateSalary);

// Inventory & Materials
router.get('/materials', inventoryController.getMaterials);
router.post('/materials', inventoryController.createMaterial);
router.get('/purchases', inventoryController.getPurchases);
router.post('/purchases', inventoryController.createPurchase);
router.get('/inventory/stock', inventoryController.getStockLevels);

// Sales
router.get('/sales', salesController.getSales);
router.post('/sales', salesController.createSales);
router.delete('/sales/:id', salesController.deleteSales);

// Stats & Dashboard
router.get('/stats/profit-loss', statsController.getProfitLoss);
router.get('/stats/dashboard', statsController.getDashboardStats);

export default router;
