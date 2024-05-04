import { ReactNode, useState } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

const Layout = ({ children }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="relative text-gray-300 flex h-0 min-h-screen pt-20 overflow-y-auto bg-black z-50">
        <div
          className="absolute flex justify-center items-center rounded-full top-5 left-5 h-10 w-10 cursor-pointer hover:text-white"
          onClick={() => setIsMenuOpen(true)}
        >
          <i className="fa-solid fa-bars text-2xl"></i>
        </div>
        <div
          className={`${
            isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          } fixed top-0 left-0 h-screen w-screen`}
        >
          <div
            className={`${
              isMenuOpen ? "opacity-100" : "opacity-0"
            } absolute w-full h-full transition-opacity bg-black bg-opacity-50`}
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <nav
            className={`${
              isMenuOpen
                ? "translate-x-0 duration-200"
                : "-translate-x-full duration-300"
            } noselect bg-black border-r border-gray-800 transition-transform fixed top-0 left-0 h-screen flex flex-col items-start w-64 [&>a]:cursor-pointer [&>a:hover]:text-white [&>a]:mt-10 [&>a:first-of-type]:mt-20 pl-10 overflow-y-auto`}
          >
            <Link href="path-finder">
              <a
                className="text-red-800 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                Breadth First Search
              </a>
            </Link>
            <Link href="visualize-loan">
              <a onClick={() => setIsMenuOpen(false)}>Calculate Loan</a>
            </Link>
            <Link href="count-islands">
              <a onClick={() => setIsMenuOpen(false)}>Count Islands</a>
            </Link>
            <Link href="dijkstra">
              <a
                className="text-red-800 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                Graph Search
                {/* Dijkstra */}
              </a>
            </Link>
            <Link href="infinite-scroll">
              <a onClick={() => setIsMenuOpen(false)}>Infinite Scroll</a>
            </Link>

            <Link href="visual-sort">
              <a onClick={() => setIsMenuOpen(false)}>Insertion Sort</a>
            </Link>

            <Link href="sodoku-solver">
              <a onClick={() => setIsMenuOpen(false)}>Sodoku Solver</a>
            </Link>

            <Link href="Web Assembly">
              <a
                className="text-red-800 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                Web Assembly
              </a>
            </Link>
          </nav>
        </div>

        <div className="absolute top-20 left-0 h-auto w-full -z-10">
          {children}
        </div>
      </div>
    </>
  );
};

export default Layout;
