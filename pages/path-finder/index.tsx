import { useState, useEffect, useRef, useCallback } from "react";

type NodeState =
  | "not processed"
  | "queued"
  | "processed"
  | "wall"
  | "path"
  | "start"
  | "end";

interface PriorityItem {
  node: [number, number];
  cost: number; // Dijkstra => distance; A* => fScore
}

const Page = () => {
  const [algorithm, setAlgorithm] = useState<"A*" | "Dijkstra">("A*");
  const [gridLength, setGridLength] = useState(30);
  const [traversalType, setTraversalType] = useState<
    "non directional" | "directional"
  >("non directional");
  const [processing, setProcessing] = useState(false);

  // Our main 2D grid reference
  const gridRef = useRef<Array<Array<NodeState>>>([]);
  const [grid, setGrid] = useState<Array<Array<NodeState>>>([]);

  // Shared references for path painting / dragging walls
  const startRef = useRef<[number, number]>([0, 0]);
  const endRef = useRef<[number, number]>([0, 0]);
  const paintRef = useRef<"drawing" | "neutral" | "erasing">("neutral");

  const timeoutsRef = useRef<number[]>([]); // ①  NEW

  // searchDataRef: Contains all data used in Dijkstra / A* for the ongoing search
  const searchDataRef = useRef<{
    openSet: PriorityItem[];
    distance: Map<string, number>; // cost-so-far
    visited: Set<string>; // processed nodes
    prev: Map<string, string>; // for path reconstruction
  } | null>(null);

  // We'll store “r-c” strings for distance and visited maps
  const keyOf = (r: number, c: number) => `${r}-${c}`;

  const heuristic = (r: number, c: number, er: number, ec: number) => {
    const dr = er - r;
    const dc = ec - c;
    return Math.sqrt(dr * dr + dc * dc);
  };

  // Return neighbors in 8 directions if “non directional”, else 4 directions
  const getNeighbors = useCallback(
    (row: number, col: number) => {
      const neighbors: [number, number][] = [];
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          // skip same cell
          if (i === 0 && j === 0) continue;
          // skip diagonals if in “directional” mode
          if (
            traversalType === "non directional" &&
            Math.abs(i) + Math.abs(j) !== 1
          )
            continue;

          const newRow = row + i;
          const newCol = col + j;
          // Check boundaries and skip walls
          if (
            newRow >= 0 &&
            newRow < gridLength &&
            newCol >= 0 &&
            newCol < gridLength &&
            gridRef.current[newRow][newCol] !== "wall"
          ) {
            neighbors.push([newRow, newCol]);
          }
        }
      }
      return neighbors;
    },
    [gridLength, traversalType]
  );

  const pushToOpenSet = (
    openSet: PriorityItem[],
    node: [number, number],
    cost: number
  ) => {
    openSet.push({ node, cost });
    // sort ascending by cost
    openSet.sort((a, b) => a.cost - b.cost);
  };

  const popFromOpenSet = (openSet: PriorityItem[]) => {
    return openSet.shift(); // remove from front (lowest cost)
  };

  const processSearchStep = useCallback(() => {
    if (!searchDataRef.current) {
      setProcessing(false);
      return;
    }
    const { openSet, distance, visited, prev } = searchDataRef.current;

    // if nothing to process, we’re done
    if (openSet.length === 0) {
      setProcessing(false);
      return;
    }

    const currentItem = popFromOpenSet(openSet);
    if (!currentItem) {
      setProcessing(false);
      return;
    }

    const [row, col] = currentItem.node;
    const currentKey = keyOf(row, col);

    // If we've visited it, skip
    if (visited.has(currentKey)) {
      requestAnimationFrame(processSearchStep);
      return;
    }

    // Mark visited
    visited.add(currentKey);

    // For visualization
    if (
      gridRef.current[row][col] !== "start" &&
      gridRef.current[row][col] !== "end"
    ) {
      gridRef.current[row][col] = "processed";
      document.getElementById(`${row}-${col}`)?.classList.add("bg-blue-400");
    }

    // Check if we reached the end
    const [er, ec] = endRef.current;
    if (row === er && col === ec) {
      // Reconstruct path
      const path = [];
      let crawlKey: string | undefined = currentKey;
      while (crawlKey) {
        path.push(crawlKey);
        crawlKey = prev.get(crawlKey);
      }
      // path is from end->start
      path.reverse(); // now start->end

      // Animate the path
      path.forEach((k, i) => {
        if (
          k === keyOf(er, ec) ||
          k === keyOf(startRef.current[0], startRef.current[1])
        ) {
          return; // skip coloring start/end
        }
        const id = window.setTimeout(() => {
          const [r, c] = k.split("-").map(Number);
          const el = document.getElementById(`${r}-${c}`);
          if (el) {
            el.classList.remove("bg-blue-400");
            el.classList.add("bg-yellow-500");
          }
        }, i * 30);
        timeoutsRef.current.push(id);
      });

      return;
    }

    // Otherwise, expand neighbors
    const currentDist = distance.get(currentKey) ?? Infinity;
    const neighbors = getNeighbors(row, col);

    neighbors.forEach(([nr, nc]) => {
      const neighborKey = keyOf(nr, nc);
      if (visited.has(neighborKey)) return;

      const tentativeDist = currentDist + 1;
      if (tentativeDist < (distance.get(neighborKey) ?? Infinity)) {
        distance.set(neighborKey, tentativeDist);
        prev.set(neighborKey, currentKey);

        // cost for priority queue
        let cost = tentativeDist;
        if (algorithm === "A*") {
          // A* => gScore + heuristic
          cost += heuristic(nr, nc, er, ec);
        }

        pushToOpenSet(openSet, [nr, nc], cost);

        // Mark queued in the UI if not start/end
        if (
          gridRef.current[nr][nc] !== "start" &&
          gridRef.current[nr][nc] !== "end"
        ) {
          gridRef.current[nr][nc] = "queued";
          document
            .getElementById(`${nr}-${nc}`)
            ?.classList.add("bg-purple-400/80", "transition-colors");
        }
      }
    });

    // Schedule the next step
    requestAnimationFrame(processSearchStep);
  }, [getNeighbors, algorithm]);
  /**
   *  Called after we hit “start.” Sets up search structures
   *  for either Dijkstra or A* and begins the frame-by-frame search.
   */
  const initiatePreProcessing = useCallback(() => {
    if (!gridRef.current.length) return; // no grid
    if (processing) return; // already searching

    // Initialize search data from scratch
    const distMap = new Map<string, number>();
    const visitedSet = new Set<string>();
    const prevMap = new Map<string, string>();
    const openSet: PriorityItem[] = [];

    // Distances default to Infinity
    for (let r = 0; r < gridLength; r++) {
      for (let c = 0; c < gridLength; c++) {
        distMap.set(keyOf(r, c), Infinity);
      }
    }

    const [sr, sc] = startRef.current;
    const [er, ec] = endRef.current;

    // Dijkstra: cost = distance(u)
    // A*: cost = distance(u) + heuristic(u, end)
    distMap.set(keyOf(sr, sc), 0);
    const initialCost = algorithm === "A*" ? heuristic(sr, sc, er, ec) : 0; // Dijkstra's initial cost is 0
    pushToOpenSet(openSet, [sr, sc], initialCost);

    searchDataRef.current = {
      openSet,
      distance: distMap,
      visited: visitedSet,
      prev: prevMap,
    };

    setProcessing(true);
    requestAnimationFrame(processSearchStep);
  }, [processing, gridLength, algorithm, processSearchStep]);

  const reset = useCallback(() => {
    const newGrid: NodeState[][] = Array.from({ length: gridLength }, () =>
      Array.from({ length: gridLength }, () => "not processed")
    );

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // pick random start
    let startRow = Math.floor(Math.random() * gridLength);
    let startCol = Math.floor(Math.random() * gridLength);
    newGrid[startRow][startCol] = "start";
    startRef.current = [startRow, startCol];

    // pick random end, at least 10 distance away
    let endRow, endCol, distanceBetween;
    do {
      endRow = Math.floor(Math.random() * gridLength);
      endCol = Math.floor(Math.random() * gridLength);
      distanceBetween = Math.sqrt(
        Math.pow(endRow - startRow, 2) + Math.pow(endCol - startCol, 2)
      );
    } while (distanceBetween < 10);

    newGrid[endRow][endCol] = "end";
    endRef.current = [endRow, endCol];

    // Clear UI classes
    for (let row = 0; row < gridLength; row++) {
      for (let col = 0; col < gridLength; col++) {
        const el = document.getElementById(`${row}-${col}`);
        if (el) {
          el.className = "border border-white/10"; // reset to default
        }
      }
    }

    gridRef.current = newGrid;
    setGrid(newGrid);

    // Clear search data
    searchDataRef.current = null;

    setProcessing(false);
  }, [gridLength]);

  /**
   *  On first render, set up the board
   */
  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="h-full flex flex-col justify-center items-center md:mt-5 lg:mt-8 overflow-x-hidden">
      <div className="relative w-96 h-full aspect-square max-w-full bg-white/10 overflow-hidden border-2 border-white/10 rounded-sm">
        <div
          className={`${
            processing ? "cursor-not-allowed" : "cursor-crosshair"
          } absolute w-full h-full grid`}
          style={{
            gridTemplateRows: `repeat(${gridLength}, 1fr)`,
            gridTemplateColumns: `repeat(${gridLength}, 1fr)`,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            if (processing) return;
            if (e.button === 0) paintRef.current = "drawing";
            if (e.button === 2) paintRef.current = "erasing";
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            paintRef.current = "neutral";
          }}
          onMouseLeave={() => {
            paintRef.current = "neutral";
          }}
          onMouseEnter={(e) => {
            if (processing) return;
            // if mouse is held down on mouse enter, set paintRef
            if (e.buttons === 1) paintRef.current = "drawing";
            else if (e.buttons === 2) paintRef.current = "erasing";
            else paintRef.current = "neutral";
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {Array.from({ length: gridLength * gridLength }).map((_, i) => {
            const row = Math.floor(i / gridLength);
            const col = i % gridLength;
            const node = grid[row]?.[col];

            return (
              <div
                key={`${row}-${col}`}
                id={`${row}-${col}`}
                className={`
                  ${node === "start" ? "bg-green-400" : ""}
                  ${node === "end" ? "bg-red-500/90" : ""}
                  ${node === "wall" ? "bg-sky-600/40" : ""}
                  border border-white/10
                `}
                onMouseEnter={(e) => {
                  e.preventDefault();
                  if (
                    processing ||
                    gridRef.current[row][col] === "start" ||
                    gridRef.current[row][col] === "end"
                  )
                    return;

                  if (paintRef.current === "drawing") {
                    gridRef.current[row][col] = "wall";
                    setGrid([...gridRef.current.map((row) => [...row])]);
                    (e.target as HTMLElement).classList.add("bg-sky-600/40");
                    return;
                  }

                  if (paintRef.current === "erasing") {
                    gridRef.current[row][col] = "not processed";
                    setGrid([...gridRef.current.map((row) => [...row])]);
                    (e.target as HTMLElement).classList.remove("bg-sky-600/40");
                  }

                  if (
                    paintRef.current === "neutral" ||
                    paintRef.current === "erasing"
                  ) {
                    (e.target as HTMLElement).classList.add("bg-sky-400/50");
                    (e.target as HTMLElement).classList.remove(
                      "transition-colors",
                      "ease-in",
                      "duration-150"
                    );
                  }
                }}
                onMouseLeave={(e) => {
                  if (processing) return;
                  (e.target as HTMLElement).classList.remove("bg-sky-400/50");
                  (e.target as HTMLElement).classList.add(
                    "transition-colors",
                    "ease-in",
                    "duration-150"
                  );
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (processing) return;

                  if (
                    gridRef.current[row][col] === "start" ||
                    gridRef.current[row][col] === "end"
                  )
                    return;

                  if (e.button === 0) {
                    gridRef.current[row][col] = "wall";
                    setGrid([...gridRef.current.map((row) => [...row])]);
                    (e.target as HTMLElement).classList.add("bg-sky-600/40");
                  }

                  if (e.button === 2) {
                    gridRef.current[row][col] = "not processed";
                    setGrid([...gridRef.current.map((row) => [...row])]);
                    (e.target as HTMLElement).classList.remove("bg-sky-600/40");
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="w-96 max-w-[96%] flex justify-end mt-2.5 pb-10">
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as "A*" | "Dijkstra")}
          disabled={processing}
          className={`${
            processing ? "text-black/60" : ""
          } px-2 py-2 bg-white text-black rounded mr-2.5 text-xs sm:text-sm lg:text-base transition-colors cursor-pointer disabled:cursor-not-allowed`}
        >
          <option value="A*">A*</option>
          <option value="Dijkstra">Dijkstra</option>
        </select>

        <button
          onClick={() => {
            if (traversalType === "non directional") {
              setTraversalType("directional");
            } else {
              setTraversalType("non directional");
            }
          }}
          disabled={processing}
          className={`
          ${processing ? "text-black/60" : ""}  
          ${
            traversalType === "non directional"
              ? "bg-gray-400 hover:bg-gray-300/90 transition-colors"
              : "bg-gray-100 transition-colors"
          } flex-1 py-2 cursor-pointer disabled:cursor-not-allowed p-3 rounded text-black mr-2.5 text-xs sm:text-sm lg:text-base`}
        >
          Corner Traversal
        </button>

        <button
          onClick={initiatePreProcessing}
          disabled={processing}
          className={`
            ${
              processing
                ? "cursor-not-allowed bg-gray-400 text-black/60"
                : "cursor-pointer bg-blue-600 hover:bg-blue-500 text-white"
            }
            px-3 py-2 p-3 rounded mr-2.5 text-xs sm:text-sm lg:text-base transition-colors`}
        >
          Start
        </button>

        <button
          onClick={reset}
          className="px-3 py-2 bg-red-600 hover:bg-red-500 cursor-pointer p-3 rounded text-white text-xs sm:text-sm lg:text-base transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Page;
