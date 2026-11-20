// src/services/mockDb.js
import { DEFAULT_ROLES } from '../lib/rbac';

const INITIAL_STAGES = [
    { id: 'pis', name: 'PIS', sequence: 1, color: 'amber', isParallel: false, active: true },
    { id: 'artwork', name: 'Artwork', sequence: 2, color: 'purple', isParallel: false, active: true },
    { id: 'pm_supply', name: 'PM Supply', sequence: 3, color: 'sky', isParallel: false, active: true },
    { id: 'production', name: 'Production', sequence: 4, color: 'orange', isParallel: false, active: true },
    { id: 'qc', name: 'QC', sequence: 5, color: 'lime', isParallel: false, active: true },
    { id: 'packing', name: 'Packing', sequence: 6, color: 'teal', isParallel: false, active: true },
    { id: 'dispatch', name: 'Dispatch', sequence: 7, color: 'rose', isParallel: false, active: true },
    { id: 'dispatched', name: 'Dispatched', sequence: 8, color: 'emerald', isParallel: false, active: true },
];

const INITIAL_ORDERS = [
    { id: 'ord-1', orderNo: 'RED-BT-2026-11-0001', party: 'demo', brand: 'FLIXIN-400 (CEFIXIME TABLETS USP 400 MG)', plant: 'Beta', orderDate: '2026-11-18', stageId: 'cancelled', status: 'Cancelled', qaPending: false },
    { id: 'ord-2', orderNo: 'RED-BT-2026-08-0002', party: 'WELLONA', brand: 'FLIXIN-400 (CEFIXIME TABLETS USP 400 MG)', plant: 'Beta', orderDate: '2026-08-28', stageId: 'artwork', status: 'Active', qaPending: false },
    { id: 'ord-3', orderNo: 'RED-GT-2026-09-0002', party: 'WELLONA', brand: 'WELLMET-500 (METFORMIN 500 MG BP TABLETS)', plant: 'General', orderDate: '2026-09-20', stageId: 'qc', status: 'Active', qaPending: true },
    { id: 'ord-4', orderNo: 'RED-GT-2026-09-0001', party: 'Bhavin Test', brand: 'WELLPAR-500 (PARACETAMOL TABLETS 500 MG BP)', plant: 'General', orderDate: '2026-09-14', stageId: 'pm_supply', status: 'Active', qaPending: true },
    { id: 'ord-5', orderNo: 'RED-BC-2026-08-0001', party: 'WELLONA', brand: 'CEFIXIM-400 (CEFIXIME CAPSULES 400 MG)', plant: 'Beta', orderDate: '2026-08-28', stageId: 'artwork', status: 'Active', qaPending: false },
    { id: 'ord-6', orderNo: 'RED-GC-2026-08-0002', party: 'WEEFSEL PHARMA', brand: 'PANOMILL D (Pantoprazole Sodium 40mg And Domperidone 30mg)', plant: 'General', orderDate: '2026-08-30', stageId: 'pm_supply', status: 'Active', qaPending: false },
    { id: 'ord-7', orderNo: 'RED-GE-2026-08-0003', party: 'WELLONA', brand: 'WELLODIN (POVIDONE IODINE SOLUTION 10% W/V BP)', plant: 'General', orderDate: '2026-08-28', stageId: 'pis', status: 'Active', qaPending: false },
    { id: 'ord-8', orderNo: 'RED-GE-2026-08-0002', party: 'WELLONA', brand: 'KETOWELL CREAM (KETOCONAZOLE CREAM BP 2% W/W)', plant: 'General', orderDate: '2026-08-28', stageId: 'pis', status: 'Active', qaPending: false },
    { id: 'ord-9', orderNo: 'RED-BT-2026-08-0001', party: 'AFRINEXT OVERSEAS PVT LTD', brand: 'CEFIXIME TABLETS 200 MG', plant: 'Beta', orderDate: '2026-08-18', stageId: 'dispatched', status: 'Dispatched', qaPending: true },
    { id: 'ord-10', orderNo: 'RED-GT-2026-08-0004', party: 'WELLONA', brand: 'PARACETAMOL 650 MG', plant: 'General', orderDate: '2026-08-15', stageId: 'dispatched', status: 'Dispatched', qaPending: false },
];

const INITIAL_USERS = [
    { id: 'usr-admin-1', name: 'Admin', email: 'info@rednexpharma.com', roleId: 'admin', accountScope: 'full_app', plantAccess: 'All', status: 'Active', updatedAt: '2026-11-01T09:00:00Z' },
    { id: 'usr-qa-1', name: 'QA', email: 'qa.2022rednex@gmail.com', roleId: 'qa', accountScope: 'full_app', plantAccess: 'All', status: 'Active', updatedAt: '2026-11-02T09:00:00Z' },
    { id: 'usr-qc-1', name: 'QC', email: 'qc.rednex@gmail.com', roleId: 'qc', accountScope: 'full_app', plantAccess: 'All', status: 'Active', updatedAt: '2026-11-02T09:00:00Z' },
    { id: 'usr-des-1', name: 'Artwork', email: 'design.rednex@gmail.com', roleId: 'designer', accountScope: 'full_app', plantAccess: 'All', status: 'Active', updatedAt: '2026-11-02T09:00:00Z' },
    { id: 'usr-ppmc-1', name: 'PPMC', email: 'rmpmstatus.rednex@gmail.com', roleId: 'ppmc', accountScope: 'full_app', plantAccess: 'All', status: 'Active', updatedAt: '2026-11-03T09:00:00Z' },
    { id: 'usr-prod-1', name: 'Production', email: 'productions.rednex@gmail.com', roleId: 'production', accountScope: 'full_app', plantAccess: 'Beta', status: 'Active', updatedAt: '2026-11-03T09:00:00Z' },
    { id: 'usr-pack-1', name: 'Packing', email: 'dispatchrednex@gmail.com', roleId: 'packing', accountScope: 'full_app', plantAccess: 'All', status: 'Active', updatedAt: '2026-11-03T09:00:00Z' },
    { id: 'usr-disp-1', name: 'Dispatch', email: 'acc.rednex@gmail.com', roleId: 'dispatch', accountScope: 'full_app', plantAccess: 'All', status: 'Active', updatedAt: '2026-11-03T09:00:00Z' },
    { id: 'usr-pur-1', name: 'Purchase', email: 'purchase.rednex@gmail.com', roleId: 'purchase', accountScope: 'full_app', plantAccess: 'All', status: 'Inactive', updatedAt: '2026-11-04T09:00:00Z' },
    { id: 'usr-dr-1', name: 'SIYA', email: 'siya@gmail.com', roleId: 'qa', accountScope: 'daily_reporting_only', plantAccess: 'General', status: 'Active', updatedAt: '2026-11-05T09:00:00Z' },
];

export const mockDb = {
    stages: structuredClone(INITIAL_STAGES),
    orders: structuredClone(INITIAL_ORDERS),
    users: structuredClone(INITIAL_USERS),
    roles: structuredClone(DEFAULT_ROLES),
};

export function resetMockDb() {
    mockDb.stages = structuredClone(INITIAL_STAGES);
    mockDb.orders = structuredClone(INITIAL_ORDERS);
    mockDb.users = structuredClone(INITIAL_USERS);
    mockDb.roles = structuredClone(DEFAULT_ROLES);
}