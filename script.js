const gridEl = document.getElementById('grid');
const runBtn = document.getElementById('runBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const clearWallsBtn = document.getElementById('clearWallsBtn');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const speedRange = document.getElementById('speed');

let ROWS = parseInt(rowsInput.value,10);
let COLS = parseInt(colsInput.value,10);
let grid = [];
let start = {r: Math.floor(ROWS/2), c: Math.floor(COLS/5)};
let end = {r: Math.floor(ROWS/2), c: Math.floor(COLS*4/5)};

let isMouseDown = false;
let paintMode = 'wall';
let animationHandle = null;
let speed = parseInt(speedRange.value,10);

function makeGrid(r,c){
  ROWS=r;COLS=c;
  grid = [];
  for(let i=0;i<r;i++){
    const row = [];
    for(let j=0;j<c;j++){
      row.push({r:i,c:j,wall:false,dist:Infinity,prev:null,visited:false});
    }
    grid.push(row);
  }
}

function renderGrid(){
  gridEl.innerHTML='';
  gridEl.style.gridTemplateColumns = `repeat(${COLS}, 28px)`;
  for(let i=0;i<ROWS;i++){
    for(let j=0;j<COLS;j++){
      const node = grid[i][j];
      const cell = document.createElement('div');
      cell.className='cell';
      cell.dataset.r=i;cell.dataset.c=j;
      if(node.wall) cell.classList.add('wall');
      if(i===start.r && j===start.c) cell.classList.add('start');
      if(i===end.r && j===end.c) cell.classList.add('end');
      if(node.visited) cell.classList.add('visited');
      if(node.inPath) cell.classList.add('path');

      cell.addEventListener('mousedown', onCellDown);
      cell.addEventListener('mousemove', onCellMove);
      cell.addEventListener('contextmenu', onCellRight);
      gridEl.appendChild(cell);
    }
  }
}

function onCellDown(e){
  e.preventDefault();
  const r = +this.dataset.r, c=+this.dataset.c;
  isMouseDown = true;
  if(e.button===0){
    paintMode = grid[r][c].wall ? 'erase' : 'wall';
    toggleWall(r,c, paintMode==='wall');
  }
}

function onCellMove(e){
  if(!isMouseDown) return;
  const r = +this.dataset.r, c=+this.dataset.c;
  if(e.buttons & 1){
    if(paintMode==='wall') toggleWall(r,c,true);
    else toggleWall(r,c,false);
  }
}

document.addEventListener('mouseup', ()=> isMouseDown=false);

function onCellRight(e){
  e.preventDefault();
  const r = +this.dataset.r, c=+this.dataset.c;
  if(e.shiftKey){ end={r,c}; }
  else { start={r,c}; }
  resetStates(false);
  renderGrid();
}

function toggleWall(r,c,val){
  if((r===start.r && c===start.c) || (r===end.r && c===end.c)) return;
  grid[r][c].wall = val;
  grid[r][c].visited = false;
  grid[r][c].inPath = false;
  renderGridCell(r,c);
}

function renderGridCell(r,c){
  const idx = r*COLS + c;
  const el = gridEl.children[idx];
  const node = grid[r][c];
  el.className='cell';
  if(node.wall) el.classList.add('wall');
  if(r===start.r && c===start.c) el.classList.add('start');
  if(r===end.r && c===end.c) el.classList.add('end');
  if(node.visited) el.classList.add('visited');
  if(node.inPath) el.classList.add('path');
}

function neighbors(node){
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const out = [];
  for(const d of dirs){
    const nr = node.r + d[0], nc = node.c + d[1];
    if(nr>=0 && nr<ROWS && nc>=0 && nc<COLS) out.push(grid[nr][nc]);
  }
  return out;
}

function resetStates(full=true){
  for(let i=0;i<ROWS;i++){
    for(let j=0;j<COLS;j++){
      const n = grid[i][j];
      n.dist = Infinity; n.prev=null; n.visited=false; n.inPath=false;
    }
  }
  if(full){ renderGrid(); }
  stopAnimation();
}

function* dijkstraGenerator(){
  grid[start.r][start.c].dist = 0;
  const pq = [grid[start.r][start.c]];
  while(pq.length){
    pq.sort((a,b)=>a.dist-b.dist);
    const node = pq.shift();
    if(node.visited) continue;
    node.visited = true;
    yield {type:'visit',node};
    if(node.r===end.r && node.c===end.c) break;
    for(const nb of neighbors(node)){
      if(nb.wall) continue;
      const alt = node.dist + 1;
      if(alt < nb.dist){
        nb.dist = alt;
        nb.prev = node;
        pq.push(nb);
      }
    }
  }
  const path = [];
  let cur = grid[end.r][end.c];
  while(cur){ path.push(cur); cur.inPath = true; cur = cur.prev; }
  path.reverse();
  for(const p of path){ yield {type:'path',node:p}; }
}

let gen = null;
function runOnceStep(){
  if(!gen) gen = dijkstraGenerator();
  const {value, done} = gen.next();
  if(value){
    if(value.type==='visit' || value.type==='path') renderGridCell(value.node.r,value.node.c);
  }
  if(done){ gen = null; stopAnimation(); }
  return done;
}

function animateRun(){
  if(animationHandle) return;
  gen = gen || dijkstraGenerator();
  const interval = Math.max(10, 410 - parseInt(speedRange.value,10));
  animationHandle = setInterval(()=>{ if(runOnceStep()) stopAnimation(); }, interval);
}

function stopAnimation(){ if(animationHandle){ clearInterval(animationHandle); animationHandle=null; } }

runBtn.addEventListener('click', ()=>{ resetStates(false); animateRun(); });
stepBtn.addEventListener('click', ()=>{ resetStates(false); runOnceStep(); });
resetBtn.addEventListener('click', ()=>{ makeGrid(ROWS,COLS); resetStates(); renderGrid(); });
clearWallsBtn.addEventListener('click', ()=>{ for(let i=0;i<ROWS;i++) for(let j=0;j<COLS;j++) grid[i][j].wall=false; resetStates(); renderGrid(); });

rowsInput.addEventListener('change', ()=>{ let r=parseInt(rowsInput.value,10); makeGrid(r,COLS); resetStates(); renderGrid(); });
colsInput.addEventListener('change', ()=>{ let c=parseInt(colsInput.value,10); makeGrid(ROWS,c); resetStates(); renderGrid(); });
speedRange.addEventListener('input', ()=>{ speed=parseInt(speedRange.value,10); });

makeGrid(ROWS,COLS);
renderGrid();
