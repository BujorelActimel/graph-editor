class Graph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.directed = false;
    }

    getNextNodeId() {
        if (this.nodes.size === 0) {
            return 1;
        }
        // Find the maximum numeric node ID
        let maxId = 0;
        for (const nodeId of this.nodes.keys()) {
            const numId = Number(nodeId);
            if (!isNaN(numId) && numId > maxId) {
                maxId = numId;
            }
        }
        return maxId + 1;
    }

    addNode(x, y, label = null) {
        const id = label !== null ? label : this.getNextNodeId();
        if (!this.nodes.has(id)) {
            this.nodes.set(id, { id, x, y, vx: 0, vy: 0, label: String(id) });
        }
        return id;
    }

    removeNode(id) {
        this.nodes.delete(id);
        const edgesToRemove = [];
        for (const [key, edge] of this.edges) {
            if (edge.from === id || edge.to === id) {
                edgesToRemove.push(key);
            }
        }
        edgesToRemove.forEach(key => this.edges.delete(key));
    }

    addEdge(from, to) {
        if (!this.nodes.has(from) || !this.nodes.has(to)) return;

        const key1 = `${from}-${to}`;
        const key2 = `${to}-${from}`;

        if (this.directed) {
            this.edges.set(key1, { from, to });
        } else {
            if (!this.edges.has(key1) && !this.edges.has(key2)) {
                this.edges.set(key1, { from, to });
            }
        }
    }

    hasEdge(from, to) {
        const key1 = `${from}-${to}`;
        const key2 = `${to}-${from}`;
        return this.edges.has(key1) || (!this.directed && this.edges.has(key2));
    }

    clear() {
        this.nodes.clear();
        this.edges.clear();
    }

    parseEdgeList(text) {
        this.clear();
        const lines = text.trim().split('\n');
        const nodeSet = new Set();

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
                const from = parts[0];
                const to = parts[1];
                nodeSet.add(from);
                nodeSet.add(to);
            }
        }

        const nodeArray = Array.from(nodeSet);
        nodeArray.forEach((nodeId, index) => {
            const angle = (index / nodeArray.length) * 2 * Math.PI;
            const radius = Math.min(canvas.width, canvas.height) * 0.3;
            const x = canvas.width / 2 + Math.cos(angle) * radius;
            const y = canvas.height / 2 + Math.sin(angle) * radius;
            this.addNode(x, y, nodeId);
        });

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
                this.addEdge(parts[0], parts[1]);
            }
        }
    }

    parseAdjacencyList(text) {
        this.clear();
        const lines = text.trim().split('\n');
        const nodeSet = new Set();

        for (const line of lines) {
            const parts = line.split(':');
            if (parts.length >= 1) {
                const from = parts[0].trim();
                nodeSet.add(from);
                if (parts.length >= 2) {
                    const neighbors = parts[1].trim().split(/\s+/).filter(n => n.length > 0);
                    neighbors.forEach(n => nodeSet.add(n));
                }
            }
        }

        const nodeArray = Array.from(nodeSet);
        nodeArray.forEach((nodeId, index) => {
            const angle = (index / nodeArray.length) * 2 * Math.PI;
            const radius = Math.min(canvas.width, canvas.height) * 0.3;
            const x = canvas.width / 2 + Math.cos(angle) * radius;
            const y = canvas.height / 2 + Math.sin(angle) * radius;
            this.addNode(x, y, nodeId);
        });

        for (const line of lines) {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const from = parts[0].trim();
                const neighbors = parts[1].trim().split(/\s+/).filter(n => n.length > 0);
                neighbors.forEach(to => this.addEdge(from, to));
            }
        }
    }

    parseAdjacencyMatrix(text) {
        this.clear();
        const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
        const n = lines.length;

        for (let i = 0; i < n; i++) {
            const angle = (i / n) * 2 * Math.PI;
            const radius = Math.min(canvas.width, canvas.height) * 0.3;
            const x = canvas.width / 2 + Math.cos(angle) * radius;
            const y = canvas.height / 2 + Math.sin(angle) * radius;
            this.addNode(x, y, i);
        }

        for (let i = 0; i < n; i++) {
            const row = lines[i].trim().split(/\s+/);
            for (let j = 0; j < row.length && j < n; j++) {
                if (row[j] !== '0') {
                    this.addEdge(i, j);
                }
            }
        }
    }

    exportEdgeList() {
        const lines = [];
        for (const edge of this.edges.values()) {
            lines.push(`${edge.from} ${edge.to}`);
        }
        return lines.join('\n');
    }

    exportAdjacencyList() {
        const adjList = new Map();

        for (const nodeId of this.nodes.keys()) {
            adjList.set(nodeId, []);
        }

        for (const edge of this.edges.values()) {
            if (!adjList.has(edge.from)) adjList.set(edge.from, []);
            adjList.get(edge.from).push(edge.to);

            if (!this.directed) {
                if (!adjList.has(edge.to)) adjList.set(edge.to, []);
                adjList.get(edge.to).push(edge.from);
            }
        }

        const lines = [];
        for (const [node, neighbors] of adjList) {
            lines.push(`${node}: ${neighbors.join(' ')}`);
        }
        return lines.join('\n');
    }

    exportAdjacencyMatrix() {
        const nodeIds = Array.from(this.nodes.keys()).sort();
        const n = nodeIds.length;
        const matrix = Array(n).fill(0).map(() => Array(n).fill(0));

        const idToIndex = new Map();
        nodeIds.forEach((id, index) => idToIndex.set(id, index));

        for (const edge of this.edges.values()) {
            const i = idToIndex.get(edge.from);
            const j = idToIndex.get(edge.to);
            if (i !== undefined && j !== undefined) {
                matrix[i][j] = 1;
                if (!this.directed) {
                    matrix[j][i] = 1;
                }
            }
        }

        return matrix.map(row => row.join(' ')).join('\n');
    }
}

