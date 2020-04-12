/* tslint:disable */

import quickselect from 'quickselect';

export type BBoxXOnly = {
  minX: number;
  maxX: number;
};
export type RNodeXOnly<T> = {
  minX: number;
  maxX: number;
  children: RNodeXOnly<T>[];
  leaf?: boolean;
  height: number;

  item: T;
};

export class RBushXOnly<T> {
  private _maxEntries: number;
  private _minEntries: number;
  constructor(maxEntries = 9) {
    // max entries in a node is 9 by default; min node fill is 40% for best performance
    this._maxEntries = Math.max(4, maxEntries);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));
    this.clear();
  }

  data!: RNodeXOnly<T>;

  all() {
    return this._all(this.data, []);
  }

  search(bbox: BBoxXOnly) {
    let node = this.data;
    const result: RNodeXOnly<T>[] = [];

    if (!intersects(bbox, node)) return result;

    const toBBox = this.toBBox;
    const nodesToSearch = [];

    while (node) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childBBox = node.leaf ? toBBox(child) : child;

        if (intersects(bbox, childBBox)) {
          if (node.leaf) result.push(child);
          else if (contains(bbox, childBBox)) this._all(child, result);
          else nodesToSearch.push(child);
        }
      }
      node = nodesToSearch.pop()!;
    }

    return result;
  }

  collides(bbox: BBoxXOnly) {
    let node = this.data;

    if (!intersects(bbox, node)) return false;

    const nodesToSearch = [];
    while (node) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childBBox = node.leaf ? this.toBBox(child) : child;

        if (intersects(bbox, childBBox)) {
          if (node.leaf || contains(bbox, childBBox)) return true;
          nodesToSearch.push(child);
        }
      }
      node = nodesToSearch.pop()!;
    }

    return false;
  }

  load(data: RNodeXOnly<T>[]) {
    if (!(data && data.length)) return this;

    if (data.length < this._minEntries) {
      for (let i = 0; i < data.length; i++) {
        this.insert(data[i]);
      }
      return this;
    }

    // recursively build the tree with the given data from scratch using OMT algorithm
    let node = this._build(data.slice(), 0, data.length - 1, 0);

    if (!this.data.children.length) {
      // save as is if tree is empty
      this.data = node;
    } else if (this.data.height === node.height) {
      // split root if trees have the same height
      this._splitRoot(this.data, node);
    } else {
      if (this.data.height < node.height) {
        // swap trees if inserted one is bigger
        const tmpNode = this.data;
        this.data = node;
        node = tmpNode;
      }

      // insert the small tree into the large tree at appropriate level
      this._insert(node, this.data.height - node.height - 1, true);
    }

    return this;
  }

  insert(item: RNodeXOnly<T>) {
    if (item) this._insert(item, this.data.height - 1);
    return this;
  }

  clear() {
    this.data = createNode([]);
    return this;
  }

  /*
  public update(item: RNode<T>, bounds: BBox): this {
    const parent: RNode<T> = item.parentNode;

    if (
      bounds.minX < parent.minX || bounds.maxX > parent.maxX ||
      bounds.minY < parent.minY || bounds.maxY > parent.maxY
    ) {
      this.remove(item);

      item.minX = bounds.minX;
      item.maxX = bounds.maxX;
      item.minY = bounds.minY;
      item.maxY = bounds.maxY;

      this.insert(item);
    } else {
      item.minX = bounds.minX;
      item.maxX = bounds.maxX;
      item.minY = bounds.minY;
      item.maxY = bounds.maxY;
    }

    return this;
  }
*/
  remove(item: RNodeXOnly<T>, equalsFn?: (left: BBoxXOnly, right: BBoxXOnly) => boolean) {
    if (!item) return this;

    let node = this.data;
    const bbox = this.toBBox(item);
    const path = [];
    const indexes: number[] = [];
    let i: number, parent, goingUp;

    // depth-first iterative tree traversal
    while (node || path.length) {
      if (!node) {
        // go up
        node = path.pop()!;
        parent = path[path.length - 1];
        i = indexes.pop()!;
        goingUp = true;
      }

      if (node.leaf) {
        // check current node
        const index = findItem(item, node.children, equalsFn);

        if (index !== -1) {
          // item found, remove the item and condense tree upwards
          node.children.splice(index, 1);
          path.push(node);
          this._condense(path);
          return this;
        }
      }

      if (!goingUp && !node.leaf && contains(node, bbox)) {
        // go down
        path.push(node);
        indexes.push(i!);
        i = 0;
        parent = node;
        node = node.children[0];
      } else if (parent) {
        // go right
        i = i! + 1;
        node = parent.children[i];
        goingUp = false;
      } else node = null!; // nothing found
    }

    return this;
  }

  toBBox(item: BBoxXOnly) {
    return item;
  }

  compareMinX(a: BBoxXOnly, b: BBoxXOnly) {
    return a.minX - b.minX;
  }

  toJSON() {
    return this.data;
  }

  fromJSON(data: RNodeXOnly<T>) {
    this.data = data;
    return this;
  }

  private _all(node: RNodeXOnly<T>, result: RNodeXOnly<T>[]) {
    const nodesToSearch = [];
    while (node) {
      if (node.leaf) result.push(...node.children);
      else nodesToSearch.push(...node.children);

      node = nodesToSearch.pop()!;
    }
    return result;
  }

  private _build(items: RNodeXOnly<T>[], left: number, right: number, height: number): RNodeXOnly<T> {
    const N = right - left + 1;
    let M = this._maxEntries;
    let node;

    if (N <= M) {
      // reached leaf level; return leaf
      node = createNode(items.slice(left, right + 1));
      calcBBox(node, this.toBBox);
      return node;
    }

    if (!height) {
      // target height of the bulk-loaded tree
      height = Math.ceil(Math.log(N) / Math.log(M));

      // target number of root entries to maximize storage utilization
      M = Math.ceil(N / Math.pow(M, height - 1));
    }

    node = createNode<T>([]);
    node.leaf = false;
    node.height = height;

    // split the items into M mostly square tiles

    const N2 = Math.ceil(N / M);
    const N1 = N2 * Math.ceil(Math.sqrt(M));

    multiSelect(items, left, right, N1, this.compareMinX);

    for (let i = left; i <= right; i += N1) {
      const right2 = Math.min(i + N1 - 1, right);

      for (let j = i; j <= right2; j += N2) {
        const right3 = Math.min(j + N2 - 1, right2);

        // pack each entry recursively
        node.children.push(this._build(items, j, right3, height - 1));
      }
    }

    calcBBox(node, this.toBBox);

    return node;
  }

  private _chooseSubtree(bbox: BBoxXOnly, node: RNodeXOnly<T>, level: number, path: BBoxXOnly[]) {
    while (true) {
      path.push(node);

      if (node.leaf || path.length - 1 === level) break;

      let minArea = Infinity;
      let minEnlargement = Infinity;
      let targetNode;

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const area = bboxArea(child);
        const enlargement = enlargedArea(bbox, child) - area;

        // choose entry with the least area enlargement
        if (enlargement < minEnlargement) {
          minEnlargement = enlargement;
          minArea = area < minArea ? area : minArea;
          targetNode = child;
        } else if (enlargement === minEnlargement) {
          // otherwise choose one with the smallest area
          if (area < minArea) {
            minArea = area;
            targetNode = child;
          }
        }
      }

      node = targetNode || node.children[0];
    }

    return node;
  }

  private _insert(item: RNodeXOnly<T>, level: number, isNode?: boolean) {
    const bbox = isNode ? item : this.toBBox(item);
    const insertPath: RNodeXOnly<T>[] = [];

    // find the best node for accommodating the item, saving all nodes along the path too
    const node = this._chooseSubtree(bbox, this.data, level, insertPath);

    // put the item into the node
    node.children.push(item);
    extend(node, bbox);

    // split on node overflow; propagate upwards if necessary
    while (level >= 0) {
      if (insertPath[level].children.length > this._maxEntries) {
        this._split(insertPath, level);
        level--;
      } else break;
    }

    // adjust bboxes along the insertion path
    this._adjustParentBBoxes(bbox, insertPath, level);
  }

  // split overflowed node into two
  private _split(insertPath: RNodeXOnly<T>[], level: number) {
    const node = insertPath[level];
    const M = node.children.length;
    const m = this._minEntries;

    const splitIndex = this._chooseSplitIndex(node, m, M);

    const newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
    newNode.height = node.height;
    newNode.leaf = node.leaf;

    calcBBox(node, this.toBBox);
    calcBBox(newNode, this.toBBox);

    if (level) insertPath[level - 1].children.push(newNode);
    else this._splitRoot(node, newNode);
  }

  private _splitRoot(node: RNodeXOnly<T>, newNode: RNodeXOnly<T>) {
    // split root node
    this.data = createNode([node, newNode]);
    this.data.height = node.height + 1;
    this.data.leaf = false;
    calcBBox(this.data, this.toBBox);
  }

  private _chooseSplitIndex(node: RNodeXOnly<T>, m: number, M: number) {
    let index;
    let minOverlap = Infinity;
    let minArea = Infinity;

    for (let i = m; i <= M - m; i++) {
      const bbox1 = distBBox(node, 0, i, this.toBBox)!;
      const bbox2 = distBBox(node, i, M, this.toBBox)!;

      const overlap = intersectionArea(bbox1, bbox2);
      const area = bboxArea(bbox1) + bboxArea(bbox2);

      // choose distribution with minimum overlap
      if (overlap < minOverlap) {
        minOverlap = overlap;
        index = i;

        minArea = area < minArea ? area : minArea;
      } else if (overlap === minOverlap) {
        // otherwise choose distribution with minimum area
        if (area < minArea) {
          minArea = area;
          index = i;
        }
      }
    }

    return index || M - m;
  }

  // total margin of all possible split distributions where each node is at least m full
  private _allDistMargin(
    node: RNodeXOnly<T>,
    m: number,
    M: number,
    compare: (left: RNodeXOnly<T>, right: RNodeXOnly<T>) => number
  ) {
    node.children.sort(compare);

    const toBBox = this.toBBox;
    const leftBBox = distBBox(node, 0, m, toBBox)!;
    const rightBBox = distBBox(node, M - m, M, toBBox)!;
    let margin = bboxMargin(leftBBox) + bboxMargin(rightBBox);

    for (let i = m; i < M - m; i++) {
      const child = node.children[i];
      extend(leftBBox, node.leaf ? toBBox(child) : child);
      margin += bboxMargin(leftBBox);
    }

    for (let i = M - m - 1; i >= m; i--) {
      const child = node.children[i];
      extend(rightBBox, node.leaf ? toBBox(child) : child);
      margin += bboxMargin(rightBBox);
    }

    return margin;
  }

  private _adjustParentBBoxes(bbox: BBoxXOnly, path: RNodeXOnly<T>[], level: number) {
    // adjust bboxes along the given tree path
    for (let i = level; i >= 0; i--) {
      extend(path[i], bbox);
    }
  }

  private _condense(path: RNodeXOnly<T>[]) {
    // go through the path, removing empty nodes and updating bboxes
    for (let i = path.length - 1, siblings; i >= 0; i--) {
      if (path[i].children.length === 0) {
        if (i > 0) {
          siblings = path[i - 1].children;
          siblings.splice(siblings.indexOf(path[i]), 1);
        } else this.clear();
      } else calcBBox(path[i], this.toBBox);
    }
  }
}

