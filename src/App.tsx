import { deserialize, isRoot, serialize } from "./dag";
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
import "react-flow-renderer/dist/style.css";
import "react-flow-renderer/dist/theme-default.css";
import "./react_flow.css";
import { Node, Edge, NodeData } from "./types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { nanoid } from "nanoid";

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
      {!data.root && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ borderRadius: 0 }}
        />
      )}
      <div className="w-full flex justify-center items-center">
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
    // It's not allowed to remove the root node
    if (elementsToRemove.some((element) => isRoot(element))) {
      return;
    }
    setElements((elements) => removeElements(elementsToRemove, elements));
  }

  function handleConnect(connection: Edge | Connection) {
    setElements((elements) =>
      addEdge({ ...connection, animated: true }, elements)
    );
  }

  function handleSubmit() {
    const filterData = serialize({ elements, root: elements.find(isRoot)!.id });

    fetch("/api/filters", {
      method: "POST",
      body: JSON.stringify(filterData),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        setElements(
          getLayoutedElements(deserialize(data.root_id, data.filter).elements)
        );
      });
  }

  return (
    <div className="bg-gray-50 px-4 mt-2">
      <div className="border border-solid border-gray-300 bg-white mx-auto mb-4">
        <div
          style={{ height: "500px", width: "100vw" }}
          className="mx-auto bg-gray-50 border-b border-solid border-gray-300"
        >
          <ReactFlowProvider>
            <ReactFlow
              snapToGrid={true}
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

        <div className="p-4">
          <button
            type="button"
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4`}
            onClick={handleSubmit}
          >
            Save
          </button>

          <button
            type="button"
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset
          </button>
        </div>
      </div>

      <div>
        <ConditionForm
          key={selected?.id}
          initialData={selected?.data}
          onSubmit={(data) => {
            if (selected) {
              setElements((elements) => {
                return elements.map((element) => {
                  if (!isNode(element)) {
                    return element;
                  }

                  if (element.id !== selected.id) {
                    return element;
                  }

                  return { ...element, data } as Node;
                });
              });
            } else {
              setElements((elements) => {
                return [
                  ...elements,
                  {
                    id: nanoid(),
                    data,
                    position: { x: 300, y: 300 },
                    type: "idle",
                  } as Node,
                ];
              });
            }
          }}
        />
      </div>
    </div>
  );
}

interface ConditionData {
  parameter: string;
  operator: string;
  value: string;
}

interface ConditionFormProps {
  initialData?: ConditionData;
  onSubmit: (data: ConditionData) => void;
}

function ConditionForm(props: ConditionFormProps) {
  const { handleSubmit, register } = useForm<ConditionData>();

  return (
    <form
      onSubmit={handleSubmit(props.onSubmit)}
      className="bg-white border border-solid border-gray-300 p-4"
    >
      <div className="grid grid-cols-3 gap-4 px-4 mb-4">
        <div>
          <label className="mb-1" htmlFor="operator">
            Parameter
          </label>
          <select
            {...register("parameter", { value: props.initialData?.parameter })}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="accommodation.size">Accommodation size</option>
            <option value="main.applicant.age">Main: Applicant age</option>
            <option value="main.applicant.income">
              Main: Applicant income
            </option>
            <option value="co.applicant.age">Co: Applicant age</option>
            <option value="co.applicant.income">Co: Applicant income</option>
            <option value="applied_loan_amount">Applied loan amount</option>
          </select>
        </div>

        <div>
          <label className="mb-1" htmlFor="operator">
            Operator
          </label>
          <select
            {...register("operator", { value: props.initialData?.operator })}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="<">Less than</option>
            <option value="=">Equal</option>
            <option value=">">Greater than</option>
          </select>
        </div>

        <div>
          <label className="mb-1" htmlFor="operator">
            Value
          </label>
          <input
            {...register("value", { value: props.initialData?.value })}
            type="text"
            placeholder="Enter value..."
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="px-4">
        <button
          type="submit"
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4`}
        >
          {props.initialData ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
