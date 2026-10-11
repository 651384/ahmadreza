import { useCallback, useMemo, useState } from 'react';
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, Handle, Position, MarkerType, addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import { Download, GitBranch, RefreshCw, ShieldAlert, Workflow } from 'lucide-react';
import initialGraph from './graph-v1.json';

const statusText = { VERIFIED: 'تأییدشده', CONFIG_ONLY: 'فقط تنظیمات', NOT_VERIFIED: 'تأییدنشده', NOT_CONNECTED: 'متصل نیست' };
const statusClass = { VERIFIED: 'verified', CONFIG_ONLY: 'config', NOT_VERIFIED: 'unknown', NOT_CONNECTED: 'offline' };
function SimotNode({ data, selected }) {
  return <div className={'node-card ' + data.kind + (selected ? ' selected' : '')}>
    <Handle type="target" position={Position.Top} />
    <div className="node-head"><span className="node-dot"/><span>{data.label}</span></div>
    <span className={'status-pill ' + (statusClass[data.status] || 'unknown')}>{statusText[data.status] || data.status}</span>
    <Handle type="source" position={Position.Bottom}/>
  </div>;
}
const nodeTypes = { simotNode: SimotNode };
function Workspace() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges.map(e => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } })));
  const [selected, setSelected] = useState(null);
  const [revision, setRevision] = useState(1);
  const [notice, setNotice] = useState('');
  const onConnect = useCallback(params => setEdges(es => addEdge({ ...params, label: 'ارتباط آزمایشی', markerEnd: { type: MarkerType.ArrowClosed } }, es)), [setEdges]);
  const chosen = nodes.find(n => n.id === selected);
  const graph = useMemo(() => ({ schema: 'simot.visual-control-plane.graph', schemaVersion: 1, graphId: 'simot-core-overview', revision, updatedAt: new Date().toISOString(), nodes, edges: edges.map(({ markerEnd, ...e }) => e) }), [nodes, edges, revision]);
  function exportGraph() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'simot-graph-v1-r' + revision + '.json'; a.click(); URL.revokeObjectURL(url);
    setRevision(r => r + 1); setNotice('خروجی JSON آماده شد؛ برای نسخه‌بندی، آن را در GitHub ثبت کن.');
  }
  function resetGraph() {
    setNodes(initialGraph.nodes); setEdges(initialGraph.edges.map(e => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } })));
    setSelected(null); setRevision(1); setNotice('گراف اولیه بازنشانی شد.');
  }
  return <main className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-icon"><Workflow size={23}/></div><div><div className="eyebrow">SIMOT AI OS</div><h1>کنترل‌پنل بصری</h1></div></div><div className="top-meta"><span className="local-tag"><span/> نمونهٔ اولیه</span><span className="version"><GitBranch size={14}/> Graph v1 · r{revision}</span></div></header>
    <section className="intro"><div><p className="eyebrow">VISUAL CONTROL PLANE</p><h2>نقشهٔ معماری سیموت</h2><p className="subtitle">نمونهٔ اولیه؛ اتصال زنده به سرویس‌ها هنوز برقرار نشده است.</p></div></section>
    <section className="metrics"><div className="metric"><div><small>اجزای گراف</small><strong>{nodes.length}</strong></div></div><div className="metric"><div><small>ارتباط‌ها</small><strong>{edges.length}</strong></div></div><div className="metric"><div><small>وضعیت حافظهٔ VPS</small><strong className="warn-text">تأییدنشده</strong></div></div></section>
    <section className="workspace"><div className="canvas-panel"><div className="canvas-toolbar"><div><strong>گراف معماری</strong><span>گره‌ها را جابه‌جا کن؛ برای اتصال از دستگیرهٔ گره بکش.</span></div><div className="toolbar-actions"><button className="primary" onClick={exportGraph}><Download size={15}/> خروجی نسخهٔ JSON</button><button className="secondary" onClick={resetGraph}><RefreshCw size={15}/> بازنشانی</button></div></div>
      <div className="flow-canvas" dir="ltr"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_, n) => setSelected(n.id)} onPaneClick={() => setSelected(null)} fitView fitViewOptions={{padding:0.18}} defaultEdgeOptions={{type:'smoothstep',style:{stroke:'#687a98',strokeWidth:1.6},labelStyle:{fill:'#aebbd0',fontSize:10},labelBgStyle:{fill:'#111b2c'}}}><Background color="#314158" gap={22}/><MiniMap nodeColor={n => n.data.kind === 'core' ? '#7c8df5' : n.data.status === 'NOT_VERIFIED' ? '#e7a34d' : '#527a9c'} maskColor="rgba(8,14,25,.75)"/><Controls/></ReactFlow></div>
      <div className="canvas-footer"><span><ShieldAlert size={14}/> گراف نمایشی است و سلامت سرویس‌ها را اثبات نمی‌کند.</span><span>ذخیرهٔ پایدار هنوز فعال نیست</span></div></div>
      <aside className="details-panel"><div className="panel-heading"><div><span className="eyebrow">INSPECTOR</span><h3>جزئیات گره</h3></div></div>{chosen ? <div className="detail-content"><div className="detail-symbol"><Workflow size={24}/></div><h4>{chosen.data.label}</h4><span className={'status-pill ' + (statusClass[chosen.data.status] || 'unknown')}>{statusText[chosen.data.status] || chosen.data.status}</span><p>{chosen.data.detail}</p><div className="detail-row"><span>شناسه</span><code>{chosen.id}</code></div><div className="detail-row"><span>نوع</span><code>{chosen.data.kind}</code></div><div className="notice"><ShieldAlert size={16}/><span>این وضعیت از دادهٔ نمونه آمده، نه از بررسی زندهٔ سرویس.</span></div></div> : <div className="empty-detail"><div className="detail-symbol"><Workflow size={24}/></div><strong>یک گره را انتخاب کن</strong><p>برای مشاهدهٔ شناسه و وضعیت ثبت‌شده، روی یکی از اجزا کلیک کن.</p></div>}
      <div className="legend"><strong>راهنمای وضعیت</strong>{Object.entries(statusText).map(([key, value]) => <div className="legend-row" key={key}><span className={'legend-dot ' + statusClass[key]}/><span>{value}</span><code>{key}</code></div>)}</div></aside></section>
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    <footer className="app-footer"><span>SIMOT Visual Control Plane · Prototype 0.1.0</span><span>بدون اتصال VPS یا تغییر Cloudflare</span></footer>
  </main>;
}
export default function App() { return <ReactFlowProvider><Workspace/></ReactFlowProvider>; }
