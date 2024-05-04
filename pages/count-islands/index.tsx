import { useRef, useState, useCallback } from "react";

class Node<T> {
  value: T;
  prev: Node<T> | null;
  next: Node<T> | null;
  constructor(value: T) {
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class Queue<T> {
  head: Node<T> | null;
  tail: Node<T> | null;
  constructor() {
    this.head = null;
    this.tail = null;
  }
  enqueue(value: T) {
    const newNode = new Node(value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail!.next = newNode;
      newNode.prev = this.tail;
      this.tail = newNode;
    }
  }
  dequeue() {
    if (!this.head) return null;
    if (this.head === this.tail) {
      this.tail = null;
    }
    const value = this.head.value;
    this.head = this.head.next;
    if (this.head) this.head.prev = null;
    return value;
  }
}

const Page = () => {
  const [initialState] = useState<{
    menuOption: 0 | 1 | 2 | 3;
    gridLength: number;
    gridRange: number[];
    randomPointsLength: number;
    randomPoints: number[];
    decay: number;
    decayRange: number[];
    islandCount: number;
  }>({
    menuOption: 0,
    gridLength: 40,
    gridRange: [20, 100],
    randomPointsLength: 35,
    randomPoints: [],
    decay: 0.37,
    decayRange: [0, 0.5],
    islandCount: 0,
  });
  const [menuOption, setMenuOption] = useState<0 | 1 | 2 | 3>(
    initialState.menuOption
  );
  const [gridLength, setGridLength] = useState<number>(initialState.gridLength);
  const [grid, setGrid] = useState<JSX.Element[]>([]);
  const [randomPointsLength, setRandomPointsLength] = useState<number>(
    initialState.randomPointsLength
  );
  const [randomPoints, setRandomPoints] = useState<number[]>([]);
  const [decay, setDecay] = useState<number>(initialState.decay);
  const [islandCount, setIslandCount] = useState<number>(
    initialState.islandCount
  );
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  const animationStateRef = useRef<boolean>(false);
  const animtionRef = useRef<number>(0);

  const encode = useCallback(
    (x: number, y: number) => y * gridLength + x,
    [gridLength]
  );

  const decode = useCallback(
    (num: number) => {
      const x = num % gridLength;
      const y = Math.floor(num / gridLength);
      return [x, y];
    },
    [gridLength]
  );

  const reset = useCallback(() => {
    if (animationStateRef.current && optionsContainerRef.current) {
      animationStateRef.current = false;
      const resetButton =
        optionsContainerRef.current.querySelectorAll("button")[1];
      resetButton.disabled = true;
      resetButton.style.transform = "tranzlateZ(0)";
      return;
    }
    animationStateRef.current = true;
    function startAnimation() {
      if (optionsContainerRef.current) {
        optionsContainerRef.current.querySelectorAll("input")[0].disabled =
          true;
        optionsContainerRef.current
          .querySelectorAll("button")
          .forEach((btn) => {
            btn.disabled = true;
          });
        animtionRef.current = requestAnimationFrame(updateState);
      }
    }
    function updateState() {
      setGridLength(initialState.gridLength);
      setRandomPointsLength(initialState.randomPointsLength);
      setDecay(initialState.decay);
      setMenuOption(initialState.menuOption);
      setGrid([]);
      setRandomPoints([]);
      setIslandCount(initialState.islandCount);
      animationStateRef.current = false;
    }
    animtionRef.current =
      menuOption === 3
        ? requestAnimationFrame(updateState)
        : requestAnimationFrame(startAnimation);
  }, [
    initialState.decay,
    initialState.gridLength,
    initialState.islandCount,
    initialState.menuOption,
    initialState.randomPointsLength,
    menuOption,
  ]);

  const generateGrid = useCallback(() => {
    animationStateRef.current = true;
    function startAnimation() {
      if (animationStateRef.current === false || !optionsContainerRef.current) {
        return reset();
      }
      optionsContainerRef.current.querySelectorAll("input")[0].disabled = true;
      optionsContainerRef.current.querySelectorAll("button")[0].disabled = true;
      animtionRef.current = requestAnimationFrame(createGrid);
    }
    function createGrid() {
      setGrid(
        Array.from({ length: gridLength ** 2 }, (_, key) => (
          <div
            key={key}
            className={`h-full w-full border border-sky-700/50 noselect transition-colors ease-in animate-fade-in `}
            data-key={key}
            data-landtype={"water"}
            data-countIslands-enqueued={false}
            data-countIslands-traverseLand-processed={false}
          />
        ))
      );
      setMenuOption(1);
      animationStateRef.current = false;
    }
    setRandomPointsLength(gridLength + Math.floor(gridLength / 2));
    animtionRef.current = requestAnimationFrame(startAnimation);
  }, [gridLength, reset]);

  const generatePoints = useCallback(() => {
    animationStateRef.current = true;

    function generateRandomPoints(max: number) {
      const randomPoints: number[] = [];
      while (randomPoints.length < randomPointsLength) {
        const randomPoint = Math.floor(Math.random() * max);
        if (!randomPoints.includes(randomPoint)) {
          randomPoints.push(randomPoint);
        }
      }
      return randomPoints;
    }

    let randomPoints: number[] = [];

    setRandomPoints(() => {
      randomPoints = generateRandomPoints(gridLength ** 2);
      return [...randomPoints];
    });

    function startAnimation() {
      if (animationStateRef.current === false || !optionsContainerRef.current) {
        return reset();
      }
      optionsContainerRef.current.querySelectorAll("input")[0].disabled = true;
      optionsContainerRef.current.querySelectorAll("button")[0].disabled = true;
      animtionRef.current = requestAnimationFrame(animatePoints);
    }
    function animatePoints() {
      if (animationStateRef.current === false || !gridContainerRef.current) {
        return reset();
      }
      const point = decode(randomPoints.pop()!);
      const element =
        gridContainerRef.current.children[encode(point[0], point[1])];
      element.classList.remove(
        "border",
        "border-sky-700/50",
        "animate-fade-in",
        "transition-colors"
      );
      element.classList.add("bg-green-800");
      element.setAttribute("data-landtype", "land");

      if (randomPoints.length > 0) {
        return (animtionRef.current = requestAnimationFrame(animatePoints));
      }
      setMenuOption(2);
      animationStateRef.current = false;
    }
    animtionRef.current = requestAnimationFrame(startAnimation);
  }, [gridLength, decode, encode, randomPointsLength, reset]);

  const expandIslands = useCallback(() => {
    animationStateRef.current = true;

    function startAnimation() {
      if (animationStateRef.current === false || !optionsContainerRef.current) {
        return reset();
      }
      optionsContainerRef.current.querySelectorAll("input")[0].disabled = true;
      optionsContainerRef.current.querySelectorAll("button")[0].disabled = true;
      animtionRef.current = requestAnimationFrame(animateLandGeneration);
    }

    const stack: number[] = randomPoints.slice();

    function animateLandGeneration() {
      if (animationStateRef.current === false || !gridContainerRef.current) {
        return reset();
      }
      const element = gridContainerRef.current.children[stack.pop()!];

      element.classList.remove(
        "border",
        "border-sky-700/50",
        "animate-fade-in"
      );
      element.classList.add("bg-green-800", "duration-300");
      element.setAttribute("data-landtype", "land");

      const [x, y] = decode(Number(element.getAttribute("data-key")));

      const traverse = (element: Element) => {
        if (element.getAttribute("data-landtype") === "water") {
          if (Math.random() < decay)
            stack.push(+element.getAttribute("data-key")!);
        }
      };

      if (x > 0) {
        const leftElement = gridContainerRef.current.children[encode(x - 1, y)];
        traverse(leftElement);
      }
      if (x < gridLength - 1) {
        const rightElement =
          gridContainerRef.current.children[encode(x + 1, y)];
        traverse(rightElement);
      }
      if (y > 0) {
        const topElement = gridContainerRef.current.children[encode(x, y - 1)];
        traverse(topElement);
      }
      if (y < gridLength - 1) {
        const bottomElement =
          gridContainerRef.current.children[encode(x, y + 1)];
        traverse(bottomElement);
      }

      if (stack.length) {
        return requestAnimationFrame(animateLandGeneration);
      }

      animationStateRef.current = false;
      setMenuOption(3);
    }

    animtionRef.current = requestAnimationFrame(startAnimation);
  }, [decay, decode, encode, gridLength, randomPoints, reset]);

  const countIslands = useCallback(() => {
    animationStateRef.current = true;

    const waterQueue = new Queue<Element>();
    const landQueue = new Queue<Element>();

    const enqueueElement = (element: Element) => {
      if (element.getAttribute("data-countIslands-enqueued") === "false") {
        element.setAttribute("data-countIslands-enqueued", "true");
        if (element.getAttribute("data-landtype") === "water") {
          waterQueue.enqueue(element);
        } else {
          landQueue.enqueue(element);
        }
      }
    };

    function startAnimation() {
      if (
        animationStateRef.current === false ||
        !gridContainerRef.current ||
        !optionsContainerRef.current
      ) {
        return reset();
      }
      optionsContainerRef.current.querySelectorAll("button")[0].disabled = true;
      const firstIsland = gridContainerRef.current.children[randomPoints[0]];
      firstIsland.setAttribute("data-countIslands-enqueued", "true");
      if (firstIsland.getAttribute("data-landtype") === "water") {
        waterQueue.enqueue(firstIsland);
        return (animtionRef.current = requestAnimationFrame(traverseWater));
      }
      landQueue.enqueue(firstIsland);
      setIslandCount((islandCount) => islandCount + 1);
      return (animtionRef.current = requestAnimationFrame(traverseLand));
    }

    function traverseWater() {
      if (animationStateRef.current === false || !gridContainerRef.current) {
        return reset();
      }
      const element = waterQueue.dequeue()!;

      element.classList.remove(
        "border",
        "border-sky-700/50",
        "animate-fade-in"
      );
      element.classList.add("bg-blue-800", "duration-100");

      const [x, y] = decode(Number(element.getAttribute("data-key")));

      if (x > 0) {
        const leftElement = gridContainerRef.current.children[encode(x - 1, y)];
        enqueueElement(leftElement);
      }
      if (x < gridLength - 1) {
        const rightElement =
          gridContainerRef.current.children[encode(x + 1, y)];
        enqueueElement(rightElement);
      }
      if (y > 0) {
        const topElement = gridContainerRef.current.children[encode(x, y - 1)];
        enqueueElement(topElement);
      }
      if (y < gridLength - 1) {
        const bottomElement =
          gridContainerRef.current.children[encode(x, y + 1)];
        enqueueElement(bottomElement);
      }

      if (landQueue.head) {
        setIslandCount((prev) => prev + 1);
        return (animtionRef.current = requestAnimationFrame(traverseLand));
      } else if (waterQueue.head) {
        return (animtionRef.current = requestAnimationFrame(traverseWater));
      }
      animationStateRef.current = false;
    }

    function traverseLand() {
      if (animationStateRef.current === false || !gridContainerRef.current) {
        return reset();
      }
      const element = landQueue.dequeue()!;
      if (
        element.getAttribute("data-countIslands-traverseLand-processed") ===
        "true"
      ) {
        if (landQueue.head) {
          return (animtionRef.current = requestAnimationFrame(traverseLand));
        } else if (waterQueue.head) {
          return (animtionRef.current = requestAnimationFrame(traverseWater));
        }
        animationStateRef.current = false;
      }

      element.setAttribute("data-countIslands-traverseLand-processed", "true");

      element.classList.remove("bg-green-800", "animate-fade-in");
      element.classList.add(
        "bg-green-500",
        "border",
        "border-sky-700/50",
        "duration-200"
      );

      const [x, y] = decode(Number(element.getAttribute("data-key")));

      if (x > 0) {
        const leftElement = gridContainerRef.current.children[encode(x - 1, y)];
        enqueueElement(leftElement);
      }
      if (x < gridLength - 1) {
        const rightElement =
          gridContainerRef.current.children[encode(x + 1, y)];
        enqueueElement(rightElement);
      }
      if (y > 0) {
        const topElement = gridContainerRef.current.children[encode(x, y - 1)];
        enqueueElement(topElement);
      }
      if (y < gridLength - 1) {
        const bottomElement =
          gridContainerRef.current.children[encode(x, y + 1)];
        enqueueElement(bottomElement);
      }

      if (landQueue.head) {
        return (animtionRef.current = requestAnimationFrame(traverseLand));
      } else if (waterQueue.head) {
        return (animtionRef.current = requestAnimationFrame(traverseWater));
      }
      animationStateRef.current = false;
    }

    animtionRef.current = requestAnimationFrame(startAnimation);
  }, [decode, encode, gridLength, randomPoints, reset]);

  return (
    <div className="min-h-full flex flex-col items-center md:mt-5 lg:mt-8 pb-8 lg:pb-12">
      <div className="overflow-hidden max-w-[90vw] max-h-[90vw] w-96 h-96 rounded-lg">
        <div
          className="h-full w-full grid bg-sky-400/90 will-change-transform transform-gpu"
          ref={gridContainerRef}
          style={{
            gridTemplateRows: `repeat(${gridLength}, 1fr)`,
            gridTemplateColumns: `repeat(${gridLength}, 1fr)`,
          }}
        >
          {grid}
        </div>
      </div>
      <div
        className="max-w-[90vw] w-96 pt-5 flex flex-col"
        ref={optionsContainerRef}
      >
        {menuOption === 0 && (
          <>
            <div className="pb-2.5">
              board size: {gridLength} x {gridLength}
            </div>
            <input
              type="range"
              min={initialState.gridRange[0]}
              defaultValue={gridLength}
              max={initialState.gridRange[1]}
              step={1}
              onChange={(e) => setGridLength(Number(e.target.value))}
            />
            <button
              className="mt-4 bg-gray-300 hover:bg-gray-200 disabled:bg-gray-500 cursor-pointer disabled:cursor-not-allowed py-3 rounded-sm text-black"
              onClick={generateGrid}
            >
              Continue
            </button>
          </>
        )}
        {menuOption === 1 && (
          <>
            <div className="pb-2.5">random points: {randomPointsLength}</div>
            <input
              type="range"
              min={1}
              defaultValue={randomPointsLength}
              max={gridLength * 2}
              step={1}
              onChange={(e) => setRandomPointsLength(+e.target.value)}
            />
            <button
              className="mt-4 bg-gray-300 hover:bg-gray-200 disabled:bg-gray-500 cursor-pointer disabled:cursor-not-allowed p-3 rounded-sm text-black"
              onClick={generatePoints}
            >
              Generate Points
            </button>
            <button
              className="mt-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-500 cursor-pointer disabled:cursor-not-allowed p-3 rounded-sm text-white disabled:text-black"
              onClick={reset}
            >
              Reset
            </button>
          </>
        )}
        {menuOption === 2 && (
          <>
            <div className="pb-2.5">probability of land expansion: {decay}</div>
            <input
              type="range"
              min={initialState.decayRange[0]}
              defaultValue={decay}
              max={initialState.decayRange[1]}
              step={0.01}
              onChange={(e) => setDecay(+e.target.value)}
            />
            <button
              className="mt-4 bg-gray-300 hover:bg-gray-200 disabled:bg-gray-500 cursor-pointer disabled:cursor-not-allowed p-3 rounded-sm text-black"
              onClick={expandIslands}
            >
              Expand Islands
            </button>
            <button
              className="mt-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-500 cursor-pointer disabled:cursor-not-allowed p-3 rounded-sm text-white disabled:text-black"
              onClick={reset}
            >
              Reset
            </button>
          </>
        )}
        {menuOption === 3 && (
          <>
            <div>count: {islandCount}</div>
            <button
              className="mt-[2.6rem] bg-gray-300 hover:bg-gray-200 disabled:bg-gray-500 cursor-pointer disabled:cursor-not-allowed p-3 rounded-sm text-black"
              onClick={countIslands}
            >
              Count Islands
            </button>
            <button
              className="mt-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-500 cursor-pointer disabled:cursor-not-allowed p-3 rounded-sm text-white disabled:text-black"
              onClick={reset}
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Page;
