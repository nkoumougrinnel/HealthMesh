/** Redirection anciennes URLs /mobile/* vers /tablet/* */
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { TABLET } from '@/lib/routes';

const MAP: Record<string, string> = {
  '/mobile/login': TABLET.login,
  '/mobile/dashboard': TABLET.dashboard,
  '/mobile/triage': TABLET.triage,
};

export default function TabletRedirect() {
  const [loc] = useLocation();
  useEffect(() => {
    window.location.replace(MAP[loc] || TABLET.login);
  }, [loc]);
  return null;
}
