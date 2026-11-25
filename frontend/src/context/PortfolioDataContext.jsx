import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  portfolioBackendService as api,
} from "../services/Portfolio/portfolioBackendService.js";

const PortfolioDataContext = createContext(null);

export function PortfolioDataProvider({ children }) {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] =
    useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const mounted = useRef(false);
  const mutationLock = useRef(false);
  const loadSequence = useRef(0);

  const refreshPortfolios = useCallback(async () => {
    const sequence = ++loadSequence.current;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.listPortfolios();

      if (!Array.isArray(result.portfolios)) {
        throw new Error("Invalid Portfolio collection.");
      }

      if (
        mounted.current &&
        sequence === loadSequence.current
      ) {
        setPortfolios(result.portfolios);
      }

      return result.portfolios;
    } catch (failure) {
      if (
        mounted.current &&
        sequence === loadSequence.current
      ) {
        setError(failure);
      }

      throw failure;
    } finally {
      if (
        mounted.current &&
        sequence === loadSequence.current
      ) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    refreshPortfolios().catch(() => {});

    return () => {
      mounted.current = false;
      loadSequence.current += 1;
    };
  }, [refreshPortfolios]);

  const runMutation = async operation => {
    if (mutationLock.current) {
      throw new Error(
        "Another Portfolio operation is in progress.",
      );
    }

    mutationLock.current = true;
    loadSequence.current += 1;

    setIsLoading(false);
    setIsSaving(true);
    setError(null);

    try {
      return await operation();
    } catch (failure) {
      if (mounted.current) {
        setError(failure);
      }

      throw failure;
    } finally {
      mutationLock.current = false;

      if (mounted.current) {
        setIsSaving(false);
      }
    }
  };

  const storePortfolio = portfolio => {
    if (!portfolio?.id || !portfolio?.rowVersion) {
      throw new Error("Invalid Portfolio record.");
    }

    if (!mounted.current) return;

    setPortfolios(current => [
      portfolio,
      ...current.filter(item => item.id !== portfolio.id),
    ]);

    setSelectedPortfolio(current =>
      current?.id === portfolio.id ? portfolio : current,
    );
  };

  const createPortfolio = values =>
    runMutation(async () => {
      const result = await api.createPortfolio(values);

      storePortfolio(result.portfolio);

      return result.portfolio;
    });

  const updatePortfolio = (id, updates, rowVersion) =>
    runMutation(async () => {
      const result = await api.updatePortfolio(
        id,
        updates,
        rowVersion,
      );

      storePortfolio(result.portfolio);

      return result.portfolio;
    });

  const deletePortfolio = (id, rowVersion) =>
    runMutation(async () => {
      const result = await api.deletePortfolio(
        id,
        rowVersion,
      );

      if (result.deleted !== true) {
        throw new Error("Portfolio deletion was not confirmed.");
      }

      if (mounted.current) {
        setPortfolios(current =>
          current.filter(item => item.id !== id),
        );

        setSelectedPortfolio(current =>
          current?.id === id ? null : current,
        );
      }

      return result;
    });

  const selectPortfolio = id =>
    runMutation(async () => {
      const result = await api.getPortfolio(id);

      storePortfolio(result.portfolio);

      if (mounted.current) {
        setSelectedPortfolio(result.portfolio);
      }

      return result.portfolio;
    });

  return (
    <PortfolioDataContext.Provider
      value={{
        portfolios,
        selectedPortfolio,
        isLoading,
        isSaving,
        error,
        refreshPortfolios,
        createPortfolio,
        updatePortfolio,
        deletePortfolio,
        selectPortfolio,
      }}
    >
      {children}
    </PortfolioDataContext.Provider>
  );
}

export function usePortfolioData() {
  const context = useContext(PortfolioDataContext);

  if (!context) {
    throw new Error(
      "usePortfolioData requires PortfolioDataProvider.",
    );
  }

  return context;
}