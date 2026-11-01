import { useSyncExternalStore } from 'react';

export type Tab = 'aventure' | 'billy' | 'combat' | 'jets' | 'table';

export type Route = { name: 'home' } | { name: 'new' } | { name: 'settings' } | { name: 'game'; id: string; tab: Tab };

const TABS: Tab[] = ['aventure', 'billy', 'combat', 'jets', 'table'];

export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'nouveau') return { name: 'new' };
  if (parts[0] === 'reglages') return { name: 'settings' };
  if (parts[0] === 'partie' && parts[1]) {
    const tab = TABS.includes(parts[2] as Tab) ? (parts[2] as Tab) : 'aventure';
    return { name: 'game', id: parts[1], tab };
  }
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'new':
      return '#/nouveau';
    case 'settings':
      return '#/reglages';
    case 'game':
      return `#/partie/${route.id}/${route.tab}`;
  }
}

export function navigate(route: Route, replace = false) {
  const url = href(route);
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash);
  return parse(hash);
}
