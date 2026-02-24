/**
 * useTestWS.js — WebSocket hook with JWT auth + polling fallback
 *
 * Fixes applied:
 * 1. React StrictMode double-mount: mountedRef replaced with stateRef object
 *    so the second mount always starts fresh (mounted=true, done=false).
 * 2. Snapshot for completed tests: done is detected from snapshot.status /
 *    snapshot.finished_at in addition to msg.done, so completed tests always
 *    resolve instead of spinning forever.
 * 3. "url" removed from SKIP so it merges correctly in the polling path too.
 * 4. ws.onclose no longer clears done state; it only touches connected.
 */
import { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const WS_BASE =
  import.meta.env.VITE_WS_BASE || API_BASE.replace(/^http/, "ws");

// Internal/meta fields that are NOT check-step results
const SKIP = new Set([
  "test_id", "started_at", "finished_at", "error", "status",
  "user_id", "saved_at", "_id",
  // "url", "overall_score", "share_token", "ai_recommendations" intentionally
  // removed from SKIP so they merge in both WS snapshot AND polling paths.
]);

export function useTestWS(testId, { onDone, token } = {}) {
  const [steps, setSteps] = useState({});
  const [connected, setConnected] = useState(false);
  const [done, setDone] = useState(false);

  const pollRef = useRef(null);
  // Single ref object avoids stale-closure issues with mountedRef boolean
  const stateRef = useRef({ mounted: false, done: false });

  const merge = useCallback(
    (key, val) => setSteps((p) => ({ ...p, [key]: val })),
    []
  );

  const markDone = useCallback(() => {
    // Guard: only fire once, only while mounted
    if (!stateRef.current.mounted || stateRef.current.done) return;
    stateRef.current.done = true;
    setDone(true);
    onDone?.();
  }, [onDone]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/test/${testId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!stateRef.current.mounted) return;

        // Merge all non-meta fields (url, overall_score, etc. now included)
        Object.entries(data).forEach(([k, v]) => {
          if (!SKIP.has(k)) merge(k, v);
        });

        const isComplete =
          data.finished_at || ["completed", "failed"].includes(data.status);
        if (isComplete) {
          stopPolling();
          markDone();
        }
      } catch (_) {}
    }, 3000);
  }, [testId, token, merge, markDone, stopPolling]);

  useEffect(() => {
    if (!testId) return;

    // Reset state for this mount (handles React StrictMode double-invoke)
    stateRef.current.mounted = true;
    stateRef.current.done = false;

    let ws;
    try {
      ws = new WebSocket(`${WS_BASE}/test/${testId}/ws`);
    } catch {
      startPolling();
      return () => {
        stateRef.current.mounted = false;
        stopPolling();
      };
    }

    ws.onopen = () => {
      if (stateRef.current.mounted) setConnected(true);
    };

    ws.onmessage = ({ data }) => {
      if (!stateRef.current.mounted) return;
      try {
        const msg = JSON.parse(data);
        console.log('[WS] Message received:', { 
          hasSnapshot: !!msg.snapshot, 
          done: msg.done,
          step: msg.step,
          snapshotStatus: msg.snapshot?.status,
          snapshotFinished: msg.snapshot?.finished_at 
        });

        // ── Snapshot: sent immediately on connect for existing/in-progress tests ──
        if (msg.snapshot) {
          const snap = msg.snapshot;

          // Merge all displayable fields from the snapshot
          Object.entries(snap).forEach(([k, v]) => {
            if (!SKIP.has(k)) merge(k, v);
          });

          // Detect completion from snapshot content OR explicit msg.done flag
          const snapIsDone =
            msg.done === true ||
            snap.finished_at ||
            ["completed", "failed"].includes(snap.status);

          console.log('[WS] Snapshot processed:', { 
            snapIsDone, 
            msgDone: msg.done, 
            finished_at: snap.finished_at,
            status: snap.status 
          });

          if (snapIsDone) {
            console.log('[WS] Marking as DONE from snapshot');
            markDone();
            ws.close();
            return;
          }
          // Test still running — WS will keep streaming step messages
          return;
        }

        // ── Live step update during an active run ──
        if (msg.step != null) {
          console.log('[WS] Live step update:', msg.step);
          merge(msg.step, msg.data);
        }

        // ── Explicit completion signal from backend ──
        if (msg.done) {
          console.log('[WS] Done signal received');
          // Backend also sends overall_score in the done broadcast
          if (msg.overall_score != null) merge("overall_score", msg.overall_score);
          if (msg.summary != null) merge("summary", msg.summary);
          markDone();
          ws.close();
        }
      } catch (err) {
        console.error('[WS] Error parsing message:', err);
      }
    };

    ws.onerror = () => {
      if (stateRef.current.mounted) {
        setConnected(false);
        startPolling(); // fall back to polling if WS fails
      }
    };

    ws.onclose = () => {
      // Only update the connected indicator; never touch done here
      if (stateRef.current.mounted) setConnected(false);
    };

    return () => {
      stateRef.current.mounted = false;
      if (ws.readyState <= WebSocket.OPEN) ws.close();
      stopPolling();
    };
  }, [testId, startPolling, stopPolling, merge, markDone]);

  return { steps, connected, done };
}