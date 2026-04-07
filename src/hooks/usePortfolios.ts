/**
 * React hooks for portfolio data from Supabase.
 * Replaces direct mockData imports with async data fetching.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Portfolio } from '@/lib/types';
import {
  getMyPortfolios,
  getValidatedPortfolios,
  getFollowedPortfolios,
  getPortfolioById,
  getPortfoliosWithPendingUpdates,
  getCreatorStats,
} from '@/lib/supabasePortfolioService';

interface UseQueryResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch all portfolios created by the current user.
 * Replaces: mockPortfolios.slice(0, N) + getUserCreatedPortfolios()
 */
export function useMyPortfolios(): UseQueryResult<Portfolio[]> {
  const [data, setData] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const portfolios = await getMyPortfolios();
      setData(portfolios);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Fetch validated & listed portfolios for the Explore marketplace.
 * Replaces: getValidatedStrategies()
 */
export function useValidatedPortfolios(): UseQueryResult<Portfolio[]> {
  const [data, setData] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const portfolios = await getValidatedPortfolios();
      setData(portfolios);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Fetch portfolios the user is following/invested in.
 * Replaces: mockPortfolios.slice(4, 7) with hardcoded allocations
 */
export function useFollowedPortfolios(): UseQueryResult<(Portfolio & { myAllocation: number })[]> {
  const [data, setData] = useState<(Portfolio & { myAllocation: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const portfolios = await getFollowedPortfolios();
      setData(portfolios);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Fetch a single portfolio by ID with full details.
 * Replaces: mockPortfolios.find(p => p.id === id)
 */
export function usePortfolio(portfolioId: string | undefined): UseQueryResult<Portfolio | null> {
  const [data, setData] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!portfolioId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const portfolio = await getPortfolioById(portfolioId);
      setData(portfolio);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Fetch portfolios with pending structural changes.
 * Replaces: getPortfoliosWithPendingUpdates()
 */
export function usePendingUpdates(): UseQueryResult<Portfolio[]> {
  const [data, setData] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const portfolios = await getPortfoliosWithPendingUpdates();
      setData(portfolios);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Fetch aggregate creator stats.
 * Replaces: creatorStats from mockData
 */
export function useCreatorStats() {
  const [data, setData] = useState<{
    totalCreatorEarnings30d: number;
    totalAlphaEarnings: number;
    topCreatorEarnings: number;
    avgEarningsPerStrategy: number;
    totalCreators: number;
    totalCreatorInvestment: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCreatorStats().then((stats) => {
      setData(stats);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
