import { useCallback, useEffect, useMemo, useState } from 'react';
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, Handle, Position, MarkerType, addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import { Download, GitBranch, RefreshCw, ShieldAlert, Workflow } from 'lucide-react';
import initialGraph from './graph-v1.json';
import taxonomy from './taxonomy-v1.json';

const statusText = {
  VERIFIED: 'تأییدشده',
  FAILED: 'ناموفق',
  BLOCKED: 'مسدود',
  'NOT TESTED': 'آزمایش‌نشده',
  PLANNED: 'برنامه‌ریزی‌شده',
  CONFIG_ONLY: 'فقط تنظیمات',
  NOT_VERIFIED: 'تأییدنشده',
  NOT_CONNECTED: 'متصل نیست'
};
const statusClass = {
  VERIFIED: 'verified',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  'NOT TESTED': 'unknown',
  PLANNED: 'planned',
  CONFIG_ONLY: 'config',
  NOT_VERIFIED: 'unknown',
  NOT_CONNECTED: 'offline'
};

function SimotNode({ data, selected }) {
  return <div className={'node-card ' + data.kind + (selected ? ' selected' : '')}>
    <Handle type="target" position={Position.Top} />
    <div className="node-head"><span className="node-dot" /><span>{data.label}</span></div>
    <span className={'status-pill ' + (statusClass[data.status] || 'unknown')}>{statusText[data.status] || data.status}</span>
    <Handle type="source" position={Position.Bottom} />
  </div>;
}

const nodeTypes = { simotNode: SimotNode };

