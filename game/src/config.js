// Mission + world constants for Canyon Run. One job: the numbers every file agrees on.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 112;

export const SEG_LEN = 200;
export const SEGMENTS = 620;          // ~124 km of canyon, then the runway
export const DRAW_DIST = 150;
export const ROAD_W = 2000;           // half-width of the canyon floor in world units
export const CAM_H = 1050;            // camera height above the plane
export const FOV = 100;
export const CAM_DEPTH = 1 / Math.tan(((FOV / 2) * Math.PI) / 180);

export const MAX_SPEED = 265;         // knots shown on the dial
export const MAX_ALT = 900;           // feet shown on the altimeter
export const RING_RADIUS = 260;       // world units of vertical/lateral slack

export const MISSIONS = [
  {
    id: 'rings', key: '1', name: 'RING RUN',
    tag: 'Fly 12 rings against the clock',
    rings: 12, timeLimit: 150, fuel: 100, pads: 0,
    blurb: 'Thread every glowing ring. A missed ring costs 8 seconds.',
  },
  {
    id: 'trial', key: '2', name: 'CANYON TIME TRIAL',
    tag: 'Fastest clean run — near-miss bonuses',
    rings: 6, timeLimit: 180, fuel: 100, pads: 0,
    blurb: 'Skim the walls for +150 near-miss bonuses. Touch a wall and it is gone.',
  },
  {
    id: 'rescue', key: '3', name: 'RESCUE DROP',
    tag: 'Drop supplies on 3 marked pads — fuel matters',
    rings: 4, timeLimit: 210, fuel: 78, pads: 3,
    blurb: 'SPACE drops a crate over a lit pad. Low and slow wins; throttle burns fuel.',
  },
];

export const PALETTE = {
  skyTop: '#3b1d5e', skyMid: '#7a2f6d', skyLow: '#e2603c',
  sun: '#ffd27a', sunCore: '#fff3c4',
  mesaFar: '#5a2a63', mesaNear: '#7c3a4a',
  rockA: '#b85c33', rockB: '#9c4526', rockDark: '#6e2f1c',
  sand: '#d98a4b', river: '#2fa8a0', riverHi: '#7fe3d4',
  wallA: '#8a3b22', wallB: '#a34d2c', wallTop: '#e08a52',
  ring: '#ffe14d', ringHit: '#7dff8a', pad: '#7dff8a',
  runway: '#3d3d4d', runwayLine: '#ffe14d',
  panel: '#101018', panelEdge: '#2c2c3a',
  litGreen: '#7dff8a', litAmber: '#ffb347', litCyan: '#7fe3d4', litRed: '#ff5a5a',
  ink: '#f5efe4',
};
