import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, useNodesState, useEdgesState, Node, Edge, ConnectionLineType } from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { DawayirState } from '@/hooks/useDawayirEngine';

const NODE_TYPES = Object.freeze({ dawayirNode: CustomNode });
const EDGE_TYPES = Object.freeze({});

interface NodeData {
    id: string;
    label: string;
    size: 'small' | 'medium' | 'large';
    color: 'core' | 'danger' | 'neutral' | 'ignored';
    mass: number;
}

interface CanvasComponentProps {
    data: DawayirState;
    onNodeClick?: (nodeData: NodeData) => void;
    pendingNodeUpdate?: { id: string; updates: Partial<NodeData> } | null;
}

export default function CanvasComponent({ data, onNodeClick, pendingNodeUpdate }: CanvasComponentProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isPhysicsActive, setIsPhysicsActive] = useState(true);
    const nodeTypes = useMemo(() => NODE_TYPES, []);
    const edgeTypes = useMemo(() => EDGE_TYPES, []);

    // Initialize nodes and edges from AI data
    useEffect(() => {
        const initialNodes: Node[] = data.nodes.map((node, index) => {
            const radius = 150;
            const angle = (index / (data.nodes.length || 1)) * 2 * Math.PI;
            const isCore = node.color === 'core';

            return {
                id: node.id,
                type: 'dawayirNode',
                position: isCore
                    ? { x: 350, y: 300 }
                    : {
                        x: 350 + radius * Math.cos(angle) + (Math.random() * 50 - 25),
                        y: 300 + radius * Math.sin(angle) + (Math.random() * 50 - 25)
                    },
                data: {
                    id: node.id,
                    label: node.label,
                    size: node.size,
                    color: node.color,
                    mass: node.mass
                },
                dragHandle: '.custom-drag-handle',
            };
        });

        const initialEdges: Edge[] = data.edges.map((edge) => ({
            id: `e-${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            animated: edge.animated || edge.type === 'draining',
            style: {
                stroke: edge.type === 'draining' ? '#f43f5e' : '#2dd4bf', // Rose-500 or Teal-400
                strokeWidth: edge.type === 'draining' ? 4 : 2,
                opacity: edge.type === 'ignored' ? 0.2 : 0.6,
                filter: edge.type === 'draining' ? 'drop-shadow(0 0 8px rgba(244,63,94,0.4))' : 'none'
            },
        }));

        setNodes(initialNodes);
        setEdges(initialEdges);

        // Stop physics after a short while so user can drag freely
        const timer = setTimeout(() => setIsPhysicsActive(false), 2000);
        return () => clearTimeout(timer);
    }, [data, setNodes, setEdges]);

    // Simple Spring Physics Hook
    useEffect(() => {
        if (!isPhysicsActive || nodes.length === 0) return;

        let animationFrameId: number;

        const applyPhysics = () => {
            setNodes((currentNodes: Node[]) => {
                const newNodes = [...currentNodes];
                const forces: Record<string, { x: number; y: number }> = {};

                // Initialize forces
                newNodes.forEach(n => forces[n.id] = { x: 0, y: 0 });

                // Calculate Repulsion forces
                const maxRepulsionDistance = 320;
                const maxRepulsionDistanceSq = maxRepulsionDistance * maxRepulsionDistance;
                for (let i = 0; i < newNodes.length; i++) {
                    for (let j = i + 1; j < newNodes.length; j++) {
                        const nodeA = newNodes[i];
                        const nodeB = newNodes[j];

                        // Don't move the core node
                        const isCoreA = nodeA.data.color === 'core';
                        const isCoreB = nodeB.data.color === 'core';

                        const dx = nodeB.position.x - nodeA.position.x;
                        const dy = nodeB.position.y - nodeA.position.y;
                        const distanceSq = dx * dx + dy * dy;
                        // Spatial culling: skip expensive force math for very distant pairs.
                        if (distanceSq > maxRepulsionDistanceSq) continue;
                        const distance = Math.sqrt(distanceSq) || 0.1;

                        const massA = nodeA.data.mass || 1;
                        const massB = nodeB.data.mass || 1;

                        // Minimum distance before serious repulsion kicks in. Depends on size.
                        const getRadius = (size: string) => size === 'large' ? 60 : size === 'medium' ? 40 : 25;
                        const minDistance = getRadius(nodeA.data.size) + getRadius(nodeB.data.size) + 20;

                        if (distance < minDistance) {
                            // High mass = stronger push. If danger (red), push harder.
                            const dangerMultiplier = (nodeA.data.color === 'danger' || nodeB.data.color === 'danger') ? 2.5 : 1;
                            const forceMag = ((minDistance - distance) / distance) * 0.2 * dangerMultiplier;

                            const fx = dx * forceMag;
                            const fy = dy * forceMag;

                            // Apply force inversely proportional to mass
                            if (!isCoreA) {
                                forces[nodeA.id].x -= fx / massA;
                                forces[nodeA.id].y -= fy / massA;
                            }
                            if (!isCoreB) {
                                forces[nodeB.id].x += fx / massB;
                                forces[nodeB.id].y += fy / massB;
                            }
                        }
                    }
                }

                // Apply forces to positions with damping
                let moved = false;
                const updatedNodes = newNodes.map(node => {
                    const fx = forces[node.id].x;
                    const fy = forces[node.id].y;

                    if (Math.abs(fx) > 0.5 || Math.abs(fy) > 0.5) moved = true;

                    return {
                        ...node,
                        position: {
                            x: node.position.x + fx * 0.5, // Damping factor
                            y: node.position.y + fy * 0.5
                        }
                    };
                });

                if (moved) {
                    animationFrameId = requestAnimationFrame(applyPhysics);
                }

                return moved ? updatedNodes : currentNodes;
            });
        };

        animationFrameId = requestAnimationFrame(applyPhysics);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isPhysicsActive, nodes.length, setNodes]);

    // Handle dynamic realignment from AI
    useEffect(() => {
        if (pendingNodeUpdate) {
            setNodes((currentNodes: Node[]) =>
                currentNodes.map((n: Node) =>
                    n.id === pendingNodeUpdate.id
                        ? { ...n, data: { ...n.data, ...pendingNodeUpdate.updates } }
                        : n
                )
            );
            // Briefly wake up physics to re-adjust
            setIsPhysicsActive(true);
            setTimeout(() => setIsPhysicsActive(false), 1500);
        }
    }, [pendingNodeUpdate, setNodes, setIsPhysicsActive]);

    // Handle Node Drag - wake up physics briefly for collision detection
    const onNodeDragStart = useCallback(() => {
        setIsPhysicsActive(false); // Stop auto physics while dragging
    }, [setIsPhysicsActive]);

    const onNodeDragStop = useCallback(() => {
        setIsPhysicsActive(true);
        // Turn off after settling
        setTimeout(() => setIsPhysicsActive(false), 1000);
    }, [setIsPhysicsActive]);


    return (
        <div className="w-full h-full bg-slate-900 overflow-hidden relative group">
            {/* Tactical Overlays */}
            <div className="tactical-crt-overlay" />
            <div className="radar-sweep" />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStart={onNodeDragStart}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodeClick={(event: React.MouseEvent, node: Node) => onNodeClick && onNodeClick(node.data as NodeData)}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                attributionPosition="bottom-right"
                minZoom={0.5}
                maxZoom={1.5}
            >
                <Background color="#111827" gap={40} size={1} variant={BackgroundVariant.Dots} />
                <Controls showInteractive={false} className="glass border-white/10 shadow-xl !bg-slate-900/50" />
            </ReactFlow>
        </div>
    );
}
