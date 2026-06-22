import { useState, useCallback, useEffect, useRef } from 'react';
import { pickRandomStations, validateRoute, simulateEdgeEventsAndScore } from '../components/utils.js';
import { API } from '../api.js';
import { DEFAULT_TIMER } from '../config.js';

export function useGameLogic({ user, metroGraph, events, lang, setMetroError, setGamesSummary, setLeaderboard }) {
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
      if (s.has(edgeId)) s.delete(edgeId);
      else s.add(edgeId);
      return Array.from(s);
    });
  }

  function startRound() {
    if (!user) return;
    if (!metroGraph) return;

    setScore(null);

    const pair = pickRandomStations(metroGraph, 3);
    if (!pair) {
      setMetroError('Could not find two stations at least 3 stations apart.');
      return;
    }

    setMetroError('');
    setValidationResult(null);
    setSelectedEdgeIds([]);
    setSubmittedEdgeIds([]);
    setStartStation(pair.start);
    setDestinationStation(pair.destination);
    setTimeLeft(DEFAULT_TIMER);
    setMode('play');
  }

  function enterSetupMode() {
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
  }

  const enterValidateMode = useCallback(() => {
    if (!metroGraph) return;

    // Guard: can be triggered by timer + click, or dev StrictMode quirks
    if (validatingRef.current) return;
    validatingRef.current = true;

    try {
      const snapshot = [...selectedEdgeIdsRef.current];

      setSubmittedEdgeIds(snapshot);
      setSelectedEdgeIds([]);

      const result = validateRoute(metroGraph, snapshot, startStation?.id, destinationStation?.id, lang);

      if (!result) {
        console.error('[enterValidateMode] validateRoute returned undefined — check utils.js');
        validatingRef.current = false;
        return;
      }

      setValidationResult(result);

      let finalScore = 0;

      if (result.ok) {
        if (!events.length) {
          finalScore = 20;
        } else {
          const sim = simulateEdgeEventsAndScore(snapshot, events, 20);
          finalScore = sim.finalScore;
          setRoundEvents(sim.triggeredEvents ?? []);
        }
      }

      setScore(finalScore);

      // Save game score (for both valid and invalid routes)
      API.createGame({ score: finalScore })
        // Refresh navbar summary so it updates immediately after a new high score
        .then(() => Promise.all([API.getGamesSummary(), API.getLeaderboard()]))
        .then(([summary, lb]) => {
          setGamesSummary(summary);
          setLeaderboard(lb);
        })
        .catch((e) => console.error('[client] submit/refresh failed', e));

      setMode('validation');
    } catch (err) {
      console.error('[enterValidateMode] unexpected error, releasing guard', err);
      validatingRef.current = false;
    }
  }, [metroGraph, startStation?.id, destinationStation?.id, lang, events, setGamesSummary, setLeaderboard]);

  // Release the guard when we leave play mode (i.e., start a new round / go back)
  useEffect(() => {
    if (mode !== 'play') validatingRef.current = false;
  }, [mode]);

  // Countdown: pure tick, no side-effects inside the state updater
  useEffect(() => {
    if (mode !== 'play') return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0; // just set to 0; validation triggered by the effect below
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [mode]); // no enterValidateMode dep — clicking edges won't restart the interval

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
