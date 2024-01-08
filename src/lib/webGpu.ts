import type { Result } from './definitions';

interface WebGpuInstance {
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  encoder: GPUCommandEncoder;
}

const initWebGpu = async (
  canvas: HTMLCanvasElement,
): Promise<Result<WebGpuInstance>> => {
  try {
    if (!navigator.gpu) {
      return {
        ok: false,
        error: new Error('WebGPU is not supported by this browser.', {
          cause: 'navigator.gpu does not exist',
        }),
      };
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return {
        ok: false,
        error: new Error('WebGPU is not supported by this device.', {
          cause: 'requestAdapter() did not return an adapter',
        }),
      };
    }

    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
    });
    const encoder = device.createCommandEncoder();

    return {
      ok: true,
      value: {
        adapter,
        context,
        format,
        device,
        encoder,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: new Error(
        'Something went wrong. Does this device and browser support WebGPU?',
        { cause: error },
      ),
    };
  }
};

export default initWebGpu;
