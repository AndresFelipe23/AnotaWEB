import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PageHeaderState {
  title: string | null;
  count: number | null;
}

interface PageHeaderContextType {
  pageHeader: PageHeaderState;
  setPageHeader: (title: string | null, count?: number | null) => void;
}

const defaultState: PageHeaderState = { title: null, count: null };

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export const usePageHeader = () => {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error('usePageHeader debe usarse dentro de PageHeaderProvider');
  }
  return context;
};

interface PageHeaderProviderProps {
  children: ReactNode;
}

export const PageHeaderProvider = ({ children }: PageHeaderProviderProps) => {
  const [pageHeader, setPageHeaderState] = useState<PageHeaderState>(defaultState);

  const setPageHeader = useCallback((title: string | null, count?: number | null) => {
    setPageHeaderState((prev) =>
      title === null
        ? { title: null, count: null }
        : { title, count: count !== undefined ? count : prev.count }
    );
  }, []);

  return (
    <PageHeaderContext.Provider value={{ pageHeader, setPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
};
