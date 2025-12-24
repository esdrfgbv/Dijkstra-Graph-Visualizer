const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

let nodes = [];
let edges = [];
let mode = "";
let startNode = null;
let endNode = null;

document.getElementById("createNodes").onclick = createNodes;
document.getElementById("addEdge").onclick = () => (mode = "edge");
document.getElementById("setStart").onclick = () => (mode = "start");
document.getElementById("setEnd").onclick = () => (mode = "end");
document.getElementById("runDijkstra").onclick = runDijkstra;
document.getElementById("reset").onclick = resetGraph;

function createNodes() {
  const count = parseInt(document.getElementById("nodeCount").value);
  nodes = [];
  edges = [];
  startNode = null;
  endNode = null;

  for (let i = 0; i < count; i++) {
    nodes.push({
      id: i,
      x: Math.random() * 700 + 50,
      y: Math.random() * 400 + 50,
      isDragging: false
    });
  }
  draw();
}

// Draw nodes and edges
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw edges
  edges.forEach(e => {
    const from = nodes[e.from];
    const to = nodes[e.to];
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw weight
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText(e.weight, midX + 5, midY - 5);
  });

  // draw nodes
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 20, 0, 2 * Math.PI);
    ctx.fillStyle =
      n === startNode ? "#00cc66" : n === endNode ? "#ff3333" : "#004aad";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n.id, n.x, n.y);
  });
}

// Detect node click
canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const clickedNode = nodes.find(
    n => Math.hypot(n.x - mouseX, n.y - mouseY) < 20
  );

  if (mode === "edge") {
    handleEdgeMode(clickedNode);
  } else if (mode === "start") {
    startNode = clickedNode;
    mode = "";
  } else if (mode === "end") {
    endNode = clickedNode;
    mode = "";
  } else if (clickedNode) {
    clickedNode.isDragging = true;
  }
  draw();
});

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  nodes.forEach(n => {
    if (n.isDragging) {
      n.x = mouseX;
      n.y = mouseY;
    }
  });
  draw();
});

canvas.addEventListener("mouseup", () => {
  nodes.forEach(n => (n.isDragging = false));
});

let firstEdgeNode = null;

function handleEdgeMode(clickedNode) {
  if (!clickedNode) return;
  if (!firstEdgeNode) {
    firstEdgeNode = clickedNode;
  } else {
    if (firstEdgeNode !== clickedNode) {
      const weight = parseInt(prompt("Enter edge weight:"));
      if (!isNaN(weight)) {
        edges.push({ from: firstEdgeNode.id, to: clickedNode.id, weight });
      }
    }
    firstEdgeNode = null;
    mode = "";
  }
}

function resetGraph() {
  nodes = [];
  edges = [];
  startNode = null;
  endNode = null;
  draw();
}

// Dijkstra algorithm
function runDijkstra() {
  if (!startNode || !endNode) {
    alert("Select start and end nodes first!");
    return;
  }

  const dist = Array(nodes.length).fill(Infinity);
  const prev = Array(nodes.length).fill(null);
  const visited = new Set();
  dist[startNode.id] = 0;

  while (visited.size < nodes.length) {
    let u = null;
    let minDist = Infinity;
    for (let i = 0; i < dist.length; i++) {
      if (!visited.has(i) && dist[i] < minDist) {
        minDist = dist[i];
        u = i;
      }
    }

    if (u === null || u === endNode.id) break;
    visited.add(u);

    edges.forEach(e => {
      if (e.from === u && !visited.has(e.to)) {
        const newDist = dist[u] + e.weight;
        if (newDist < dist[e.to]) {
          dist[e.to] = newDist;
          prev[e.to] = u;
        }
      }
      if (e.to === u && !visited.has(e.from)) {
        const newDist = dist[u] + e.weight;
        if (newDist < dist[e.from]) {
          dist[e.from] = newDist;
          prev[e.from] = u;
        }
      }
    });
  }

  // Highlight shortest path
  let path = [];
  let u = endNode.id;
  while (u !== null) {
    path.unshift(u);
    u = prev[u];
  }

  draw();
  if (path.length > 1) {
    ctx.strokeStyle = "#ff6600";
    ctx.lineWidth = 4;
    for (let i = 0; i < path.length - 1; i++) {
      const from = nodes[path[i]];
      const to = nodes[path[i + 1]];
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    alert(`Shortest distance: ${dist[endNode.id]}`);
  } else {
    alert("No path found!");
  }
}
