import { filterData } from "./filter_data";
import { deserialize } from "./dag";
import dagre from "dagre";
import ReactFlow, {
  Position,
  ReactFlowProvider,
  isNode,
  removeElements,
  Connection,
  addEdge,
  Handle,
} from "react-flow-renderer/nocss";
import { TrashIcon } from "@heroicons/react/outline";
import "react-flow-renderer/dist/style.css";
import "react-flow-renderer/dist/theme-default.css";
import "./react_flow.css";
import { Node, Edge, NodeData } from "./types";
import { useCallback, useEffect, useState } from "react";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 400;
const nodeHeight = 200;

function getLayoutedElements(
  elements: Array<Node | Edge>,
  direction = "TB"
): Array<Edge | Node> {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    ranker: "tight-tree",
  });

  elements.forEach((element) => {
    if (isNode(element)) {
      dagreGraph.setNode(element.id, { width: nodeWidth, height: nodeHeight });
    } else {
      dagreGraph.setEdge(element.source, element.target);
    }
  });

  dagre.layout(dagreGraph);

  return elements.map((element) => {
    if (isNode(element)) {
      const nodeWithPosition = dagreGraph.node(element.id);
      element.targetPosition = isHorizontal ? Position.Left : Position.Top;
      element.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

      // unfortunately we need this little hack to pass a slightly different position
      // to notify react flow about the change. Moreover we are shifting the dagre node position
      // (anchor=center center) to the top left so it matches the react flow node anchor point (top left).
      element.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
    }

    return element;
  });
}

function CustomNodeComponent({ data, ...rest }: { data: NodeData }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ borderRadius: 0 }}
      />
      <div className="w-full flex justify-between items-center">
        <div className="flex">
          <span className="block p-2 rounded border border-solid border-gray-300 mr-2 uppercase">
            {data.parameter}
          </span>
          <span className="block p-2 rounded border border-solid border-gray-300 mr-2 uppercase">
            {data.operator}
          </span>
          <span className="block p-2 rounded border border-solid border-gray-300 uppercase">
            {data.value}
          </span>
        </div>

        <button>
          <TrashIcon className="h-6 w-6 cursor-pointer" />
        </button>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={{ borderRadius: 0 }}
      />
    </>
  );
}

export function App() {
  const [elements, setElements] = useState<(Node | Edge)[]>([]);
  const [selected, setSelected] = useState<Node | undefined>(undefined);

  useEffect(() => {
    fetch("/api/filters")
      .then((res) => res.json())
      .then((data) => {
        setElements(
          getLayoutedElements(deserialize(data.root_id, data.filter).elements)
        );
      })
      .catch((error) => console.log(error));
  }, []);

  function handleElementsRemove(elementsToRemove: Array<Edge | Node>) {
    setElements((elements) => removeElements(elementsToRemove, elements));
  }

  function handleConnect(connection: Edge | Connection) {
    setElements((elements) => addEdge(connection, elements));
  }

  return (
    <>
      <div
        style={{ height: "600px", width: "100vw" }}
        className="flex border border-solid border-gray-300 bg-gray-50 mx-auto mb-4"
      >
        <ReactFlowProvider>
          <ReactFlow
            minZoom={0.1}
            defaultZoom={0.5}
            onConnect={handleConnect}
            onElementsRemove={handleElementsRemove}
            elements={elements}
            onSelectionChange={(elements) => {
              if (!elements || elements.length === 0) {
                setSelected(undefined);
              } else {
                setSelected(elements![0] as Node);
              }
            }}
            nodeTypes={{
              idle: CustomNodeComponent,
              successful: CustomNodeComponent,
              failed: CustomNodeComponent,
            }}
          />
        </ReactFlowProvider>
      </div>

      <div>
        <form onClick={(evt) => evt.preventDefault()}>
          <div className="grid grid-cols-3 gap-4 px-4 mb-4">
            <div>
              <label className="mb-1" htmlFor="operator">
                Parameter
              </label>
              <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option>Offered amount</option>
                <option>Amortize length</option>
                <option>Applied loan amount</option>
              </select>
            </div>

            <div>
              <label className="mb-1" htmlFor="operator">
                Operator
              </label>
              <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option>Less than</option>
                <option>Equal</option>
                <option>Greater than</option>
              </select>
            </div>

            <div>
              <label className="mb-1" htmlFor="operator">
                Value
              </label>
              <input
                type="text"
                placeholder="Enter value..."
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="px-4">
            <button
              disabled={selected === undefined}
              type="button"
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-4 ${
                selected == undefined ? "opacity-75" : ""
              }`}
            >
              Add AND
            </button>

            <button
              disabled={selected === undefined}
              type="button"
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                selected == undefined ? "opacity-75" : ""
              }`}
            >
              Add OR
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
