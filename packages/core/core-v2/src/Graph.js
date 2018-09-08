// @flow
'use strict';

export type NodeId = string;

export type Edge = {
  from: NodeId,
  to: NodeId,
};

export interface Node {
  id: string;
  value: any;
}

type GraphUpdates = {
  added: Graph<Node>,
  removed: Graph<Node>,
}

export default class Graph<Node: Node> {
  nodes: Map<NodeId, Node>;
  edges: Set<Edge>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Set();
  }

  addNode(node: Node) {
    this.nodes.set(node.id, node);
    return node;
  }

  addEdge(edge: Edge) {
    this.edges.add(edge);
    return edge;
  }

  hasEdge(edge: Edge) {
    for (let e of this.edges) {
      if (edge.from == e.from && edge.to === e.to) {
        return true;
      }
    }

    return false;
  }

  // ? can using any be avoided here?
  merge(graph: Graph<any>) {
    for (let [id, node] of graph.nodes) {
      this.addNode(node);
    }

    for (let edge of graph.edges) {
      this.addEdge(edge);
    }
  }

  removeNode(node: Node): Graph<Node> {
    let removed = new Graph();

    this.nodes.delete(node.id);
    removed.addNode(node);

    for (let edge of this.edges) {
      if (edge.from === node.id) {
        removed.merge(this.removeEdge(edge));
      }
    }

    return removed;
  }

  removeEdge(edge: Edge): Graph<Node> {
    let removed = new Graph();

    this.edges.delete(edge);
    removed.addEdge(edge);

    for (let [id, node] of this.nodes) {
      if (edge.to === id) {
        if (this.isOrphanedNode(node)) {
          removed.merge(this.removeNode(node));
        }
      }
    }

    return removed;
  }

  isOrphanedNode(node: Node) {
    for (let edge of this.edges) {
      if (edge.to === node.id) {
        return false;
      }
    }
    return true;
  }

  updateDownStreamNodes(fromNode: Node, toNodes: Array<Node>): GraphUpdates {
    let removed = new Graph();
    let added = new Graph();

    let edgesBefore = Array.from(this.edges).filter(edge => edge.from === fromNode.id);
    let edgesToRemove = edgesBefore;

    for (let toNode of toNodes) {
      if (!this.nodes.has(toNode.id)) {
        this.addNode(toNode);
        added.addNode(toNode);
      }

      edgesToRemove = edgesToRemove.filter(edge => edge.to !== toNode.id);

      let edge = edgesBefore.find(edge => edge.to === toNode.id);
      if (!edge) {
        edge = {from: fromNode.id, to: toNode.id};
        this.addEdge(edge);
        added.addEdge(edge);
      }
    }

    for (let edge of edgesToRemove) {
      removed.merge(this.removeEdge(edge));
    }

    return { removed, added };
  }
}
