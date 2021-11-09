import { ArrowHeadType } from "react-flow-renderer";
import { RawNode, Edge, Node, DAG, NodeData, EdgeData } from "./types";

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

// export function serialize(dag: DAG): {
//   root_id: string;
//   filter: Record<string, RawNode>;
// } {
//   const rawNodes: Record<string, RawNode> = {};

//   for (const edge of dag.edges) {
//     const source = dag.nodes.get(edge.source)!;
//     const target = dag.nodes.get(edge.target)!;

//     if (rawNodes[source.id] === undefined) {
//       rawNodes[source.id] = {
//         id: source.id,
//         operator: source.operator,
//         parameter: source.parameter,
//         value: source.value,
//         children: [],
//       };
//     }

//     if (rawNodes[target.id] === undefined) {
//       rawNodes[target.id] = {
//         id: target.id,
//         operator: target.operator,
//         parameter: target.parameter,
//         value: target.value,
//         children: [],
//       };
//     }

//     rawNodes[source.id].children.push(edge.target);
//   }

//   return { root_id: dag.root, filter: rawNodes };
// }