function findItem<T>(
  item: RNodeXOnly<T>,
  items: RNodeXOnly<T>[],
  equalsFn?: (left: BBoxXOnly, right: BBoxXOnly) => boolean
) {
  if (!equalsFn) return items.indexOf(item);

  for (let i = 0; i < items.length; i++) {
    if (equalsFn(item, items[i])) return i;
  }
  return -1;
}

// calculate node's bbox from bboxes of its children
function calcBBox<T>(node: RNodeXOnly<T>, toBBox: (node: RNodeXOnly<T>) => BBoxXOnly) {
  distBBox(node, 0, node.children.length, toBBox, node);
}

// min bounding rectangle of node children from k to p-1
function distBBox<T>(
  node: RNodeXOnly<T>,
  k: number,
  p: number,
  toBBox: (node: RNodeXOnly<T>) => BBoxXOnly,
  destNode?: RNodeXOnly<T>
) {
  if (!destNode) destNode = createNode<T>(null!);
  destNode!.minX = Infinity;
  destNode!.maxX = -Infinity;

  for (let i = k; i < p; i++) {
    const child = node.children[i];
    extend(destNode!, node.leaf ? toBBox(child) : child);
  }

  return destNode;
}

function extend(a: BBoxXOnly, b: BBoxXOnly) {
  a.minX = Math.min(a.minX, b.minX);
  a.maxX = Math.max(a.maxX, b.maxX);
  return a;
}

