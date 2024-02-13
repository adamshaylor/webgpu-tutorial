import { numDimensions, type AOrB } from './definitions';
import { gridSize } from './settings';

/**
 * Implements the ping-pong technique for state updates.
 */
interface CellState {
  bufferA: Readonly<GPUBuffer>;
  bufferB: Readonly<GPUBuffer>;
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
    bufferA: device.createBuffer({
      label: 'Cell state A',
      size: cellStateArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    bufferB: device.createBuffer({
      label: 'Cell state B',
      size: cellStateArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    get activeBuffer() {
      return iterationStep % 2 ? 'B' : 'A';
    },
    iterate,
    get iterationStep() {
      return iterationStep;
    },
  };

  for (let i = 0; i < cellStateArray.length; i += 3) {
    cellStateArray[i] = 1;
  }
  device.queue.writeBuffer(cellState.bufferA, 0, cellStateArray);

  for (let i = 0; i < cellStateArray.length; i += 1) {
    cellStateArray[i] = i % 2;
  }
  device.queue.writeBuffer(cellState.bufferB, 0, cellStateArray);

  return cellState;
};

export default initCellState;
