"use client";

import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

// Playful but clean node design
const CustomNode = ({ data }: { data: any }) => (
  <div className="px-5 py-4 rounded-3xl bg-[#1A1C23]/90 backdrop-blur-xl border border-white/10 text-slate-100 min-w-[220px] max-w-[280px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] hover:-translate-y-1 transition-all duration-300">
    <Handle type="target" position={Position.Top} className="w-2 h-2 bg-indigo-400 border-none opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="font-bold text-[15px] mb-1.5 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-violet-200">{data.label}</div>
    {data.summary && <div className="text-xs text-slate-400/90 leading-relaxed line-clamp-2">{data.summary}</div>}
    <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-violet-400 border-none opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

const nodeTypes = { custom: CustomNode };
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });
  nodes.forEach((node) => { dagreGraph.setNode(node.id, { width: 250, height: 100 }); });
  edges.forEach((edge) => { dagreGraph.setEdge(edge.source, edge.target); });
  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = 'top';
    node.sourcePosition = 'bottom';
    node.position = { x: nodeWithPosition.x - 125, y: nodeWithPosition.y - 50 };
    return node;
  });
  return { nodes, edges };
};

export default function FlowCanvas({ data, onNodeSelect, onPaneClick }: any) {
  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    if (!data?.nodes || !data?.edges) return { layoutedNodes: [], layoutedEdges: [] };

    const initialNodes = data.nodes.map((n: any) => ({
      id: n.id, type: 'custom', data: { label: n.label, summary: n.summary, rawNodeData: n },
    }));

    const initialEdges = data.edges.map((e: any, i: number) => ({
      id: `e-${i}`, source: e.source, target: e.target, label: e.relation,
      type: 'default', // Smooth, sweeping bezier curves (flowy!)
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.6 },
      labelStyle: { fill: '#cbd5e1', fontWeight: 500, fontSize: 11 },
      labelBgStyle: { fill: '#1A1C23', fillOpacity: 0.9, rx: 10, ry: 10 },
      labelBgPadding: [8, 4],
    }));

    const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges, 'TB');
    return { layoutedNodes: nodes, layoutedEdges: edges };
  }, [data]);

  return (
    <div className="w-full h-full animate-in fade-in duration-1000">
      <ReactFlow 
        nodes={layoutedNodes} edges={layoutedEdges} nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.2 }}
        onNodeClick={(_, node) => { if (onNodeSelect) onNodeSelect(node.data.rawNodeData); }}
        onPaneClick={() => { if (onPaneClick) onPaneClick(); }}
        className="bg-transparent"
      >
        {/* Soft, friendly dot pattern */}
        <Background color="#cbd5e1" gap={25} size={1.5} opacity={0.1} />
        <Controls className="bg-[#1A1C23] border border-white/5 rounded-xl shadow-lg" buttonClassName="!bg-transparent !border-b !border-white/5 hover:!bg-white/5 !fill-slate-400" />
      </ReactFlow>
    </div>
  );
}