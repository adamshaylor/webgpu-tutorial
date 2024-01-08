import initWebGpu from './lib/webGpu';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas');

const x = (xPercent: number): number => canvas.width * xPercent;
const y = (yPercent: number): number => canvas.height * yPercent;

const minDim = (percentMinDim: number): number =>
  canvas.width < canvas.height
    ? canvas.height * percentMinDim
    : canvas.width * percentMinDim;

const resizeCanvas = (): void => {
  const scale = window.devicePixelRatio;
  canvas.width = Math.floor(canvas.clientWidth * scale);
  canvas.height = Math.floor(canvas.clientHeight * scale);
};

resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
});

const initResult = await initWebGpu(canvas, {
  r: 255,
  g: 0,
  b: 0,
  a: 1,
});

if (initResult.ok === false) {
  alert(initResult.error.message);
  throw initResult.error;
}

const gpu = initResult.value;
console.log({ gpu });
