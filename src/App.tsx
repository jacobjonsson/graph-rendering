import { filterData } from "./filter_data";
import { deserialize, serialize, updateDAG } from "./dag";
import isEqual from "lodash.isequal";
import dagre from "dagre";
import ReactFlow, {
  Position,
  ReactFlowProvider,
  Elements,
  isNode,
} from "react-flow-renderer";
import { DAG } from "./types";
import { useState } from "react";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

function getLayoutedElements(dag: DAG, direction = "TB") {
  console.log(dag);

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  for (const node of dag.nodes.values()) {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }

  for (const edge of dag.edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  const elements: any[] = [];

  for (const node of dag.nodes.values()) {
    const nodeWithPosition = dagreGraph.node(node.id);
    elements.push({
      id: node.id,
      data: { label: node.parameter },
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    });
  }

  for (const edge of dag.edges) {
    elements.push(edge);
  }

  return elements;
}

export function App() {
  const [direction, setDirection] = useState<"TB" | "LR">("TB");
  const [dag, setDAG] = useState<DAG>(() =>
    deserialize(filterData.root_id, filterData.filter)
  );

  function handleRemoveElement(elements: Elements) {
    let _dag = { ...dag };
    for (const element of elements) {
      if (isNode(element)) {
        _dag = updateDAG(dag, { type: "REMOVE_NODE", id: element.id });
      } else {
        _dag = updateDAG(dag, { type: "REMOVE_EDGE", id: element.id });
      }
    }

    console.log(_dag === dag);

    setDAG(_dag);
  }

  const elements = getLayoutedElements(dag, direction);

  return (
    <div style={{ height: "100vh", width: "100vw" }} className="flex">
      <ReactFlowProvider>
        <ReactFlow onElementsRemove={handleRemoveElement} elements={elements} />
        <div className="controls">
          <button onClick={() => setDirection("TB")}>vertical layout</button>
          <button onClick={() => setDirection("LR")}>horizontal layout</button>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
