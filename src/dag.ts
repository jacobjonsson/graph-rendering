import { RawNode, Edge, Node, DAG } from "./types";

/**
 * Deserialize the list of raw nodes into a DAG.
 * @param rootId
 * @param rawNodes
 * @returns
 */
export function deserialize(
  rootId: string,
  rawNodes: Record<string, RawNode>
): DAG {
  const nodes: Map<string, Node> = new Map();
  const edges: Edge[] = [];

  function addNode(node: Node) {
    if (nodes.has(node.id)) {
      return;
    }
    nodes.set(node.id, node);
  }

  function addEdge(source: string, target: string) {
    edges.push({
      id: `e${source}-${target}`,
      source,
      target,
    });
  }

  /**
   * Recursively traverse the raw nodes and build the nodes and edges.
   * @param node
   * @param parentId
   */
  function traverse(rawNode: RawNode, parentId?: string) {
    const node: Node = {
      id: rawNode.id,
      operator: rawNode.operator,
      parameter: rawNode.parameter,
      value: rawNode.value,
    };
    addNode(node);

    if (parentId) {
      addEdge(parentId, node.id);
    }

    rawNode.children.forEach((childId) => {
      const child = rawNodes[childId];
      traverse(child, node.id);
    });
  }

  traverse(rawNodes[rootId], undefined);

  return { root: rootId, nodes, edges };
}

export type DAGEvent =
  | { type: "ADD_NODE"; node: Node }
  | { type: "REMOVE_NODE"; id: string }
  | { type: "ADD_EDGE"; source: string; target: string }
  | { type: "REMOVE_EDGE"; id: string };

export function updateDAG(dag: DAG, event: DAGEvent): DAG {
  if (event.type === "ADD_NODE") {
    dag.nodes.set(event.node.id, event.node);
    return dag;
  }

  if (event.type === "REMOVE_NODE") {
    return dag;
  }

  if (event.type === "ADD_EDGE") {
    dag.edges.push({
      id: `e${event.source}-${event.target}`,
      source: event.source,
      target: event.target,
    });
    return dag;
  }

  if (event.type === "REMOVE_EDGE") {
    dag.edges = dag.edges.filter((edge) => edge.id !== event.id);
    return dag;
  }

  return dag;
}

export function serialize(dag: DAG): {
  root_id: string;
  filter: Record<string, RawNode>;
} {
  const rawNodes: Record<string, RawNode> = {};

  for (const edge of dag.edges) {
    const source = dag.nodes.get(edge.source)!;
    const target = dag.nodes.get(edge.target)!;

    if (rawNodes[source.id] === undefined) {
      rawNodes[source.id] = {
        id: source.id,
        operator: source.operator,
        parameter: source.parameter,
        value: source.value,
        children: [],
      };
    }

    if (rawNodes[target.id] === undefined) {
      rawNodes[target.id] = {
        id: target.id,
        operator: target.operator,
        parameter: target.parameter,
        value: target.value,
        children: [],
      };
    }

    rawNodes[source.id].children.push(edge.target);
  }

  return { root_id: dag.root, filter: rawNodes };
}
