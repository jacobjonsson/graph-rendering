export class Edge {
  public readonly from: string;
  public readonly to: string;
  public readonly label: string;

  constructor(from: string, to: string, label: string) {
    this.from = from;
    this.to = to;
    this.label = label;
  }

  public equals(other: Edge): boolean {
    return (
      this.from == other.from &&
      this.to == other.to &&
      this.label == other.label
    );
  }
}

export class Graph {
  private _edges: Edge[] = [];
  private _nodes: string[] = [];

  constructor(edges: Edge[]) {
    this._edges = edges;
    for (let edge of this._edges) {
      this._nodes.push(edge.from);
      this._nodes.push(edge.to);
    }
  }

  get edges(): Edge[] {
    return this._edges;
  }

  get nodes(): string[] {
    return this._nodes;
  }
}

export class LayerAssignment {
  private _graph: Graph;

  constructor(graph: Graph) {
    this._graph = graph;
  }

  public assignLayers(): string[][] {
    const sorted = [];
    let edges = this._graph.edges;
    let nodes = this._graph.nodes;
    let start = LayerAssignment.getNodesWithoutIncomingEdges(edges, nodes);

    while (start.length) {
      sorted.push(start);
      edges = edges.filter((edge) => !start.includes(edge.from));
      nodes = nodes.filter((node) => !start.includes(node));
      start = LayerAssignment.getNodesWithoutIncomingEdges(edges, nodes);
    }

    return sorted;
  }

  static getNodesWithoutIncomingEdges(
    edges: Edge[],
    nodes: string[]
  ): string[] {
    const targets = [...new Set(edges.map((edge) => edge.to))];
    return nodes.filter((node) => !targets.includes(node));
  }
}