const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');
const graph = new Graph();

const directedCheckbox = document.getElementById('directed-checkbox');
const formatSelect = document.getElementById('format-select');
const formatInfo = document.getElementById('format-info');
const graphInput = document.getElementById('graph-input');
const parseBtn = document.getElementById('parse-btn');
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('export-btn');
const exportFormat = document.getElementById('export-format');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function updateFormatInfo() {
    const format = formatSelect.value;
    switch (format) {
        case 'edge-list':
            formatInfo.textContent = 'Enter edges, one per line (e.g., "1 2" or "A B")';
            graphInput.placeholder = 'Example:\n1 2\n2 3\n3 4';
            break;
        case 'adjacency-list':
            formatInfo.textContent = 'Enter adjacency list (e.g., "1: 2 3" or "A: B C")';
            graphInput.placeholder = 'Example:\n1: 2 3\n2: 3\n3: 4';
            break;
        case 'adjacency-matrix':
            formatInfo.textContent = 'Enter adjacency matrix (space-separated 0s and 1s)';
            graphInput.placeholder = 'Example:\n0 1 1 0\n0 0 1 0\n0 0 0 1\n0 0 0 0';
            break;
    }
}

formatSelect.addEventListener('change', updateFormatInfo);

parseBtn.addEventListener('click', () => {
    const text = graphInput.value;
    if (!text.trim()) return;

    const format = formatSelect.value;
    try {
        switch (format) {
            case 'edge-list':
                graph.parseEdgeList(text);
                break;
            case 'adjacency-list':
                graph.parseAdjacencyList(text);
                break;
            case 'adjacency-matrix':
                graph.parseAdjacencyMatrix(text);
                break;
        }
    } catch (e) {
        alert('Error parsing graph: ' + e.message);
    }
});

clearBtn.addEventListener('click', () => {
    graph.clear();
    graphInput.value = '';
});

exportBtn.addEventListener('click', () => {
    const format = exportFormat.value;

    if (format === 'image') {
        // Export as PNG image
        const link = document.createElement('a');
        link.download = 'graph.png';
        link.href = canvas.toDataURL();
        link.click();
    } else {
        // Export as text
        let output = '';

        switch (format) {
            case 'edge-list':
                output = graph.exportEdgeList();
                break;
            case 'adjacency-list':
                output = graph.exportAdjacencyList();
                break;
            case 'adjacency-matrix':
                output = graph.exportAdjacencyMatrix();
                break;
        }

        // Download as text file
        const blob = new Blob([output], { type: 'text/plain' });
        const link = document.createElement('a');
        link.download = `graph-${format}.txt`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }
});

directedCheckbox.addEventListener('change', () => {
    graph.directed = directedCheckbox.checked;
});

let draggedNode = null;
let dragStart = null;
let hoveredNode = null;
let hoveredEdge = null;
let selectedNode = null; // For edge creation
let isDragging = false;

function getNodeAt(x, y) {
    for (const node of graph.nodes.values()) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS) {
            return node;
        }
    }
    return null;
}

