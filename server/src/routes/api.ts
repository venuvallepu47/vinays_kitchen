import express from 'express';
import {
    getVendors, getVendorById, createVendor, updateVendor, deleteVendor
} from '../controllers/vendorController';
import {
    createBill, updateBill, getVendorLedger, deleteBill, createPayment, updatePayment, deletePayment, getBill
} from '../controllers/vendorBillController';
import {
    getMaterials, createMaterial, updateMaterial, deleteMaterial,
    getMaterialPurchases, logPurchase, getAllPurchases, deletePurchase, updatePurchase,
    logUsage, getMaterialUsage, updateUsage, deleteUsage, purchaseMaterial
} from '../controllers/materialController';
import {
    getSales, createSale, updateSale, deleteSale
} from '../controllers/salesController';
import {
    getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker,
    getAttendanceByDate, markAttendance
} from '../controllers/workerController';
import {
    getSalaryPayments, logSalaryPayment, deleteSalaryPayment, updateSalaryPayment
} from '../controllers/salaryController';
import {
    getExpenses, createExpense, updateExpense, deleteExpense
} from '../controllers/expenseController';
import {
    getDashboardStats, getProfitLoss
} from '../controllers/statsController';
import {
    getSettings, updateSettings
} from '../controllers/settingsController';

const router = express.Router();

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Vendors
router.get('/vendors', getVendors);
router.get('/vendors/:id', getVendorById);
router.post('/vendors', createVendor);
router.put('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);

// Vendor Bills & Payments (credit/dues tracking)
router.get('/vendors/:id/ledger', getVendorLedger);
router.post('/vendors/:id/bills', createBill);
router.put('/vendor-bills/:id', updateBill);
router.get('/vendor-bills/:id', getBill);
router.delete('/vendor-bills/:id', deleteBill);
router.post('/vendors/:id/payments', createPayment);
router.put('/vendor-payments/:id', updatePayment);
router.delete('/vendor-payments/:id', deletePayment);

// Materials
router.get('/materials', getMaterials);
router.post('/materials', createMaterial);
router.post('/materials/:id/purchase', purchaseMaterial);
router.put('/materials/:id', updateMaterial);
router.delete('/materials/:id', deleteMaterial);
router.get('/materials/:id/purchases', getMaterialPurchases);
router.get('/materials/:id/usage', getMaterialUsage);

// Purchases (all + per-material)
router.get('/purchases', getAllPurchases);
router.post('/purchases', logPurchase);
router.put('/purchases/:id', updatePurchase);
router.delete('/purchases/:id', deletePurchase);

// Usage
router.post('/usage', logUsage);
router.put('/usage/:id', updateUsage);
router.delete('/usage/:id', deleteUsage);

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
router.put('/salary-payments/:id', updateSalaryPayment);
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
