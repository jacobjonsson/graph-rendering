import { isEdge, isNode } from "react-flow-renderer";
import { RawNode, Edge, Node, DAG, NodeData } from "./types";

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
  const elements: Map<string, Node | Edge> = new Map();

  function addNode(
    id: string,
    data: NodeData,
    type: "idle" | "successful" | "failed"
  ) {
    elements.set(id, {
      id,
      position: { x: 0, y: 0 },
      data,
      type,
    });
  }

  function addEdge(
    source: string,
    target: string,
    type: "idle" | "successful" | "failed"
  ) {
    const id = `e${source}-${target}`;
    elements.set(id, {
      source,
      target,
      id,
      animated: true,
      type,
    });
  }

  /**
   * Recursively traverse the raw nodes and build the nodes and edges.
   * @param node
   * @param parentId
   */
  function traverse(rawNode: RawNode, parentId?: string) {
    addNode(
      rawNode.id,
      {
        operator: rawNode.operator,
        parameter: rawNode.parameter,
        value: rawNode.value,
        root: rawNode.id === rootId,
      },
      rawNode.status
    );

    if (parentId) {
      addEdge(parentId, rawNode.id, rawNode.status);
    }

    rawNode.children.forEach((childId) => {
      const child = rawNodes[childId];
      traverse(child, rawNode.id);
    });
  }

  traverse(rawNodes[rootId], undefined);

  return { root: rootId, elements: Array.from(elements.values()) };
}

export function isRoot(element: Node | Edge) {
  if (isNode(element)) {
    return element.data?.root;
  } else {
    return false;
  }
}

export function serialize(dag: DAG): {
  root_id: string;
  filter: Record<string, RawNode>;
} {
  const filter: Record<string, RawNode> = {};

  function traverse(node: Node) {
    // We have already traversed this node.
    if (filter[node.id]) {
      return;
    }

    filter[node.id] = {
      id: node.id,
      operator: node.data!.operator,
      parameter: node.data!.parameter,
      value: node.data!.value,
      children: [],
      status: "idle", // TODO: Shouldn't be here.
    };

    const children = dag.elements
      .filter((element) => isEdge(element) && element.source === node.id)
      // Typescript is not smart enough to infer that this is a Edge.
      // It cannot be a node because it is filtered above using `isEdge(element)`.
      .map((edge) => (edge as Edge).target);

    filter[node.id].children = children;

    children.forEach((childId) =>
      traverse(dag.elements.find((element) => element.id === childId) as Node)
    );
  }

  const root = dag.elements.find((element) => element.id === dag.root)!;
  // An edge can't be a root.
  traverse(root as Node);

  return { root_id: dag.root, filter };
}
