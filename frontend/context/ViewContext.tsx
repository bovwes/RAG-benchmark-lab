'use client';

import { createContext, useContext, useState } from 'react';
import type { ViewMode } from '@/components/ViewToggle';

const ViewContext = createContext<{
  view: ViewMode;
  setView: (v: ViewMode) => void;
}>({ view: 'table', setView: () => {} });

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ViewMode>('table');
  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  return useContext(ViewContext);
}
