figma.showUI(__html__, { width: 240, height: 120, themeColors: true });

type cord = [number, number]; //Cordinate type [x,y]
let anode: VectorNode | ComponentNode; // The node of interest
let aparent: BaseNode & ChildrenMixin; // parent of anode
let p1: cord; // position of anode
let refreshRate: number = 150;
let nodeAry = []; // Array that contain all the child node
let handle: LineNode, handleWeight: number, origin: cord;
let initialRotation: number; // anode rotation value (deg)
let updateIntervalId: number = null;
let childCount: number = 0; // Total number of child nodes
let pixelsRounding = false;
let originAlignment = true;

figma.ui.onmessage = (msg) => {
  const { nodeCount, align2origin, round2pixels } = msg;
  if (align2origin !== undefined) originAlignment = align2origin;
  if (round2pixels !== undefined) pixelsRounding = round2pixels;

  childCount = +nodeCount || childCount;

  // Check if the total count value is > 1
  if (childCount <= 1) return;

  // Check if it the first try (by looking if anode exist)
  if (!anode) {
    // Check if multiple nodes are selected
    if (figma.currentPage.selection.length > 1) {
      notify("Select one node. Multiple nodes are not supported");
      partialReset();
      return;
    }
    // check if atleast one node is selected
    if (figma.currentPage.selection.length === 0) {
      notify("Select atleast one node.");
      partialReset();
      return;
    }

    anode = figma.currentPage.selection[0] as VectorNode;
    aparent = anode.parent;
    // }

    // Setting initial rotation
    initialRotation = anode.rotation;

    // Setting the initial origin and p1
    if (initialRotation) {
      anode.rotation = 0;
      origin = [anode.x + anode.width / 2, anode.y + anode.height * 2];
      p1 = [anode.x + anode.width / 2, anode.y + anode.height / 2];
      anode.relativeTransform = getRelativeTranform(initialRotation, anode);
    } else {
      origin = [anode.x + anode.width / 2, anode.y + anode.height * 2];
      p1 = [anode.x + anode.width / 2, anode.y + anode.height / 2];
    }

    createChild();
    updateChild();
    createHandle();
    refreshcanvas();
  }
  // will get triggered, if the value changed in the input field
  else if (nodeCount) {
    clearNodeAry();
    createChild();
    if (!handle) createHandle();
    if (!updateIntervalId) refreshcanvas();
    updateChild();
  }
  // Will get triggered, if either originAlignment or pixelsRounding changed
  else {
    updateChild();
  }
};

// Removing handles while closing plugins
figma.on("close", () => {
  removeHandle();
});

function notify(msg: string, time: number = 2000, error: boolean = false): void {
  figma.notify(msg, {
    timeout: time,
    error: error,
  });
}

/* Helper Animals :) (functions)
========================================== */
function createChild(): void {
  // console.log("Create Child Event Triggered");
  // Creating children and pushing to nodeAry

  if (anode.type === "COMPONENT") {
    for (let i = 0; i < childCount - 1; i++) nodeAry.push(anode.createInstance());
  } else {
    for (let i = 0; i < childCount - 1; i++) nodeAry.push(anode.clone());
  }

  nodeAry.forEach((e, i) => aparent.insertChild(i, e));
}

function updateChild(count: Number = childCount): void {
  // console.log("Updating child");
  // console.log("NodeAry", nodeAry);

  function getCordinates(n: number, origin: cord, p1: cord) {
    let sdeg = 360 / n;
    let cordsAry = [];

    function getNextPoint(deg: number, origin: cord, p1: cord): cord {
      const sin = (deg) => Math.sin((Math.PI / 180) * deg);
      const cos = (deg) => Math.cos((Math.PI / 180) * deg);

      let x = origin[0] + cos(deg) * (p1[0] - origin[0]) + sin(deg) * (p1[1] - origin[1]);
      let y = origin[1] - sin(deg) * (p1[0] - origin[0]) + cos(deg) * (p1[1] - origin[1]);

      return [x, y];
    }

    for (let i = 0; i < n - 1; i++) {
      let p2 = getNextPoint(sdeg, origin, p1);
      cordsAry.push(p2);
      p1 = p2;
    }

    return cordsAry;
  }
  function getAngles(n: number) {
    let sdeg = 360 / n;
    let angleAry = [];

    if (originAlignment) {
      for (let i = 0; i < n; i++) {
        let angle = (i + 1) * -sdeg;
        angleAry.push(angle);
      }
    } else {
      for (let i = 0; i < n; i++) angleAry.push(0);
    }

    angleAry.pop();
    // console.log(angleAry.reverse());
    // return angleAry;
    return angleAry.reverse();
  }

  let cordsAry = getCordinates(+count, origin, p1);
  let angles = getAngles(+count);
  // console.log("origin", origin);
  // console.log("p1", p1);
  // console.log("otherCord", cordsAry);

  nodeAry.forEach((e, i) => {
    // Check if any child node is removed
    if (e.removed) {
      clearNodeAry();
      createChild();
      updateChild();
      return;
    }

    e.x = cordsAry[i][0] - anode.width / 2;
    e.y = cordsAry[i][1] - anode.height / 2;
  });

  angles.forEach((e, i) => {
    let angle = e;
    if (initialRotation) angle = angle + initialRotation;
    nodeAry[i].relativeTransform = getRelativeTranform(angle, nodeAry[i]);
  });
}

