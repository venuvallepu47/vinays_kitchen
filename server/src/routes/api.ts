import express from 'express';
import {
    getVendors, getVendorById, createVendor, updateVendor, deleteVendor
} from '../controllers/vendorController';
import {
    getMaterials, createMaterial, updateMaterial, deleteMaterial,
    getMaterialPurchases, logPurchase, getAllPurchases, deletePurchase,
    logUsage, getMaterialUsage
} from '../controllers/materialController';
import {
    getSales, createSale, updateSale, deleteSale
} from '../controllers/salesController';
import {
    getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker,
    getAttendanceByDate, markAttendance
} from '../controllers/workerController';
import {
    getSalaryPayments, logSalaryPayment, deleteSalaryPayment
} from '../controllers/salaryController';
import {
    getExpenses, createExpense, updateExpense, deleteExpense
} from '../controllers/expenseController';
import {
    getDashboardStats, getProfitLoss
} from '../controllers/statsController';

const router = express.Router();

// Vendors
router.get('/vendors', getVendors);
router.get('/vendors/:id', getVendorById);
router.post('/vendors', createVendor);
router.put('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);

// Materials
router.get('/materials', getMaterials);
router.post('/materials', createMaterial);
router.put('/materials/:id', updateMaterial);
router.delete('/materials/:id', deleteMaterial);
router.get('/materials/:id/purchases', getMaterialPurchases);
router.get('/materials/:id/usage', getMaterialUsage);

// Purchases (all + per-material)
router.get('/purchases', getAllPurchases);
router.post('/purchases', logPurchase);
router.delete('/purchases/:id', deletePurchase);

// Usage
router.post('/usage', logUsage);

// Sales
router.get('/sales', getSales);
router.post('/sales', createSale);
router.put('/sales/:id', updateSale);
router.delete('/sales/:id', deleteSale);

// Workers
router.get('/workers', getWorkers);
router.get('/workers/:id', getWorkerById);
router.post('/workers', createWorker);
router.put('/workers/:id', updateWorker);
router.delete('/workers/:id', deleteWorker);

// Attendance
router.get('/attendance', getAttendanceByDate);
router.post('/attendance', markAttendance);

// Salary Payments
router.get('/salary-payments', getSalaryPayments);
router.post('/salary-payments', logSalaryPayment);
router.delete('/salary-payments/:id', deleteSalaryPayment);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// Stats
router.get('/stats/dashboard', getDashboardStats);
router.get('/stats/profit-loss', getProfitLoss);

export default router;
