import {
  clearColor,
  gameIterationIntervalMs,
  gridSize,
  renderLoopIntervalMs,
} from './lib/settings';

import { numDimensions, type AOrB } from './lib/definitions';
import initWebGpu from './lib/webGpu';
import initCellState from './lib/cellState';
import cellShader from './lib/shaders/cellShader.wgsl?raw';
import simulationShader from './lib/shaders/simulationShader.wgsl?raw';
import './style.css';

// This workgroup size must be kept in sync the corresponding
// WGSL shader value.
const simulationWorkgroupSize = 8;
const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas');

const resizeCanvas = (): void => {
  const scale = window.devicePixelRatio;
  canvas.width = Math.floor(canvas.clientWidth * scale);
  canvas.height = Math.floor(canvas.clientHeight * scale);
};

const initResult = await initWebGpu(canvas);
if (initResult.ok === false) {
  alert(initResult.error.message);
  throw new Error(initResult.error.message, {
    cause: initResult.error,
  });
}
const gpu = initResult.value;

// prettier-ignore
const vertices = new Float32Array([
// X,    Y,
  -0.8, -0.8, // Triangle 1
   0.8, -0.8,
   0.8,  0.8,
  
  -0.8, -0.8, // Triangle 2
   0.8,  0.8,
  -0.8,  0.8,
])

const vertexBuffer = gpu.device.createBuffer({
  label: 'Cell vertices',
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

gpu.device.queue.writeBuffer(vertexBuffer, 0, vertices);

const arrayStride = numDimensions * vertices.BYTES_PER_ELEMENT;

const vertexBufferLayout: GPUVertexBufferLayout = {
  arrayStride,
  attributes: [
    {
      format: `float32x${numDimensions}`,
      offset: 0,
      shaderLocation: 0,
    },
  ],
};

const cellShaderModule = gpu.device.createShaderModule({
  label: 'Cell shader',
  code: cellShader,
});

const simulationShaderModule = gpu.device.createShaderModule({
  label: 'Game of Life simulation shader',
  code: simulationShader,
});

const bindGroupLayout = gpu.device.createBindGroupLayout({
  label: 'Cell bind group layout',
  entries: [
    {
      binding: 0,
      visibility:
        GPUShaderStage.VERTEX |
        GPUShaderStage.FRAGMENT |
        GPUShaderStage.COMPUTE,
      buffer: {}, // Grid uniform buffer
    },
    {
      binding: 1,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
      buffer: { type: 'read-only-storage' }, // Cell state input buffer
    },
    {
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: 'storage' }, // Cell state output buffer
    },
  ],
});

const pipelineLayout = gpu.device.createPipelineLayout({
  label: 'Cell pipeline layout',
  bindGroupLayouts: [bindGroupLayout],
});

const simulationPipeline = gpu.device.createComputePipeline({
  label: 'Simulation pipeline',
  layout: pipelineLayout,
  compute: {
    module: simulationShaderModule,
    entryPoint: 'computeMain',
  },
});

const cellPipeline = gpu.device.createRenderPipeline({
  label: 'Cell pipeline',
  layout: pipelineLayout,
  vertex: {
    module: cellShaderModule,
    entryPoint: 'vertexMain',
    buffers: [vertexBufferLayout],
  },
  fragment: {
    module: cellShaderModule,
    entryPoint: 'fragmentMain',
    targets: [{ format: gpu.format }],
  },
});

const uniformArray = new Float32Array([gridSize, gridSize]);
const uniformBuffer = gpu.device.createBuffer({
  label: 'Grid uniforms',
  size: uniformArray.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
gpu.device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

const cellState = initCellState(gpu.device);

const bindGroups: Record<AOrB, GPUBindGroup> = {
  a: gpu.device.createBindGroup({
    label: 'Cell renderer bind group A',
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
      {
        binding: 1,
        resource: { buffer: cellState.gpuBuffers.a },
      },
      {
        binding: 2,
        resource: { buffer: cellState.gpuBuffers.b },
      },
    ],
  }),
  b: gpu.device.createBindGroup({
    label: 'Cell renderer bind group B',
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
      {
        binding: 1,
        resource: { buffer: cellState.gpuBuffers.b },
      },
      {
        binding: 2,
        resource: { buffer: cellState.gpuBuffers.a },
      },
    ],
  }),
};

const render = () => {
  const encoder = gpu.device.createCommandEncoder();

  const computePass = encoder.beginComputePass();
  computePass.setPipeline(simulationPipeline);
  computePass.setBindGroup(0, bindGroups[cellState.activeBuffer]);
  const workgroupCount = Math.ceil(gridSize / simulationWorkgroupSize);
  computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
  computePass.end();

  const renderPass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: gpu.context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: clearColor,
      },
    ],
  });

  const viewportLength = Math.min(canvas.width, canvas.height);
  const viewportOffsetX = Math.max(
    0,
    Math.round((canvas.width - viewportLength) / 2),
  );
  const viewportOffsetY = Math.max(
    0,
    Math.round((canvas.height - viewportLength) / 2),
  );
  renderPass.setViewport(
    viewportOffsetX,
    viewportOffsetY,
    viewportLength,
    viewportLength,
    0,
    1,
  );

  renderPass.setPipeline(cellPipeline);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setBindGroup(0, bindGroups[cellState.activeBuffer]);
  renderPass.draw(
    vertices.length / numDimensions,
    Math.pow(gridSize, numDimensions),
  );
  renderPass.end();

  gpu.device.queue.submit([encoder.finish()]);
};

resizeCanvas();
window.addEventListener('resize', () => resizeCanvas());

setInterval(
  () => requestAnimationFrame(() => render()),
  renderLoopIntervalMs,
);

setInterval(() => cellState.iterate(), gameIterationIntervalMs);
