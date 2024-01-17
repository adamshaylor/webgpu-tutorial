import initWebGpu from './lib/webGpu';
import { numDimensions, gridSize } from './lib/constants';
import cellShader from './lib/cellShader.wgsl?raw';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas');

const resizeCanvas = (): void => {
  const scale = window.devicePixelRatio;
  canvas.width = Math.floor(canvas.clientWidth * scale);
  canvas.height = Math.floor(canvas.clientHeight * scale);
};

const initResult = await initWebGpu(canvas);
if (initResult.ok === false) {
  alert(initResult.error.message);
  throw initResult.error;
}
const gpu = initResult.value;

const draw = () => {
  const pass = gpu.encoder.beginRenderPass({
    colorAttachments: [
      {
        view: gpu.context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
      },
    ],
  });

  // prettier-ignore
  const vertices = new Float32Array([
  //   X,    Y,
    -0.8, -0.8, // Triangle 1 (Blue)
     0.8, -0.8,
     0.8,  0.8,
  
    -0.8, -0.8, // Triangle 2 (Red)
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

  const cellPipeline = gpu.device.createRenderPipeline({
    label: 'Cell pipeline',
    layout: 'auto',
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

  const bindGroup = gpu.device.createBindGroup({
    label: 'Cell renderer bind group',
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  pass.setPipeline(cellPipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setBindGroup(0, bindGroup);
  pass.draw(vertices.length / numDimensions);
  pass.end();
  gpu.device.queue.submit([gpu.encoder.finish()]);
};

resizeCanvas();
draw();
window.addEventListener('resize', () => {
  resizeCanvas();
});