function compareNodeMinX(a: BBoxXOnly, b: BBoxXOnly) {
  return a.minX - b.minX;
}

function bboxArea(a: BBoxXOnly) {
  return a.maxX - a.minX;
}
function bboxMargin(a: BBoxXOnly) {
  return a.maxX - a.minX;
}

function enlargedArea(a: BBoxXOnly, b: BBoxXOnly) {
  return Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX);
}

function intersectionArea(a: BBoxXOnly, b: BBoxXOnly) {
  const minX = Math.max(a.minX, b.minX);
  const maxX = Math.min(a.maxX, b.maxX);

  return Math.max(0, maxX - minX);
}

function contains(a: BBoxXOnly, b: BBoxXOnly) {
  return a.minX <= b.minX && b.maxX <= a.maxX;
}

function intersects(a: BBoxXOnly, b: BBoxXOnly) {
  return b.minX <= a.maxX && b.maxX >= a.minX;
}

function createNode<T>(children: RNodeXOnly<T>[]): RNodeXOnly<T> {
  return {
    children,
    height: 1,
    leaf: true,
    minX: Infinity,
    maxX: -Infinity,
    item: null!,
  };
}

// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
// combines selection algorithm with binary divide & conquer approach

function multiSelect<T>(arr: T[], left: number, right: number, n: number, compare: (left: T, right: T) => number) {
  const stack = [left, right];

  while (stack.length) {
    right = stack.pop()!;
    left = stack.pop()!;

    if (right - left <= n) continue;

    const mid = left + Math.ceil((right - left) / n / 2) * n;
    quickselect(arr, mid, left, right, compare);

    stack.push(left, mid, mid, right);
  }
}
