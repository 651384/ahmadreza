import fs from 'node:fs';

const file = new URL('../src/graph-v1.json', import.meta.url);
const graph = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const allowedStatuses = new Set([
  'VERIFIED', 'FAILED', 'BLOCKED', 'NOT TESTED', 'PLANNED',
  'CONFIG_ONLY', 'NOT_VERIFIED', 'NOT_CONNECTED'
]);
const requiredNodeFields = [
  'label', 'kind', 'status', 'role', 'capabilities', 'accessMethod',
  'permissions', 'evidence', 'lastVerified', 'nextAction'
];

if (graph.schema !== 'simot.visual-control-plane.graph') errors.push('Unexpected graph schema');
if (graph.schemaVersion !== 1) errors.push('Unsupported schemaVersion');
if (!Number.isInteger(graph.revision) || graph.revision < 1) errors.push('revision must be a positive integer');
if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
  errors.push('nodes and edges must be arrays');
} else {
  const nodeIds = graph.nodes.map(n => n.id);
  const edgeIds = graph.edges.map(e => e.id);
  const nodeIdSet = new Set(nodeIds);

  if (nodeIds.some(id => typeof id !== 'string' || !id.trim())) errors.push('Every node needs a non-empty id');
  if (new Set(nodeIds).size !== nodeIds.length) errors.push('Duplicate node IDs');
  if (edgeIds.some(id => typeof id !== 'string' || !id.trim())) errors.push('Every edge needs a non-empty id');
  if (new Set(edgeIds).size !== edgeIds.length) errors.push('Duplicate edge IDs');

  for (const node of graph.nodes) {
    if (!node.position || !Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)) {
      errors.push('Invalid position for node ' + node.id);
    }
    if (!node.data || typeof node.data !== 'object') {
      errors.push('Missing data for node ' + node.id);
      continue;
    }
    for (const field of requiredNodeFields) {
      if (!(field in node.data)) errors.push('Missing node field ' + field + ' on ' + node.id);
    }
    if (!allowedStatuses.has(node.data.status)) errors.push('Unknown node status on ' + node.id + ': ' + node.data.status);
    if (!Array.isArray(node.data.capabilities)) errors.push('capabilities must be an array on ' + node.id);
  }

  const relationKeys = new Set();
  for (const edge of graph.edges) {
    if (!nodeIdSet.has(edge.source)) errors.push('Missing source node for edge ' + edge.id + ': ' + edge.source);
    if (!nodeIdSet.has(edge.target)) errors.push('Missing target node for edge ' + edge.id + ': ' + edge.target);
    if (!allowedStatuses.has(edge.status)) errors.push('Unknown edge status on ' + edge.id + ': ' + edge.status);
    const key = [edge.source, edge.target, edge.relation || edge.label].join('::');
    if (relationKeys.has(key)) errors.push('Duplicate semantic edge: ' + key);
    relationKeys.add(key);
  }
}

if (errors.length) {
  console.error('GRAPH_VALIDATION_FAILED');
  for (const error of errors) console.error('- ' + error);
  process.exitCode = 1;
} else {
  console.log('GRAPH_VALIDATION=PASS');
  console.log('REVISION=' + graph.revision);
  console.log('NODES=' + graph.nodes.length);
  console.log('EDGES=' + graph.edges.length);
  console.log('UNIQUE_NODE_IDS=' + new Set(graph.nodes.map(n => n.id)).size);
  console.log('UNIQUE_EDGE_IDS=' + new Set(graph.edges.map(e => e.id)).size);
  console.log('ALL_EDGE_REFERENCES_VALID=true');
}
