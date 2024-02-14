@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellStateIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

fn cellIndex(cell: vec2u) -> u32 {
  let wrappedX = cell.x % u32(grid.x);
  let wrappedY = cell.y % u32(grid.y);
  return wrappedY * u32(grid.x) + wrappedX;
}

fn cellActive(x: u32, y: u32) -> u32 {
  return cellStateIn[cellIndex(vec2(x, y))];
}

// This workgroup size must be kept in sync the corresponding
// TypeScript value.
@compute @workgroup_size(8, 8)
fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
  let activeNeighbors =
    cellActive(cell.x - 1, cell.y - 1) +
    cellActive(cell.x + 0, cell.y - 1) +
    cellActive(cell.x + 1, cell.y - 1) +
    cellActive(cell.x - 1, cell.y + 0) +
    cellActive(cell.x + 1, cell.y + 0) +
    cellActive(cell.x - 1, cell.y + 1) +
    cellActive(cell.x + 0, cell.y + 1) +
    cellActive(cell.x + 1, cell.y + 1);
  
  let i = cellIndex(cell.xy);
  switch activeNeighbors {
    // Active cells with 2 neighbors stay active.
    case 2: {
      cellStateOut[i] = cellStateIn[i];
    }
    // Cells with 3 neighbors become or stay active.
    case 3: {
      cellStateOut[i] = 1;
    }
    // Cells with <2 or >3 neighbors become inactive.
    default: {
      cellStateOut[i] = 0;
    }
  }
}
