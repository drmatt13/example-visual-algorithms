import { useState, useEffect, useCallback, useRef } from "react";

const Page = () => {
  const [length] = useState(100);
  const [array, setArray] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const animationFrameRef = useRef<number | null>(null);
  const [current, setCurrent] = useState(-1); // state to indicate the current active index
  const lastItemWasAnimatedRef = useRef(false);

  const reset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setArray(
      Array.from({ length }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
    );
    setProcessing(false);
    setCurrent(-1); // Reset current index
    lastItemWasAnimatedRef.current = false;
  }, [length]);

  const sort = useCallback(() => {
    if (processing) return;
    setProcessing(true);
    const n = array.length;
    const arr = [...array];

    const insertionSortStep = (i: number) => {
      if (i < n) {
        let key = arr[i];
        let j = i - 1;

        const findInsertPosition = (j: number, key: number) => {
          setCurrent(j); // Update current during this step
          if (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            setArray([...arr]);
            animationFrameRef.current = requestAnimationFrame(() =>
              findInsertPosition(j - 1, key)
            );
          } else {
            arr[j + 1] = key;
            setArray([...arr]);
            if (i + 1 < n) {
              animationFrameRef.current = requestAnimationFrame(() => {
                insertionSortStep(i + 1);
              });
            } else {
              if (lastItemWasAnimatedRef.current) {
                setCurrent(i - 1);
                requestAnimationFrame(() => {
                  setCurrent(-1);
                  setProcessing(false);
                });
              } else {
                lastItemWasAnimatedRef.current = true;
                setCurrent(-1); // Reset current index after sorting
                setProcessing(false); // Sorting complete
              }
            }
          }
        };

        findInsertPosition(j, key);
      } else {
        setProcessing(false); // Sorting complete
        setCurrent(-1); // Reset current index after sorting
      }
    };

    animationFrameRef.current = requestAnimationFrame(() =>
      insertionSortStep(1)
    ); // Start sorting from the second element
  }, [array, processing]);

  useEffect(() => {
    if (!initialLoad) return;
    reset();
    setInitialLoad(false);
  }, [initialLoad, reset]);

  return (
    <div className="h-full flex flex-col justify-center items-center md:mt-5 lg:mt-8 overflow-x-hidden text-xs sm:text-sm lg:text-base">
      <div className="w-[40rem] bg-gradient-to-l from-green-900/75 via-green-800/75 to-green-700/80 sm:rounded max-w-full h-72 flex items-end overflow-hidden">
        {!initialLoad &&
          array.map((value, index) => (
            <div
              key={index}
              className={`flex-1 ${
                processing && current + 1 === index
                  ? "bg-sky-700"
                  : "bg-green-600 transition-colors duration-300 ease-in"
              } shadow shadow-black/25`}
              style={{ height: `${value * (100 / length)}%` }}
            />
          ))}
      </div>
      <div className="w-[40rem] max-w-[96%] flex justify-end mt-2.5 pb-10">
        <button
          disabled={processing}
          onClick={sort}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-200 disabled:bg-gray-500 cursor-pointer disabled:cursor-not-allowed p-3 rounded text-black mr-2.5"
        >
          Sort
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 cursor-pointer p-3 rounded text-white"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Page;
