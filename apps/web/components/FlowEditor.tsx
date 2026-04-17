"use client";
import React, { useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

// This function calculates where each node should sit
const getLayoutedElements = (nodes: any, edges: any) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR' }); // Left to Right layout
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node: any) => g.setNode(node.id, { width: 150, height: 50 }));
  edges.forEach((edge: any) => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  return nodes.map((node: any) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
    };
  });
};

export default function FlowEditor({ data, isLoading }: { data: any, isLoading: boolean }) {
  // Convert our simple JSON into React Flow format
  const initialNodes = (data?.nodes ?? []).map((n: any) => ({
  id: n.id,
  data: { label: n.label },
  position: { x: 0, y: 0 },
}));

const initialEdges = (data?.edges ?? []).map((e: any) => ({
  id: e.id,
  source: e.source,
  target: e.target,
  label: e.relation,
  animated: true,
}));

  const layoutedNodes = getLayoutedElements(initialNodes, initialEdges);
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[600px] w-full border rounded-xl bg-white shadow-inner">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}