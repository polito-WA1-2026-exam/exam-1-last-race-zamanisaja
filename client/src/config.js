// ---------------------------------------------------------------------------
// Central configuration — one place to tune all app-level constants.
// ---------------------------------------------------------------------------

/** Seconds given to the player each round. */
export const DEFAULT_TIMER = 90;

/**
 * When true, pickRandomStations always returns the same two hardcoded stations
 * so you can test the UI without playing a real round.
 * Set to false for production / real gameplay.
 */
export const TEST_MODE = false;

export const START_STATION_ID = 'haghani';
export const DESTINATION_STATION_ID = 'sohrevardi';

/**
 * Game difficulty level.
 * - 'easy'   – sorted edges, line column visible, source/destination stations highlighted
 * - 'medium' – sorted edges, line column hidden
 * - 'hard'   – shuffled edges, line column hidden
 */

export const GAME_LEVEL = 'medium'; // 'easy' | 'medium' | 'hard'
