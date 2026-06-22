import { useState, useCallback, useEffect, useRef } from 'react';
import { pickRandomStations } from '../components/utils.js';
import { API } from '../api.js';
import { DEFAULT_TIMER } from '../config.js';

export function useGameLogic({ user, metroGraph, lang, setMetroError, setGamesSummary, setLeaderboard }) {
  // Prevent double-submit (can happen in React StrictMode / racing timer)
  const validatingRef = useRef(false);

  const [selectedEdgeIds, setSelectedEdgeIds] = useState([]);     // live selection (play)
  const [submittedEdgeIds, setSubmittedEdgeIds] = useState([]);   // frozen selection (validation)

  // Keep a ref in sync so enterValidateMode can read the latest edges
  // without needing selectedEdgeIds as a useCallback dependency (which restarts the interval on every click)
  const selectedEdgeIdsRef = useRef(selectedEdgeIds);
  useEffect(() => { selectedEdgeIdsRef.current = selectedEdgeIds; }, [selectedEdgeIds]);
  // 'setup' | 'play' | 'validation'
  const [mode, setMode] = useState('setup');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER);

  const [startStation, setStartStation] = useState(null);
  const [destinationStation, setDestinationStation] = useState(null);

  const [validationResult, setValidationResult] = useState(null);

  const [score, setScore] = useState(null); // null until validation happens
  const [roundEvents, setRoundEvents] = useState([]); // events triggered during the round

  const showSplit = mode === 'play'; // restore 50/50 only in play mode

  // Map should see submitted edges in validation, live edges in play (setup shows all anyway)
  const visibleEdgeIds = mode === 'validation' ? submittedEdgeIds : selectedEdgeIds;

  function toggleEdge(edgeId) {
    if (mode !== 'play') return;
    setSelectedEdgeIds((prev) => {
      const s = new Set(prev);
      s.has(edgeId) ? s.delete(edgeId) : s.add(edgeId);
      return Array.from(s);
    });
  }

  const startRound = useCallback(() => {
    if (!user || !metroGraph) return;
    setScore(null);

    const pair = pickRandomStations(metroGraph, 3);
    if (!pair) { setMetroError('Could not find two stations at least 3 apart.'); return; }
    setMetroError('');
    setValidationResult(null);
    setSelectedEdgeIds([]);
    setSubmittedEdgeIds([]);
    setStartStation(pair.start);
    setDestinationStation(pair.destination);
    setTimeLeft(DEFAULT_TIMER);
    setMode('play');
  }, [user, metroGraph, setMetroError]);

  const enterSetupMode = useCallback(() => {
    setMode('setup');
    setTimeLeft(DEFAULT_TIMER);
    setSelectedEdgeIds([]);
    setSubmittedEdgeIds([]);
    setStartStation(null);
    setDestinationStation(null);
    setValidationResult(null);
    setMetroError('');
    setScore(null);
    setRoundEvents([]);
  }, [setMetroError]);

  // Async: sends route data to the server; receives validation result + score back
  const enterValidateMode = useCallback(async () => {
    if (!metroGraph || validatingRef.current) return;
    validatingRef.current = true;

    const snapshot = [...selectedEdgeIdsRef.current];
    setSubmittedEdgeIds(snapshot);
    setSelectedEdgeIds([]);

    try {
      const result = await API.createGame({
        startStationId:       startStation?.id,
        destinationStationId: destinationStation?.id,
        selectedEdgeIds:      snapshot,
      });

      setValidationResult({ ok: result.valid, reasonCode: result.reasonCode ?? undefined });
      setScore(result.score);
      setRoundEvents(result.triggeredEvents ?? []);

      Promise.all([API.getGamesSummary(), API.getLeaderboard()])
        .then(([summary, lb]) => { setGamesSummary(summary); setLeaderboard(lb); })
        .catch((e) => console.error('[useGameLogic] refresh failed', e));
    } catch (err) {
      console.error('[enterValidateMode] API error', err);
      setValidationResult({ ok: false, reason: err.message ?? 'Server error. Please try again.' });
      setScore(0);
    } finally {
      setMode('validation');
    }
  }, [metroGraph, startStation?.id, destinationStation?.id, setGamesSummary, setLeaderboard]);

  useEffect(() => {
    if (mode !== 'play') validatingRef.current = false;
  }, [mode]);

  // Countdown timer
  useEffect(() => {
    if (mode !== 'play') return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [mode]);

  // Trigger validation once the timer actually reaches 0
  useEffect(() => {
    if (mode === 'play' && timeLeft === 0) {
      enterValidateMode();
    }
  }, [mode, timeLeft, enterValidateMode]);

  return {
    mode,
    timeLeft,
    startStation,
    destinationStation,
    selectedEdgeIds,
    setSelectedEdgeIds,
    submittedEdgeIds,
    validationResult,
    score,
    roundEvents,
    showSplit,
    visibleEdgeIds,
    toggleEdge,
    startRound,
    enterSetupMode,
    enterValidateMode,
  };
}