function createHandle(): void {
  handle = figma.createLine();
  handle.name = "handle";
  handle.resize(0.01, 0);
  handleWeight = anode.height / 5.5;
  handle.strokeWeight = handleWeight;
  handle.strokeAlign = "CENTER";
  handle.strokeCap = "ROUND";
  handle.strokes = [
    {
      blendMode: "NORMAL",
      color: { r: 1, g: 0, b: 0 },
      opacity: 1,
      type: "SOLID",
      visible: true,
    },
  ];
  handle = handle;
  handle.x = origin[0];
  handle.y = origin[1];
  aparent.insertChild(0, handle);
}

function getRelativeTranform(deg: number, node: VectorNode): Transform {
  let theta = deg * (Math.PI / 180); //radians
  let cx = node.x + node.width / 2;
  let cy = node.y + node.height / 2;
  // let [cx, cy] = getCenter([node.x, node.y], node.width, node.height, deg);
  let newx = Math.cos(theta) * node.x + node.y * Math.sin(theta) - cy * Math.sin(theta) - cx * Math.cos(theta) + cx;
  let newy = -Math.sin(theta) * node.x + cx * Math.sin(theta) + node.y * Math.cos(theta) - cy * Math.cos(theta) + cy;

  // Rounding Pixels
  if (pixelsRounding) {
    newx = Math.round(newx);
    newy = Math.round(newy);
  }
  return (node.relativeTransform = [
    [Math.cos(theta), Math.sin(theta), newx],
    [-Math.sin(theta), Math.cos(theta), newy],
  ]);
}

function refreshcanvas(): void {
  updateIntervalId = setInterval(() => {
    if (anode.removed) {
      notify("The Root node has been removed!", 3000, true);
      clearNodeAry();
      figma.closePlugin();
      return;
    }

    if (anode.rotation !== initialRotation) {
      initialRotation = anode.rotation;
      updateChild();
    }

    // Checking if handle exist
    if (handle.removed) {
      reset();
      return;
    }

    // Setting the origin and p1
    if (origin[0] !== handle.x || origin[1] !== handle.y) {
      origin = [handle.x, handle.y];
      updateChild();
    }

    p1 = getCenter([anode.x, anode.y], anode.width, anode.height, initialRotation);
  }, refreshRate);
}

function getCenter(p1: cord, w: number, h: number, deg: number): cord {
  if (!initialRotation) {
    let cx = p1[0] + w / 2;
    let cy = p1[1] + h / 2;
    return [cx, cy];
  }

  const sin = (deg) => Math.sin((Math.PI / 180) * deg);
  const cos = (deg) => Math.cos((Math.PI / 180) * deg);
  let deg2 = 90 - deg;

  let p2 = [p1[0] + cos(deg) * w, p1[1] - sin(deg) * w];
  let p4 = [p1[0] + cos(deg2) * h, p1[1] + sin(deg2) * h];
  let origin: cord = [(p4[0] + p2[0]) / 2, (p4[1] + p2[1]) / 2];
  // console.log("p2", p2);
  // console.log("p4", p4);
  // console.log("origin", origin);
  return origin;
}

/* House Keeping
========================================== */

function partialReset(): void {
  // console.log("reset function is called...");
  figma.ui.postMessage({ type: "clearInput" });
  // anode = null;
  // aparent = null;
  // p1 = null;
  clearNodeAry();
  removeHandle();
  // origin = null;
  initialRotation = null;
  childCount = null;
}

function reset() {
  clearNodeAry();
  removeHandle();
  figma.ui.postMessage({ type: "clearInput" });
  anode = null;
  aparent = null;
  p1 = null;
  origin = null;
  initialRotation = null;
  childCount = null;
}

function clearNodeAry(): void {
  nodeAry.forEach((e) => {
    if (!e.removed) e.remove();
  });
  nodeAry.length = 0;
  // console.log("nodeAry Cleared");
}

function removeHandle(): void {
  if (handle && !handle.removed) {
    handle.remove();
    handle = null;
  }
  clearInterval(updateIntervalId);
  updateIntervalId = null;
}
