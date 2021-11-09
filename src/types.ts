import { Node as FlowNode, Edge as FlowEdge } from "react-flow-renderer";

export interface NodeData {
  operator: string;
  parameter: string;
  value: string;
}

export interface EdgeData {}

export type Node = FlowNode<NodeData>;
export type Edge = FlowEdge<EdgeData>;

/**
 * RawNode represents a node from the backend.
 */
export interface RawNode {
  id: string;
  operator: string;
  parameter: string;
  value: string;
  children: string[];
  status: "idle" | "successful" | "failed";
}

export interface DAG {
  root: string;
  elements: Array<Node | Edge>;
}
