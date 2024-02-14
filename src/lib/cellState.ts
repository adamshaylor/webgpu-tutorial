import { numDimensions, type AOrB } from './definitions';
import { gridSize } from './settings';

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
      return iterationStep % 2 ? 'b' : 'a';
    },
    iterate,
    get iterationStep() {
      return iterationStep;
    },
  };

  for (let i = 0; i < cellStateArray.length; i += 1) {
    cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
  }
  device.queue.writeBuffer(cellState.gpuBuffers.a, 0, cellStateArray);

  return cellState;
};

export default initCellState;
