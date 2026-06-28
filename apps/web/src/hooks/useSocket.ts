'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';

type EventMap = Record<string, (data: unknown) => void>;

export function useSocket(events: EventMap): void {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    // Stable wrappers always delegate to the latest handler via ref —
    // this prevents stale closures when component state changes after mount.
    const stableHandlers: Record<string, (data: unknown) => void> = {};

    Object.keys(eventsRef.current).forEach((event) => {
      const stable = (data: unknown) => eventsRef.current[event]?.(data);
      stableHandlers[event] = stable;
      socket.on(event, stable);
    });

    return () => {
      Object.keys(stableHandlers).forEach((event) => {
        socket.off(event, stableHandlers[event]);
      });
    };
  }, []); // runs once — stable wrappers handle freshness
}
