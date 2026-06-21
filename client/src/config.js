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
export const TEST_MODE = false;

export const START_STATION_ID = 'haghani';
export const DESTINATION_STATION_ID = 'sohrevardi';

/**
 * Show the Line column in the edges table.
 * Kept here so it travels together with the other UI flags.
 */
export const SHOW_LINE_INFO = true;
