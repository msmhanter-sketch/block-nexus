import { createXRStore } from '@react-three/xr';

export const xrStore = createXRStore({
  hand:       { rayPointer: true },
  controller: { rayPointer: true },
});