function Workspace() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges.map(e => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } })));
  const [selected, setSelected] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [revision, setRevision] = useState(initialGraph.revision || 1);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [notice, setNotice] = useState('');
  const [memoryStatus, setMemoryStatus] = useState('در حال بررسی اتصال خواندنی');
  const [memoryVersion, setMemoryVersion] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadMemoryGraph() {
      try {
        const listResponse = await fetch('/api/list/working', { cache: 'no-store' });
        const list = await listResponse.json();
        if (!listResponse.ok || list?.ok !== true || !Array.isArray(list.objects)) {
          throw new Error('MEMORY_LIST_FAILED');
        }
        const item = list.objects.find(object => object.object_id === 'simot-core-overview');
        if (!item) {
          if (active) setMemoryStatus('گراف در Master Memory پیدا نشد؛ نسخه همراه کد نمایش داده می‌شود');
          return;
        }
        const response = await fetch('/api/memory/working/simot-core-overview', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || result?.ok !== true || !result.metadata || typeof result.content !== 'string') {
          throw new Error('MEMORY_READ_FAILED');
        }
        const saved = JSON.parse(result.content);
        if (saved.schema !== initialGraph.schema || saved.schemaVersion !== initialGraph.schemaVersion ||
            saved.graphId !== initialGraph.graphId || !Array.isArray(saved.nodes) || !Array.isArray(saved.edges)) {
          throw new Error('INVALID_SAVED_GRAPH');
        }
        if (!Number.isInteger(result.metadata.version) || typeof result.metadata.sha256 !== 'string' ||
            !/^[a-f0-9]{64}$/i.test(result.metadata.sha256)) {
          throw new Error('INVALID_MEMORY_METADATA');
        }
        if (active) {
          setNodes(saved.nodes);
          setEdges(saved.edges.map(edge => ({ ...edge, markerEnd: { type: MarkerType.ArrowClosed } })));
          setRevision(saved.revision || initialGraph.revision || 1);
          setMemoryVersion(result.metadata.version);
          setMemoryStatus('گراف از Master Memory بارگذاری شد');
          setNotice('گراف از حافظهٔ اصلی خوانده شد؛ این رابط در این نسخه فقط‌خواندنی است.');
        }
      } catch {
        if (active) setMemoryStatus('خواندن Master Memory تأیید نشد؛ گراف همراه کد نمایش داده می‌شود');
      }
    }
    loadMemoryGraph();
    return () => { active = false; };
  }, [setNodes, setEdges]);
  const onConnect = useCallback(params => setEdges(es => addEdge({
    ...params,
    id: 'manual-' + Date.now(),
    label: 'ارتباط پیشنهادی',
    relation: 'ارتباط پیشنهادی',
    status: 'NOT TESTED',
    evidence: 'ارتباط محلی پیشنهادی؛ هنوز در فایل canonical ثبت یا بررسی نشده',
    permission: 'UNKNOWN؛ هیچ مجوز اجرایی از این ارتباط محلی استنتاج نشود',
    markerEnd: { type: MarkerType.ArrowClosed }
  }, es)), [setEdges]);
  const chosen = nodes.find(n => n.id === selected);
  const chosenEdge = edges.find(e => e.id === selectedEdgeId);
  const visibleNodes = useMemo(() => selectedDomain === 'all' ? nodes : nodes.filter(n => taxonomy.nodes[n.id]?.domain === selectedDomain), [nodes, selectedDomain]);
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(() => edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)), [edges, visibleNodeIds]);
  const selectedDomainLabel = selectedDomain === 'all' ? 'همهٔ حوزه‌ها' : taxonomy.domains.find(d => d.id === selectedDomain)?.label || 'حوزهٔ نامشخص';
  const graph = useMemo(() => ({
    schema: initialGraph.schema,
    schemaVersion: initialGraph.schemaVersion,
    graphId: initialGraph.graphId,
    revision,
    updatedAt: new Date().toISOString(),
    nodes,
    edges: edges.map(({ markerEnd, ...e }) => e)
  }), [nodes, edges, revision]);
  const verifiedEdges = edges.filter(e => (e.data?.status || e.status) === 'VERIFIED').length;
  const plannedNodes = nodes.filter(n => n.data.status === 'PLANNED').length;
  const untestedNodes = nodes.filter(n => n.data.status === 'NOT TESTED').length;
  const detailRows = chosen ? [
    ['شناسه پایدار', chosen.id],
    ['حوزهٔ معماری', taxonomy.domains.find(d => d.id === taxonomy.nodes[chosen.id]?.domain)?.label || 'نیازمند تعیین تکلیف'],
    ['زیردسته', taxonomy.nodes[chosen.id]?.subcategory || 'ثبت نشده'],
    ...(taxonomy.nodes[chosen.id]?.reviewRequired ? [['بازبینی دسته‌بندی', 'این نگاشت اولیه است و باید بازبینی شود']] : []),
    ['نوع فنی', chosen.data.kind],
    ['نقش', chosen.data.role],
    ['روش دسترسی', chosen.data.accessMethod],
    ['مجوزها', chosen.data.permissions],
    ['شواهد', chosen.data.evidence],
    ['آخرین تأیید', chosen.data.lastVerified],
    ['اقدام بعدی', chosen.data.nextAction]
  ].filter(([, value]) => value) : [];

  function exportGraph() {
    const nextRevision = revision + 1;
    const exportPayload = { ...graph, revision: nextRevision, updatedAt: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simot-graph-v' + graph.schemaVersion + '-r' + nextRevision + '.json';
    a.click();
    URL.revokeObjectURL(url);
    setRevision(nextRevision);
    setNotice('خروجی JSON آماده شد؛ این فایل فقط روی دستگاه شما دانلود می‌شود و در Master Memory ذخیره نمی‌شود.');
  }

  function resetGraph() {
    setNodes(initialGraph.nodes);
    setEdges(initialGraph.edges.map(e => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } })));
    setSelected(null);
    setSelectedEdgeId(null);
    setRevision(initialGraph.revision || 1);
    setNotice('نمای گراف به نسخهٔ اولیهٔ ثبت‌شده بازگشت.');
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon"><Workflow size={23} /></div>
        <div><div className="eyebrow">SIMOT AI OS</div><h1>کنترل‌پنل بصری</h1></div>
      </div>
      <div className="top-meta">
        <span className="local-tag"><span /> معماری شواهد‌محور</span>
        <span className="version"><GitBranch size={14} /> Graph v{initialGraph.schemaVersion} · r{revision}</span>
        <span className="version" role="status"><ShieldAlert size={14} /> {memoryStatus}{memoryVersion !== null ? ` · version ${memoryVersion}` : ''}</span>
      </div>
    </header>

    <section className="intro">
      <div>
        <p className="eyebrow">VISUAL CONTROL PLANE</p>
        <h2>معماری SIMOT AI OS</h2>
        <p className="subtitle">وضعیت هر جزء مستقل است؛ «آزمایش‌نشده» به معنی سالم یا خراب بودن نیست.</p>
      </div>
    </section>

    <section className="metrics">
      <div className="metric"><div><small>اجزای معماری</small><strong>{nodes.length}</strong></div></div>
      <div className="metric"><div><small>ارتباط‌های جهت‌دار</small><strong>{edges.length}</strong></div></div>
      <div className="metric"><div><small>ارتباط‌های دارای شواهد تأیید</small><strong>{verifiedEdges}</strong></div></div>
      <div className="metric"><div><small>اجزای برنامه‌ریزی‌شده</small><strong>{plannedNodes}</strong></div></div>
      <div className="metric"><div><small>اجزای آزمایش‌نشده</small><strong>{untestedNodes}</strong></div></div>
    </section>

    <section className="workspace">
      <div className="canvas-panel">
        <div className="canvas-toolbar">
          <div><strong>گراف معماری</strong><span>گره را انتخاب کن تا نقش، مجوز، شواهد و اقدام بعدی را ببینی.</span></div>
          <div className="toolbar-actions">
            <label className="domain-filter-label" htmlFor="domain-filter">نمایش حوزه</label>
            <select id="domain-filter" className="domain-filter" value={selectedDomain} onChange={e => { setSelectedDomain(e.target.value); setSelected(null); setSelectedEdgeId(null); }}>
              <option value="all">همهٔ حوزه‌ها (۷۷ گره)</option>
              {taxonomy.domains.map(domain => <option key={domain.id} value={domain.id}>{domain.label} ({Object.values(taxonomy.nodes).filter(item => item.domain === domain.id).length})</option>)}
            </select>
            <button className="primary" onClick={exportGraph}><Download size={15} /> خروجی JSON</button>
            <button className="secondary" onClick={resetGraph}><RefreshCw size={15} /> بازنشانی</button>
          </div>
        </div>
        <div className="flow-canvas" dir="ltr">
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, n) => { setSelected(n.id); setSelectedEdgeId(null); }}
            onEdgeClick={(_, e) => { setSelectedEdgeId(e.id); setSelected(null); }}
            onPaneClick={() => { setSelected(null); setSelectedEdgeId(null); }}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: '#687a98', strokeWidth: 1.6 }, labelStyle: { fill: '#aebbd0', fontSize: 10 }, labelBgStyle: { fill: '#111b2c' } }}
          >
            <Background color="#314158" gap={22} />
            <MiniMap nodeColor={n => n.data.kind === 'core' ? '#7c8df5' : n.data.status === 'VERIFIED' ? '#5cb99b' : n.data.status === 'BLOCKED' ? '#b38bd0' : n.data.status === 'FAILED' ? '#e16e6e' : '#e7a34d'} maskColor="rgba(8,14,25,.75)" />
            <Controls />
          </ReactFlow>
        </div>
        <div className="canvas-footer">
          <span>{selectedDomainLabel}: نمایش {visibleNodes.length} گره و {visibleEdges.length} ارتباط داخلی از گراف اصلی.</span>
          <span><ShieldAlert size={14} /> وجود نود یا اتصال به‌تنهایی سلامت عملیاتی را ثابت نمی‌کند.</span>
          <span>اتصال زنده و نوشتن در حافظه از این رابط فعال نیست.</span>
        </div>
      </div>

      <aside className="details-panel">
        <div className="panel-heading"><div><span className="eyebrow">INSPECTOR</span><h3>{chosenEdge ? 'جزئیات ارتباط' : 'جزئیات گره'}</h3></div></div>
        {chosen ? <div className="detail-content">
          <div className="detail-symbol"><Workflow size={24} /></div>
          <h4>{chosen.data.label}</h4>
          <span className={'status-pill ' + (statusClass[chosen.data.status] || 'unknown')}>{statusText[chosen.data.status] || chosen.data.status}</span>
          <p>{chosen.data.detail || 'توضیحات تکمیلی در دسترس نیست.'}</p>
          {chosen.data.capabilities?.length > 0 && <div className="detail-section"><strong>قابلیت‌های ثبت‌شده</strong><ul>{(Array.isArray(chosen.data.capabilities) ? chosen.data.capabilities : [chosen.data.capabilities]).map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
          {detailRows.map(([label, value]) => <div className="detail-row detail-row-stacked" key={label}><span>{label}</span><p>{value}</p></div>)}
          <div className="notice"><ShieldAlert size={16} /><span>وضعیت فقط همان ادعای ثبت‌شده را پوشش می‌دهد؛ شواهد تاریخی، آزمون جاری محسوب نمی‌شود.</span></div>
        </div> : chosenEdge ? <div className="detail-content">
          <div className="detail-symbol"><GitBranch size={24} /></div>
          <h4>{chosenEdge.label || chosenEdge.relation || 'ارتباط بدون عنوان'}</h4>
          <span className={'status-pill ' + (statusClass[chosenEdge.status] || 'unknown')}>{statusText[chosenEdge.status] || chosenEdge.status || 'وضعیت نامعلوم'}</span>
          <p>جزئیات همین ارتباط؛ وجود یال به‌تنهایی اجرای زنده یا مجوز دسترسی را اثبات نمی‌کند.</p>
          {[
            ['شناسه پایدار', chosenEdge.id],
            ['مبدأ', chosenEdge.source],
            ['مقصد', chosenEdge.target],
            ['رابطه', chosenEdge.relation || chosenEdge.label],
            ['وضعیت', chosenEdge.status || 'MISSING'],
            ['مجوز', chosenEdge.permission || 'ثبت نشده'],
            ['شواهد', chosenEdge.evidence || 'ثبت نشده']
          ].map(([label, value]) => <div className="detail-row detail-row-stacked" key={label}><span>{label}</span><p>{value}</p></div>)}
          <div className="notice"><ShieldAlert size={16} /><span>وضعیت ارتباط مستقل است؛ «آزمایش‌نشده» به معنی سالم یا خراب بودن نیست.</span></div>
        </div> : <div className="empty-detail">
          <div className="detail-symbol"><Workflow size={24} /></div>
          <strong>یک گره را انتخاب کن</strong>
          <p>شناسه، نقش، مجوزها، شواهد و اقدام بعدی مؤلفه در این پنل نمایش داده می‌شود.</p>
        </div>}
        <div className="legend">
          <strong>راهنمای وضعیت</strong>
          {Object.entries(statusText).filter(([key]) => ['VERIFIED', 'FAILED', 'BLOCKED', 'NOT TESTED', 'PLANNED'].includes(key)).map(([key, value]) =>
            <div className="legend-row" key={key}><span className={'legend-dot ' + statusClass[key]} /><span>{value}</span><code>{key}</code></div>
          )}
        </div>
      </aside>
    </section>

    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    <footer className="app-footer"><span>SIMOT Visual Control Plane · Prototype 0.1.0</span><span>گراف نسخه‌دار؛ اتصال runtime هنوز جداگانه تأیید می‌شود.</span></footer>
  </main>;
}

export default function App() {
  return <ReactFlowProvider><Workspace /></ReactFlowProvider>;
}
