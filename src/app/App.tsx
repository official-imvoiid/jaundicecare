import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { Footer } from '../layout/Footer';
import { Header } from '../layout/Header';
import { AdminDashboard } from '../screens/admin/AdminDashboard';
import { CheckPage } from '../screens/check/CheckPage';
import { HistoryPage } from '../screens/history/HistoryPage';
import { HomePage } from '../screens/home/HomePage';
import { OrdersPage } from '../screens/orders/OrdersPage';
import { PharmacistDashboard } from '../screens/pharmacist/PharmacistDashboard';
import { PrescriptionPage } from '../screens/prescription/PrescriptionPage';
import { QuestionsPage } from '../screens/questions/QuestionsPage';
import { ResultPage } from '../screens/result/ResultPage';
import { AppProvider } from '../state/AppProvider';
import { useApp } from '../state/appContext';
import type { View } from '../state/appContext';

const SCREENS: Record<View, () => JSX.Element> = {
  home: HomePage,
  check: CheckPage,
  result: ResultPage,
  questions: QuestionsPage,
  history: HistoryPage,
  prescription: PrescriptionPage,
  orders: OrdersPage,
  pharmacist: PharmacistDashboard,
  admin: AdminDashboard,
};

function Shell() {
  const { view } = useApp();
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // A new screen starts at the top, and keyboard and screen-reader users land on its content
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [view]);

  const Screen = SCREENS[view];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" ref={main} tabIndex={-1} className="flex-1 outline-none">
        <Screen />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
