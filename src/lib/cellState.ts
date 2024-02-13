import { numDimensions } from './definitions';
import { gridSize } from './settings';

const cellStateArray = new Uint32Array(
  Math.pow(gridSize, numDimensions),
);

let cellStateBuffer: GPUBuffer;
const initCellState = (device: GPUDevice): Readonly<GPUBuffer> => {
  cellStateBuffer = device.createBuffer({
    label: 'Cell state',
    size: cellStateArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  for (let i = 0; i < cellStateArray.length; i += 3) {
    cellStateArray[i] = 1;
  }

  device.queue.writeBuffer(cellStateBuffer, 0, cellStateArray);
  return cellStateBuffer;
};

export default initCellState;