function getEdgeAt(x, y) {
    const threshold = 8; // Distance threshold for clicking on edge

    for (const edge of graph.edges.values()) {
        const from = graph.nodes.get(edge.from);
        const to = graph.nodes.get(edge.to);

        if (!from || !to) continue;

        // Calculate distance from point to line segment
        const A = x - from.x;
        const B = y - from.y;
        const C = to.x - from.x;
        const D = to.y - from.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = from.x;
            yy = from.y;
        } else if (param > 1) {
            xx = to.x;
            yy = to.y;
        } else {
            xx = from.x + param * C;
            yy = from.y + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < threshold) {
            return edge;
        }
    }

    return null;
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 0) {
        const node = getNodeAt(x, y);
        if (node) {
            draggedNode = node;
            dragStart = { x, y };
            isDragging = false;
        } else {
            graph.addNode(x, y);
            selectedNode = null;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    hoveredNode = getNodeAt(x, y);

    // Only check for edge hover if not hovering over a node
    if (!hoveredNode) {
        hoveredEdge = getEdgeAt(x, y);
    } else {
        hoveredEdge = null;
    }

    if (draggedNode && dragStart) {
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Start dragging if moved more than 5 pixels
        if (dist > 5) {
            isDragging = true;
            draggedNode.x = x;
            draggedNode.y = y;
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (draggedNode && dragStart) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (!isDragging) {
            // It was a click, not a drag
            if (selectedNode === null) {
                // First node selected
                selectedNode = draggedNode;
            } else if (selectedNode === draggedNode) {
                // Clicked same node, deselect
                selectedNode = null;
            } else {
                // Second node selected, create edge
                graph.addEdge(selectedNode.id, draggedNode.id);
                selectedNode = null;
            }
        } else {
            // Was dragging, update final position
            draggedNode.x = x;
            draggedNode.y = y;
        }
    }

    draggedNode = null;
    dragStart = null;
    isDragging = false;
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = getNodeAt(x, y);
    if (node) {
        graph.removeNode(node.id);
        selectedNode = null;
        return;
    }

    const edge = getEdgeAt(x, y);
    if (edge) {
        const key = `${edge.from}-${edge.to}`;
        graph.edges.delete(key);
        // Also delete reverse edge if undirected
        if (!graph.directed) {
            const reverseKey = `${edge.to}-${edge.from}`;
            graph.edges.delete(reverseKey);
        }
    }
});

const NODE_RADIUS = 22;
const NODE_COLOR = '#63b3ed';
const NODE_HOVER_COLOR = '#7dc4f5';
const NODE_SELECTED_COLOR = '#4299e1';
const NODE_TEXT_COLOR = '#1a202c';
const NODE_BORDER_COLOR = '#1a202c';
const NODE_HOVER_BORDER_COLOR = '#63b3ed';
const EDGE_COLOR = '#4a5568';
const EDGE_HOVER_COLOR = '#718096';
const EDGE_SELECTED_COLOR = '#63b3ed';
const ARROW_SIZE = 10;

function drawArrow(fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX);

    const endX = toX - Math.cos(angle) * NODE_RADIUS;
    const endY = toY - Math.sin(angle) * NODE_RADIUS;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - ARROW_SIZE * Math.cos(angle - Math.PI / 6),
        endY - ARROW_SIZE * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - ARROW_SIZE * Math.cos(angle + Math.PI / 6),
        endY - ARROW_SIZE * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const edge of graph.edges.values()) {
        const from = graph.nodes.get(edge.from);
        const to = graph.nodes.get(edge.to);

        if (from && to) {
            const isHovered = hoveredEdge === edge;

            ctx.strokeStyle = isHovered ? EDGE_HOVER_COLOR : EDGE_COLOR;
            ctx.fillStyle = isHovered ? EDGE_HOVER_COLOR : EDGE_COLOR;
            ctx.lineWidth = isHovered ? 4 : 3;

            if (graph.directed) {
                drawArrow(from.x, from.y, to.x, to.y);
            } else {
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }
        }
    }

    // Draw preview edge when a node is selected
    if (selectedNode && hoveredNode && hoveredNode !== selectedNode) {
        ctx.strokeStyle = EDGE_SELECTED_COLOR;
        ctx.lineWidth = 4;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(selectedNode.x, selectedNode.y);
        ctx.lineTo(hoveredNode.x, hoveredNode.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw nodes
    for (const node of graph.nodes.values()) {
        const isHovered = hoveredNode === node;
        const isSelected = selectedNode === node;

        // Selection ring
        if (isSelected) {
            ctx.strokeStyle = NODE_SELECTED_COLOR;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(node.x, node.y, NODE_RADIUS + 5, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // Node fill
        if (isSelected) {
            ctx.fillStyle = NODE_SELECTED_COLOR;
        } else if (isHovered) {
            ctx.fillStyle = NODE_HOVER_COLOR;
        } else {
            ctx.fillStyle = NODE_COLOR;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
        ctx.fill();

        // Node border - thicker and brighter when hovered
        if (isHovered) {
            ctx.strokeStyle = NODE_HOVER_BORDER_COLOR;
            ctx.lineWidth = 3.5;
        } else {
            ctx.strokeStyle = NODE_BORDER_COLOR;
            ctx.lineWidth = 2.5;
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
        ctx.stroke();

        // Node label
        ctx.fillStyle = NODE_TEXT_COLOR;
        ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
    }

    requestAnimationFrame(render);
}

render();
