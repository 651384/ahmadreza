import fs from 'node:fs';
import assert from 'node:assert/strict';

const graph = JSON.parse(fs.readFileSync(new URL('../src/graph-v1.json', import.meta.url), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(new URL('../src/graph-taxonomy-v1.json', import.meta.url), 'utf8'));
const graphIds = graph.nodes.map(node => node.id);
const taxonomyIds = Object.keys(taxonomy.nodes);
const uniqueGraphIds = new Set(graphIds);
const counts = {};

assert.equal(uniqueGraphIds.size, graphIds.length, 'Graph has duplicate node IDs');
assert.equal(new Set(taxonomyIds).size, taxonomyIds.length, 'Taxonomy has duplicate node IDs');
assert.deepEqual([...taxonomyIds].sort(), [...graphIds].sort(), 'Taxonomy IDs must match graph node IDs exactly');
assert.equal(taxonomy.expectedNodeCount, graph.nodes.length, 'Expected node count is stale');

for (const [id, entry] of Object.entries(taxonomy.nodes)) {
  assert.ok(taxonomy.domains[entry.domain], `Unknown domain for ${id}: ${entry.domain}`);
  assert.equal(typeof entry.subcategory, 'string');
  assert.ok(entry.subcategory.length > 0, `Missing subcategory for ${id}`);
  counts[entry.domain] = (counts[entry.domain] || 0) + 1;
}
assert.deepEqual(taxonomy.domainCounts, Object.fromEntries(Object.keys(taxonomy.domains).map(key => [key, counts[key] || 0])), 'Stored domain counts do not match actual mapping');
console.log(JSON.stringify({ result: 'PASS', graphId: graph.graphId, revision: graph.revision, nodes: graph.nodes.length, domains: taxonomy.domainCounts }, null, 2));
