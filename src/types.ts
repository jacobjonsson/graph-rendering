/**
 * RawNode represents a node from the backend.
 */
export interface RawNode {
  id: string;
  operator: string;
  parameter: string;
  value: string;
  children: string[];
}

export interface DAG {
  root: string;
  nodes: Map<string, Node>;
  edges: Edge[];
}

/**
 * Node represents a node used by the frontend.
 */
export interface Node {
  id: string;
  parameter: string;
  operator: string;
  value: string;
}

/**
 * Edge represents an edge between two nodes
 */
export interface Edge {
  id: string;
  source: string;
  target: string;
}
