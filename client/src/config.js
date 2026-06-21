// ---------------------------------------------------------------------------
// Central configuration — one place to tune all app-level constants.
// ---------------------------------------------------------------------------

/** Seconds given to the player each round. */
export const DEFAULT_TIMER = 20;

/**
 * When true, pickRandomStations always returns the same two hardcoded stations
 * so you can test the UI without playing a real round.
 * Set to false for production / real gameplay.
 */
export const TEST_MODE = true;

export const START_STATION_ID = 'haghani';
export const DESTINATION_STATION_ID = 'sohrevardi';

/**
 * Game difficulty level.
 * - 'easy'   – sorted edges, line column visible
 * - 'medium' – sorted edges, line column hidden
 * - 'hard'   – shuffled edges, line column hidden
 */

export const GAME_LEVEL = 'easy'; // 'easy' | 'medium' | 'hard'
