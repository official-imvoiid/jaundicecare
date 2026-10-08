import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEMO_ADMIN,
  DEMO_PARENT,
  DEMO_PHARMACIST,
  SEED_AUDIT_LOGS,
  SEED_MEDICINES,
  SEED_NOTIFICATIONS,
  SEED_ORDERS,
  SEED_PHARMACIES,
  SEED_PRESCRIPTIONS,
} from '../data/seed';
import type {
  AuditLog,
  Language,
  Medicine,
  NotificationItem,
  NotificationText,
  Order,
  OrderStatus,
  Prescription,
  Screening,
  UserRole,
} from '../domain/types';
import { en } from '../i18n/en';
import type { MessageKey } from '../i18n/en';
import { format } from '../i18n/format';
import { nextId } from '../logic/ids';
import { applyReviewToOrders, nextOrderStatus, orderItemsFrom } from '../logic/pharmacy';
import { loadState, saveState } from '../storage/history';
import { AppContext } from './appContext';
import type { AppContextValue, View } from './appContext';

/** localStorage, or null when the browser blocks it (private mode, strict settings). */
function browserStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const now = () => new Date().toISOString();

const ORDER_NOTES: Partial<Record<OrderStatus, MessageKey>> = {
  preparing: 'note.order.preparing',
  out_for_delivery: 'note.order.out_for_delivery',
  delivered: 'note.order.delivered',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadState(browserStore()));

  const [role, setRoleState] = useState<UserRole>('parent');
  const [view, setView] = useState<View>('home');
  const [language, setLanguageState] = useState<Language>(initial.language);

  const [screenings, setScreenings] = useState<Screening[]>(initial.screenings);
  const [currentId, setCurrentId] = useState<string | null>(null);
  // Assumed to work until a save is refused (blocked or full storage)
  const [historySaved, setHistorySaved] = useState(true);

  const [pharmacies, setPharmacies] = useState(SEED_PHARMACIES);
  const [medicines, setMedicines] = useState(SEED_MEDICINES);
  const [prescriptions, setPrescriptions] = useState(SEED_PRESCRIPTIONS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState(SEED_AUDIT_LOGS);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<AppContextValue>(() => {
    // Every change to history or language is written to the browser straight
    // away. When storage is full the oldest checks are dropped, and the list on
    // screen follows what was really saved.
    const keep = (nextScreenings: Screening[], nextLanguage: Language) => {
      const { saved, ok } = saveState(browserStore(), { screenings: nextScreenings, language: nextLanguage });
      setScreenings(saved.screenings);
      setLanguageState(saved.language);
      setHistorySaved(ok);
    };

    const notify = (note: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) =>
      setNotifications(list => [
        { ...note, id: nextId('NOTE', list.map(n => n.id)), timestamp: now(), read: false },
        ...list,
      ]);

    // Parents read notifications in their own language, so theirs carry dictionary keys
    const notifyParent = (text: NotificationText, type: NotificationItem['type']) =>
      notify({
        recipientRole: 'parent',
        title: format(en[text.title], text.values),
        message: format(en[text.message], text.values),
        text,
        type,
      });

    const audit = (entry: Omit<AuditLog, 'id' | 'timestamp'>) =>
      setAuditLogs(list => [{ ...entry, id: nextId('LOG', list.map(l => l.id)), timestamp: now() }, ...list]);

    return {
      role,
      view,
      language,
      go: setView,
      setRole: next => {
        setRoleState(next);
        if (next === 'pharmacist') setView('pharmacist');
        else if (next === 'admin') setView('admin');
        else setView(current => (current === 'pharmacist' || current === 'admin' ? 'home' : current));
      },
      setLanguage: next => keep(screenings, next),

      screenings,
      currentScreening: screenings.find(s => s.id === currentId) ?? null,
      historySaved,
      addScreening: input => {
        const screening: Screening = { ...input, id: nextId('SCR', screenings.map(s => s.id)), takenAt: now() };
        keep([screening, ...screenings], language);
        setCurrentId(screening.id);
        if (screening.analysis.indication === 'signs_seen') {
          notify({
            recipientRole: 'admin',
            title: 'Check with signs of jaundice',
            message: `Check ${screening.id} scored ${screening.analysis.score} out of 100.`,
            type: 'screening',
          });
        }
      },
      openScreening: setCurrentId,
      attachAnswers: (id, answers, advice) =>
        keep(screenings.map(s => (s.id === id ? { ...s, answers, advice } : s)), language),
      deleteScreening: id => keep(screenings.filter(s => s.id !== id), language),
      clearHistory: () => keep([], language),

      pharmacies,
      medicines,
      prescriptions,
      orders,
      notifications,
      auditLogs,
      activeOrderId,
      setActiveOrderId,
      createPrescription: input => {
        const prescription: Prescription = {
          ...input,
          id: nextId('RX', prescriptions.map(p => p.id)),
          parentName: DEMO_PARENT.name,
          parentPhone: DEMO_PARENT.phone,
          status: 'pending',
          createdAt: now(),
        };
        setPrescriptions([prescription, ...prescriptions]);
        notify({
          recipientRole: 'pharmacist',
          title: 'New prescription to check',
          message: `${prescription.parentName} sent prescription ${prescription.id}.`,
          type: 'prescription',
        });
        return prescription;
      },
      placeOrder: (prescription, deliveryAddress) => {
        const pharmacy = pharmacies.find(p => p.id === prescription.pharmacyId);
        const order: Order = {
          id: nextId('JC', orders.map(o => o.id)),
          parentName: prescription.parentName,
          parentPhone: prescription.parentPhone,
          pharmacyId: prescription.pharmacyId,
          pharmacyName: pharmacy?.name ?? '',
          prescriptionId: prescription.id,
          items: orderItemsFrom(prescription.medicines, medicines, prescription.pharmacyId),
          deliveryAddress,
          status: 'under_review',
          createdAt: now(),
          updatedAt: now(),
        };
        setOrders([order, ...orders]);
        setActiveOrderId(order.id);
        notify({
          recipientRole: 'pharmacist',
          title: 'New order',
          message: `Order ${order.id} is waiting for prescription ${prescription.id} to be checked.`,
          type: 'order',
        });
      },
      reviewPrescription: (id, status, notes) => {
        setPrescriptions(list => list.map(p => (p.id === id ? { ...p, status, pharmacistNotes: notes } : p)));
        setOrders(list => applyReviewToOrders(list, id, status, now()));
        audit({
          user: DEMO_PHARMACIST.name,
          role: 'pharmacist',
          action: status === 'verified' ? 'Prescription approved' : 'Prescription rejected',
          details: `Prescription ${id}. ${notes}`.trim(),
        });
        notifyParent(
          status === 'verified'
            ? { title: 'note.rxApproved.title', message: 'note.rxApproved.body', values: { id } }
            : { title: 'note.rxRejected.title', message: 'note.rxRejected.body', values: { id, notes } },
          'prescription',
        );
      },
      advanceOrder: id => {
        const order = orders.find(o => o.id === id);
        const next = order && nextOrderStatus(order.status);
        if (!order || !next) return;
        setOrders(list => list.map(o => (o.id === id ? { ...o, status: next, updatedAt: now() } : o)));
        const message = ORDER_NOTES[next];
        if (message) notifyParent({ title: 'note.order.title', message, values: { id } }, 'order');
      },
      addMedicine: medicine =>
        setMedicines(list => [{ ...medicine, id: nextId('MED', list.map(m => m.id)) }, ...list]),
      addStock: (id, quantity) =>
        setMedicines(list =>
          list.map((m: Medicine) => (m.id === id ? { ...m, availableQuantity: m.availableQuantity + quantity } : m)),
        ),
      deleteMedicine: id => setMedicines(list => list.filter(m => m.id !== id)),
      approvePharmacy: id => {
        const pharmacy = pharmacies.find(p => p.id === id);
        setPharmacies(list => list.map(p => (p.id === id ? { ...p, verified: true } : p)));
        if (pharmacy) {
          audit({ user: DEMO_ADMIN.name, role: 'admin', action: 'Pharmacy approved', details: `Approved ${pharmacy.name}.` });
        }
      },
      markNotificationRead: id =>
        setNotifications(list => list.map(n => (n.id === id ? { ...n, read: true } : n))),
    };
  }, [
    role, view, language, screenings, currentId, historySaved,
    pharmacies, medicines, prescriptions, orders, notifications, auditLogs, activeOrderId,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
