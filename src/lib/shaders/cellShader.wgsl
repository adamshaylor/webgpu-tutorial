struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
};

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) cell: vec2f,
};

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellState: array<u32>;

fn cellVector(cellIndex: u32, gridSize: f32) -> vec2f {
  let cellIndexF = f32(cellIndex);
  let column = cellIndexF % gridSize;
  let row = floor(cellIndexF / gridSize);
  return vec2f(column, row);
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  let cell = cellVector(input.instance, grid.x);
  let state = f32(cellState[input.instance]);
  let cellOffset = cell / grid * 2;
  let gridPos = (input.pos * state + 1) / grid - 1 + cellOffset;

  var output: VertexOutput;
  output.pos = vec4f(gridPos, 0, 1);
  output.cell = cell;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let c = input.cell / grid;
  return vec4f(1 - c.y, 1, 1 - c.x, 1);
}
