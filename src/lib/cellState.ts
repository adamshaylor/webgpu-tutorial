import {
  numDimensions,
  GridCoordinates,
  type AOrB,
} from './definitions';

import {
  gridSize,
  simplexNoiseFrequency,
  simplexNoiseAmplitude,
  noiseToLifeThreshold,
  debugInitialState,
} from './settings';

import { createNoise2D } from 'simplex-noise';

/**
 * Implements the ping-pong technique for state updates.
 */
interface CellState {
  gpuBuffers: Readonly<Record<AOrB, GPUBuffer>>;
  activeBuffer: AOrB;
  iterate: () => void;
  iterationStep: number;
}

let cellState: CellState;

const initCellState = (device: GPUDevice): Readonly<CellState> => {
  let iterationStep = 0;

  const cellStateArray = new Uint32Array(
    Math.pow(gridSize, numDimensions),
  );

  const iterate = () => {
    iterationStep += 1;
  };

  cellState = {
    gpuBuffers: {
      a: device.createBuffer({
        label: 'Cell state A',
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      }),
      b: device.createBuffer({
        label: 'Cell state B',
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      }),
    },
    get activeBuffer() {
      return debugInitialState ? 'a' : iterationStep % 2 ? 'b' : 'a';
    },
    iterate,
    get iterationStep() {
      return iterationStep;
    },
  };

  const cellIndexToCoordinates = (index: number): GridCoordinates => {
    let row = Math.floor(index / gridSize);
    let column = index % gridSize;
    return [row, column];
  };

  const noise2D = createNoise2D();
  for (let i = 0; i < cellStateArray.length; i += 1) {
    const [row, column] = cellIndexToCoordinates(i);
    const x = column / gridSize;
    const y = row / gridSize;
    const noiseValue =
      noise2D(x * simplexNoiseFrequency, y * simplexNoiseFrequency) *
      simplexNoiseAmplitude;
    cellStateArray[i] = noiseValue > noiseToLifeThreshold ? 1 : 0;
  }
  device.queue.writeBuffer(cellState.gpuBuffers.a, 0, cellStateArray);

  return cellState;
};

export default initCellState;
