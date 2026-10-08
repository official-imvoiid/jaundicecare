import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyReviewToOrders,
  nextOrderStatus,
  orderItemsFrom,
  orderTotal,
  unreadFor,
} from '../src/logic/pharmacy.ts';
import { nextId } from '../src/logic/ids.ts';
import type { Medicine, NotificationItem, Order } from '../src/domain/types.ts';

const medicine = (name: string, genericName: string, price: number, pharmacyId = 'pharm_1'): Medicine => ({
  id: name,
  name,
  genericName,
  category: 'test',
  pack: '1',
  availableQuantity: 10,
  batchNumber: 'B1',
  expiryDate: '2028-01-01',
  price,
  prescriptionRequired: false,
  pharmacyId,
});

const inventory = [
  medicine('Vitamin D3 drops 400 IU/ml', 'Cholecalciferol', 95),
  medicine('Paracetamol paediatric drops 100 mg/ml', 'Paracetamol', 38),
  medicine('ORS sachet 21 g', 'Oral rehydration salts', 22, 'pharm_2'),
];

const order = (id: string, prescriptionId: string, status: Order['status']): Order => ({
  id,
  parentName: 'Priya Sharma',
  parentPhone: '+91 90000 12345',
  pharmacyId: 'pharm_1',
  pharmacyName: 'Sanjeevani Medical Store',
  prescriptionId,
  items: [],
  deliveryAddress: 'Jaipur',
  status,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
});

test('an order moves verified -> preparing -> out for delivery -> delivered', () => {
  assert.equal(nextOrderStatus('verified'), 'preparing');
  assert.equal(nextOrderStatus('preparing'), 'out_for_delivery');
  assert.equal(nextOrderStatus('out_for_delivery'), 'delivered');
});

test('an order cannot move while its prescription is unchecked, or after it has ended', () => {
  assert.equal(nextOrderStatus('under_review'), null);
  assert.equal(nextOrderStatus('delivered'), null);
  assert.equal(nextOrderStatus('cancelled'), null);
});

test('a typed medicine that is part of a stocked name gets that price', () => {
  const items = orderItemsFrom(['vitamin d3 drops'], inventory, 'pharm_1');
  assert.deepEqual(items, [{ name: 'vitamin d3 drops', quantity: 1, price: 95 }]);
});

test('a typed medicine is matched by its generic name too', () => {
  const [item] = orderItemsFrom(['Paracetamol drops 100mg'], inventory, 'pharm_1');
  assert.equal(item.price, 38);
});

test('a medicine the pharmacy does not stock has no price yet', () => {
  const [item] = orderItemsFrom(['Glycerin suppository'], inventory, 'pharm_1');
  assert.deepEqual(item, { name: 'Glycerin suppository', quantity: 1, price: null });
});

test('stock of another pharmacy is not used for the price', () => {
  const [item] = orderItemsFrom(['ORS sachet'], inventory, 'pharm_1');
  assert.equal(item.price, null);
});

test('blank lines and stray spaces in the typed list are ignored', () => {
  const items = orderItemsFrom(['  Vitamin D3 drops  ', '', '   '], inventory, 'pharm_1');
  assert.deepEqual(items.map(i => i.name), ['Vitamin D3 drops']);
});

test('the estimated total adds only the prices that are known', () => {
  assert.equal(
    orderTotal([
      { name: 'a', quantity: 2, price: 95 },
      { name: 'b', quantity: 1, price: null },
      { name: 'c', quantity: 1, price: 38 },
    ]),
    228,
  );
});

test('approving a prescription moves its waiting order to verified', () => {
  const orders = [order('A', 'RX-1', 'under_review'), order('B', 'RX-2', 'under_review')];
  const updated = applyReviewToOrders(orders, 'RX-1', 'verified', '2026-10-02T00:00:00.000Z');
  assert.equal(updated[0].status, 'verified');
  assert.equal(updated[0].updatedAt, '2026-10-02T00:00:00.000Z');
  assert.equal(updated[1].status, 'under_review');
});

test('rejecting a prescription cancels its waiting order', () => {
  const [updated] = applyReviewToOrders([order('A', 'RX-1', 'under_review')], 'RX-1', 'rejected', 'now');
  assert.equal(updated.status, 'cancelled');
});

test('a review never changes an order that has already moved on', () => {
  const [updated] = applyReviewToOrders([order('A', 'RX-1', 'preparing')], 'RX-1', 'rejected', 'now');
  assert.equal(updated.status, 'preparing');
});

test('each role only sees its own unread notifications', () => {
  const note = (id: string, recipientRole: NotificationItem['recipientRole'], read: boolean): NotificationItem => ({
    id, recipientRole, read, title: id, message: id, timestamp: '2026-10-01T10:00:00.000Z', type: 'order',
  });
  const all = [note('a', 'parent', false), note('b', 'pharmacist', false), note('c', 'parent', true), note('d', 'admin', false)];
  assert.deepEqual(unreadFor(all, 'parent').map(n => n.id), ['a']);
  assert.deepEqual(unreadFor(all, 'pharmacist').map(n => n.id), ['b']);
  assert.deepEqual(unreadFor(all, 'admin').map(n => n.id), ['d']);
});

test('the first id of a kind starts at 1001', () => {
  assert.equal(nextId('SCR', []), 'SCR-1001');
});

test('a new id is one above the highest id of the same kind', () => {
  assert.equal(nextId('SCR', ['SCR-1001', 'SCR-1007', 'RX-9082']), 'SCR-1008');
  assert.equal(nextId('RX', ['SCR-1001', 'RX-9082', 'RX-8821']), 'RX-9083');
});

test('ids that do not follow the pattern are ignored', () => {
  assert.equal(nextId('JC', ['JC-abc', 'JC-', 'XJC-5000']), 'JC-1001');
});
