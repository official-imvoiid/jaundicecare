import { useState } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import type { Language, UserRole } from '../domain/types';
import { formatDateTime } from '../i18n/locale';
import type { MessageKey } from '../i18n/en';
import { useT } from '../i18n/useT';
import { unreadFor } from '../logic/pharmacy';
import { useApp } from '../state/appContext';
import type { View } from '../state/appContext';
import { cx } from '../ui/cx';
import { SegmentedControl } from '../ui/SegmentedControl';

const PARENT_NAV: { view: View; label: MessageKey; alsoActiveOn?: View[] }[] = [
  { view: 'home', label: 'nav.home' },
  { view: 'check', label: 'nav.check', alsoActiveOn: ['result', 'questions'] },
  { view: 'history', label: 'nav.history' },
  { view: 'prescription', label: 'nav.prescription' },
  { view: 'orders', label: 'nav.orders' },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी' },
];

const ROLES: UserRole[] = ['parent', 'pharmacist', 'admin'];

/** Where a notification takes the person who opens it: staff to their dashboard, parents to their orders. */
const destinationFor = (role: UserRole): View => (role === 'parent' ? 'orders' : role);

export function Header() {
  const { role, view, go, setRole, language, setLanguage, notifications, markNotificationRead } = useApp();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const isParent = role === 'parent';
  const homeView: View = isParent ? 'home' : role;
  const unread = unreadFor(notifications, role);

  const navigate = (next: View) => {
    go(next);
    setMenuOpen(false);
    setNotesOpen(false);
  };

  const navItems = isParent
    ? PARENT_NAV.map(item => ({
        view: item.view,
        label: t(item.label),
        active: view === item.view || (item.alsoActiveOn?.includes(view) ?? false),
      }))
    : [{ view: homeView, label: role === 'pharmacist' ? 'Pharmacy dashboard' : 'Admin dashboard', active: true }];

  const languageSwitch = isParent && (
    <SegmentedControl label={t('header.language')} options={LANGUAGES} value={language} onChange={setLanguage} size="sm" />
  );

  const roleSelect = (
    <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted">
      <span>{t('header.viewAs')}</span>
      <select
        value={role}
        onChange={event => {
          setRole(event.target.value as UserRole);
          setMenuOpen(false);
        }}
        className="rounded-lg border border-line-strong bg-surface py-1.5 pl-2 pr-7 text-sm text-ink"
      >
        {ROLES.map(option => (
          <option key={option} value={option}>
            {t(`role.${option}`)}
          </option>
        ))}
      </select>
      <span className="rounded border border-line px-1.5 py-0.5 text-xs">{t('header.demo')}</span>
    </label>
  );

  return (
    <header className="no-print relative border-b border-line bg-surface">
      <a
        href="#main"
        className="absolute left-2 top-2 z-30 -translate-y-16 rounded-lg bg-ink px-3 py-2 text-sm text-white focus:translate-y-0"
      >
        {t('header.skip')}
      </a>

      <div className="mx-auto flex h-16 max-w-[1080px] items-center gap-4 px-5 sm:px-6 xl:gap-6">
        <button type="button" onClick={() => navigate(homeView)} className="flex items-baseline gap-2.5 text-left">
          <span className="font-serif text-[1.375rem] text-ink">JaundiceCare</span>
          <span className="hidden whitespace-nowrap text-[0.8125rem] text-muted xl:inline">{t('brand.tagline')}</span>
        </button>

        <nav aria-label={t('nav.main')} className="hidden flex-1 items-stretch gap-1 self-stretch md:flex">
          {navItems.map(item => (
            <button
              key={item.view}
              type="button"
              onClick={() => navigate(item.view)}
              aria-current={item.active ? 'page' : undefined}
              className={cx(
                'border-b-2 px-3 text-[0.9375rem]',
                item.active ? 'border-brand font-semibold text-ink' : 'border-transparent text-body hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-4 lg:flex">
            {languageSwitch}
            {roleSelect}
          </div>

          <div
            className="relative"
            onKeyDown={event => {
              if (event.key === 'Escape') setNotesOpen(false);
            }}
          >
            <button
              type="button"
              onClick={() => setNotesOpen(open => !open)}
              aria-expanded={notesOpen}
              aria-label={`${t('header.notifications')} (${unread.length})`}
              className="relative rounded-lg p-2 text-body hover:bg-sunken hover:text-ink"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unread.length > 0 && (
                <span className="numeric absolute -right-0.5 -top-0.5 min-w-[1.125rem] rounded-full bg-brand px-1 text-center text-[0.6875rem] font-semibold leading-[1.125rem] text-white">
                  {unread.length}
                </span>
              )}
            </button>

            {notesOpen && (
              <>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setNotesOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface">
                  <p className="h-label border-b border-line px-4 py-3">{t('header.notifications')}</p>
                  {unread.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-muted">{t('header.noNotifications')}</p>
                  ) : (
                    <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                      {unread.map(note => (
                        <li key={note.id}>
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationRead(note.id);
                              navigate(destinationFor(role));
                            }}
                            className="block w-full px-4 py-3 text-left hover:bg-sunken"
                          >
                            <span className="block text-sm font-semibold text-ink">
                              {note.text ? t(note.text.title, note.text.values) : note.title}
                            </span>
                            <span className="block text-sm">
                              {note.text ? t(note.text.message, note.text.values) : note.message}
                            </span>
                            <span className="mt-1 block text-xs text-muted">{formatDateTime(note.timestamp, language)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(open => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t('header.closeMenu') : t('header.menu')}
            className="rounded-lg p-2 text-body hover:bg-sunken hover:text-ink lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line px-5 pb-5 pt-2 sm:px-6 lg:hidden">
          <nav aria-label={t('nav.main')} className="flex flex-col md:hidden">
            {navItems.map(item => (
              <button
                key={item.view}
                type="button"
                onClick={() => navigate(item.view)}
                aria-current={item.active ? 'page' : undefined}
                className={cx(
                  'border-b border-line py-3 text-left text-base',
                  item.active ? 'font-semibold text-ink' : 'text-body',
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            {languageSwitch}
            {roleSelect}
          </div>
        </div>
      )}
    </header>
  );
}
