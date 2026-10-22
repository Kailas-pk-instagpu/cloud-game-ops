/**
 * Mock billing service layer. Swap each function body for a real API call later —
 * the signatures are the contract the UI depends on.
 */
import jsPDF from 'jspdf';

export type ChargeStatus = 'due' | 'overdue' | 'paid';

export interface Charge {
  id: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  description: string;
  hours: number;
  rate: number; // MYR per hour
  amount: number;
  dueDate: string;
  status: ChargeStatus;
  paymentRef?: string;
}

export interface Payment {
  id: string;
  branchId: string;
  date: string;
  reference: string;
  amount: number;
  status: 'success' | 'failed';
  chargeIds: string[];
  invoiceNumber: string;
}

export interface DuitNowQr {
  reference: string;
  qrPayload: string;
  amount: number;
  branchId: string;
  chargeIds: string[];
  expiresAt: number;
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

export interface InvoiceContext {
  branchName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  ownerAddress?: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const iso = (d: Date) => d.toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;

const charges: Charge[] = [];
const payments: Payment[] = [];
const seeded = new Set<string>();
const qrs = new Map<string, DuitNowQr & { createdAt: number }>();

function seed(branchId: string) {
  if (seeded.has(branchId)) return;
  seeded.add(branchId);
  const seedNum = branchId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rate = 6 + (seedNum % 5);
  const today = new Date();
  const paidGroups: Record<string, Charge[]> = {};
  for (let i = 75; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const hours = round2(20 + ((seedNum * (i + 3)) % 60) + ((i * 7) % 10) / 10);
    const due = new Date(d);
    due.setDate(d.getDate() + 7);
    const status: ChargeStatus = i > 10 ? 'paid' : due < today ? 'overdue' : 'due';
    const c: Charge = {
      id: `${branchId}-${iso(d)}`,
      branchId,
      date: iso(d),
      description: `GPU usage · ${iso(d)}`,
      hours,
      rate,
      amount: round2(hours * rate),
      dueDate: iso(due),
      status,
    };
    charges.push(c);
    if (status === 'paid') {
      const key = iso(d).slice(0, 7) + (d.getDate() <= 15 ? 'a' : 'b');
      (paidGroups[key] ||= []).push(c);
    }
  }
  Object.values(paidGroups).forEach((group, idx) => {
    const last = group[group.length - 1];
    const payDate = new Date(last.date);
    payDate.setDate(payDate.getDate() + 2);
    const reference = `DN${(seedNum * 1000 + idx).toString().padStart(8, '0')}`;
    group.forEach((g) => (g.paymentRef = reference));
    payments.push({
      id: `${branchId}-p${idx}`,
      branchId,
      date: payDate.toISOString(),
      reference,
      amount: round2(group.reduce((s, g) => s + g.amount, 0)),
      status: 'success',
      chargeIds: group.map((g) => g.id),
      invoiceNumber: `INV-${branchId.toUpperCase().slice(0, 6)}-${String(idx + 1).padStart(4, '0')}`,
    });
  });
}

export async function getDuePayments(branchId: string): Promise<Charge[]> {
  seed(branchId);
  await delay(400);
  return charges.filter((c) => c.branchId === branchId && c.status !== 'paid').map((c) => ({ ...c }));
}

export async function getUsage(branchId: string, month: string): Promise<Charge[]> {
  seed(branchId);
  await delay(350);
  return charges.filter((c) => c.branchId === branchId && c.date.startsWith(month)).map((c) => ({ ...c }));
}

export async function getPaymentHistory(branchId: string): Promise<Payment[]> {
  seed(branchId);
  await delay(350);
  return payments.filter((p) => p.branchId === branchId).sort((a, b) => b.date.localeCompare(a.date)).map((p) => ({ ...p }));
}

export async function createDuitNowQr(branchId: string, chargeIds: string[]): Promise<DuitNowQr> {
  await delay(500);
  const amount = round2(charges.filter((c) => chargeIds.includes(c.id)).reduce((s, c) => s + c.amount, 0));
  if (!amount) throw new Error('Nothing to pay');
  const reference = `DN${Date.now().toString().slice(-10)}`;
  const qr: DuitNowQr = {
    reference,
    amount,
    branchId,
    chargeIds,
    qrPayload: `00020101021226580014A000000615000101068900000208${reference}5303458540${amount.toFixed(2)}5802MY6304`,
    expiresAt: Date.now() + 90_000,
  };
  qrs.set(reference, { ...qr, createdAt: Date.now() });
  return qr;
}

/** Mock: payment succeeds ~10s after the QR is created; ~10% chance of failure. */
export async function getPaymentStatus(reference: string): Promise<{ status: PaymentStatus; payment?: Payment }> {
  await delay(200);
  const qr = qrs.get(reference);
  if (!qr) return { status: 'failed' };
  const existing = payments.find((p) => p.reference === reference);
  if (existing) return { status: 'success', payment: { ...existing } };
  if (Date.now() > qr.expiresAt) return { status: 'expired' };
  if (Date.now() - qr.createdAt < 10_000) return { status: 'pending' };
  if (Math.random() < 0.1) {
    qrs.delete(reference);
    return { status: 'failed' };
  }
  const count = payments.filter((p) => p.branchId === qr.branchId).length;
  const payment: Payment = {
    id: `${qr.branchId}-p${Date.now()}`,
    branchId: qr.branchId,
    date: new Date().toISOString(),
    reference,
    amount: qr.amount,
    status: 'success',
    chargeIds: qr.chargeIds,
    invoiceNumber: `INV-${qr.branchId.toUpperCase().slice(0, 6)}-${String(count + 1).padStart(4, '0')}`,
  };
  payments.push(payment);
  charges.forEach((c) => {
    if (qr.chargeIds.includes(c.id)) {
      c.status = 'paid';
      c.paymentRef = reference;
    }
  });
  return { status: 'success', payment: { ...payment } };
}

export async function getInvoicePdf(paymentId: string, ctx: InvoiceContext): Promise<Blob> {
  await delay(300);
  const p = payments.find((x) => x.id === paymentId);
  if (!p) throw new Error('Invoice not found');
  const items = charges.filter((c) => p.chargeIds.includes(c.id)).sort((a, b) => a.date.localeCompare(b.date));
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(18);
  doc.text('Insta GPU — Invoice', 14, y);
  doc.setFontSize(10);
  y += 10;
  const line = (l: string, r = '') => {
    doc.text(l, 14, y);
    if (r) doc.text(r, 196, y, { align: 'right' });
    y += 6;
  };
  line(`Invoice number: ${p.invoiceNumber}`, `Payment date: ${new Date(p.date).toLocaleDateString('en-MY')}`);
  line(`Branch: ${ctx.branchName}`, `Payment reference: ${p.reference}`);
  line(`Billing period: ${items[0]?.date ?? '-'} to ${items[items.length - 1]?.date ?? '-'}`);
  y += 4;
  doc.setFontSize(11);
  line('Billed to');
  doc.setFontSize(10);
  line(ctx.ownerName);
  line(ctx.ownerEmail);
  if (ctx.ownerPhone) line(ctx.ownerPhone);
  if (ctx.ownerAddress) line(ctx.ownerAddress);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 14, y);
  doc.text('Hours', 90, y, { align: 'right' });
  doc.text('Rate (RM/h)', 135, y, { align: 'right' });
  doc.text('Amount (RM)', 196, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 2;
  doc.line(14, y, 196, y);
  y += 5;
  items.forEach((c) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(c.date, 14, y);
    doc.text(c.hours.toFixed(2), 90, y, { align: 'right' });
    doc.text(c.rate.toFixed(2), 135, y, { align: 'right' });
    doc.text(c.amount.toFixed(2), 196, y, { align: 'right' });
    y += 6;
  });
  doc.line(14, y, 196, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: RM ${p.amount.toFixed(2)}`, 196, y, { align: 'right' });
  return doc.output('blob');
}
