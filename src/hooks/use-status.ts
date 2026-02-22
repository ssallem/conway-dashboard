"use client";

import useSWR from "swr";
import type { DashboardStatus } from "@/types/automaton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useStatus(refreshInterval = 10000) {
  const { data, error, isLoading, mutate } = useSWR<DashboardStatus>(
    "/api/status",
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    status: data,
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useTurns(limit = 20, offset = 0) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/turns?limit=${limit}&offset=${offset}`,
    fetcher,
    {
      refreshInterval: 15000,
    }
  );

  return {
    turns: data?.turns || [],
    total: data?.total || 0,
    error,
    isLoading,
    refresh: mutate,
  };
}
