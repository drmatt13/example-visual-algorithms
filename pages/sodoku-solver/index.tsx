import { useState, useEffect, useRef, useCallback } from "react";

function generateSudokuPuzzle(removeCount: number): number[][] {
  const size = 9;
  const board: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );

  function isValid(
    board: number[][],
    row: number,
    col: number,
    num: number
  ): boolean {
    for (let i = 0; i < 9; i++) {
      const blockRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const blockCol = 3 * Math.floor(col / 3) + (i % 3);
      if (
        board[row][i] === num ||
        board[i][col] === num ||
        board[blockRow][blockCol] === num
      ) {
        return false;
      }
    }
    return true;
  }

  function shuffle(array: number[]): number[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  }

  function solve(board: number[][]): boolean {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === 0) {
          const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (let num of numbers) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (solve(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function removeNumbers(board: number[][], count: number): void {
    let attempts = count;
    while (attempts > 0) {
      let row = Math.floor(Math.random() * 9);
      let col = Math.floor(Math.random() * 9);
      if (board[row][col] !== 0) {
        board[row][col] = 0;
        attempts--;
      }
    }
  }

  // Generate a complete Sudoku board
  if (!solve(board)) {
    throw new Error("Failed to generate a complete Sudoku board");
  }

  // Remove numbers to create a puzzle
  removeNumbers(board, removeCount);
  return board;
}

function isValid(board: number[][], row: number, col: number, num: number) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
  }
  for (let i = 0; i < 9; i++) {
    if (board[i][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = startRow; i < startRow + 3; i++) {
    for (let j = startCol; j < startCol + 3; j++) {
      if (board[i][j] === num) return false;
    }
  }
  return true;
}

function repaintCell(element: HTMLElement, processed: boolean) {
  element.style.display = "none";
  if (processed) {
    element.classList.remove("bg-zinc-800");
    element.classList.add("bg-sky-800");
    element.classList.remove("duration-300");
    // element.classList.add("duration-150");
    element.classList.remove("ease-in");
    element.classList.add("ease-out");
  } else {
    element.classList.remove("bg-sky-800");
    element.classList.add("bg-zinc-800");
    element.classList.remove("ease-out");
    element.classList.add("ease-in");
    // element.classList.remove("duration-150");
    element.classList.add("duration-300");
  }
  element.style.display = "";
}

const Page = () => {
  const [isSolved, setIsSolved] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCancelingRef = useRef(false);
  const combinationsTriedRef = useRef(0);
  const combinationsTriedContainerRef = useRef<HTMLDivElement>(null);

  const updateCell = useCallback((row: number, col: number, value: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cellIndex = row * 9 + col;
    const cell = container.children[cellIndex];
    value > 0 ? (cell.textContent = String(value)) : (cell.textContent = " ");
    return cell as HTMLElement;
  }, []);

  const solve = useCallback(() => {
    const container = containerRef.current;
    if (isSolving || !container) return;
    setIsSolving(true);
    isCancelingRef.current = false; // Reset canceling ref before starting

    // Extracting board state from the DOM
    let ogBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    for (let i = 0; i < 81; i++) {
      const cell = container.children[i];
      const row = Math.floor(i / 9);
      const col = i % 9;
      ogBoard[row][col] =
        cell.textContent === " " ? 0 : Number(cell.textContent);
    }

    let solutionFound = false;
    function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function backtrack(board: number[][], row: number, col: number) {
      if (solutionFound || isCancelingRef.current) return;

      if (row === 9) {
        ogBoard = board.map((row) => [...row]);
        solutionFound = true;
        setIsSolved(true);
        return;
      }

      if (col === 9) {
        await delay(1);
        await backtrack(board, row + 1, 0);
        return;
      }

      if (ogBoard[row][col] !== 0) {
        await backtrack(board, row, col + 1);
        return;
      }

      for (let num = 1; num <= 9; num++) {
        if (isValid(board, row, col, num)) {
          combinationsTriedRef.current++;
          combinationsTriedContainerRef.current!.textContent = `Combinations tried: ${combinationsTriedRef.current}`;
          board[row][col] = num;
          let cell = updateCell(row, col, num);
          if (cell) {
            repaintCell(cell, true);
            await delay(1); // Delay after each update
          }
          await backtrack(board, row, col + 1);
          if (solutionFound || isCancelingRef.current) return;
          board[row][col] = 0; // Unmake move//
          cell = updateCell(row, col, 0);
          if (cell) {
            repaintCell(cell, false);
            await delay(1); // Delay after each update
          }
        }
      }
    }

    (async () => {
      await backtrack(
        ogBoard.map((row) => [...row]),
        0,
        0
      );
      console.log(ogBoard);
      setIsSolving(false);
    })();
  }, [isSolving, updateCell]);

  const reset = useCallback(() => {
    setIsSolved(false);
    combinationsTriedRef.current = 0; // Reset the number of
    combinationsTriedContainerRef.current!.textContent = "";
    isCancelingRef.current = true; // Set the flag to stop the solving process
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    const board = generateSudokuPuzzle(60);
    for (let i = 0; i < 81; i++) {
      const cell = document.createElement("div");
      cell.className = `${
        board[Math.floor(i / 9)][i % 9] !== 0 ? "bg-zinc-700" : "bg-zinc-800"
      } relative -z-10 w-[101%] flex justify-center items-center font-semibold text-white/80 transition-colors`;
      if (board[Math.floor(i / 9)][i % 9] !== 0)
        cell.textContent = String(board[Math.floor(i / 9)][i % 9]);
      else cell.textContent = " ";
      container.appendChild(cell);
    }
    setIsSolving(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="h-full flex flex-col justify-center items-center md:mt-5 lg:mt-8 overflow-x-hidden">
      <div className="relative w-96 h-full rounded-lg aspect-square sm:rounded-lg max-w-full border-4 border-neutral-500">
        <>
          <div className="absolute w-[100%] h-full flex justify-evenly pointer-events-none -z-10 bg-zinc-800"></div>
          <div className="absolute w-full h-full flex justify-evenly pointer-events-none">
            <div className="h-full w-0.5 bg-neutral-600"></div>
            <div className="h-full w-0.5 bg-neutral-600"></div>
            <div className="h-full w-0.5 bg-neutral-600"></div>
            <div className="h-full w-0.5 bg-neutral-600"></div>
            <div className="h-full w-0.5 bg-neutral-600"></div>
            <div className="h-full w-0.5 bg-neutral-600"></div>
            <div className="h-full w-0.5 bg-neutral-600"></div>
            <div className="h-full w-0.5 bg-neutral-600"></div>
          </div>
          <div className="absolute w-full h-full flex flex-col justify-evenly pointer-events-none">
            <div className="w-full h-0.5 bg-neutral-600"></div>
            <div className="w-full h-0.5 bg-neutral-600"></div>
            <div className="w-full h-0.5 bg-neutral-600"></div>
            <div className="w-full h-0.5 bg-neutral-600"></div>
            <div className="w-full h-0.5 bg-neutral-600"></div>
            <div className="w-full h-0.5 bg-neutral-600"></div>
            <div className="w-full h-0.5 bg-neutral-600"></div>
            <div className="w-full h-0.5 bg-neutral-600"></div>
          </div>
          <div className="absolute w-full h-full flex flex-col justify-evenly pointer-events-none">
            <div className="w-full h-1 bg-neutral-500"></div>
            <div className="w-full h-1 bg-neutral-500"></div>
          </div>
          <div className="absolute w-full h-full flex justify-evenly pointer-events-none">
            <div className="h-full w-1 bg-neutral-500"></div>
            <div className="h-full w-1 bg-neutral-500"></div>
          </div>
        </>
        <div
          className="absolute w-full h-full grid grid-cols-9 overflow-hidden"
          ref={containerRef}
        />
      </div>
      <div className="w-96 max-w-[96%] flex justify-end mt-2.5 pb-10">
        <div
          ref={combinationsTriedContainerRef}
          className="py-2 flex-1 flex items-center text-xs sm:text-sm lg:text-base"
        />
        <button
          disabled={isSolving || isSolved}
          onClick={solve}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-200 disabled:bg-gray-500 cursor-pointer disabled:cursor-not-allowed p-3 rounded text-black mr-2.5 text-xs sm:text-sm lg:text-base"
        >
          Solve
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 cursor-pointer p-3 rounded text-white text-xs sm:text-sm lg:text-base"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Page;
