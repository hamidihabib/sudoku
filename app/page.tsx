"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { HTMLAttributes, ButtonHTMLAttributes, forwardRef } from "react";

// ==========================
// UI Components
// ==========================

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center justify-center w-10 h-10 text-xl font-semibold ${className}`}
      {...props}
    />
  )
);
Card.displayName = "Card";

const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className = "", ...props }, ref) => (
  <button
    ref={ref}
    className={`rounded-md bg-blue-600 px-4 py-2 text-white font-bold shadow hover:bg-blue-700 ${className}`}
    {...props}
  />
));
Button.displayName = "Button";

// ==========================
// Sudoku Game Logic
// ==========================

type Difficulty = "easy" | "medium" | "hard";
const difficulties: Record<Difficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 24,
};

const generateEmptyBoard = () =>
  Array.from({ length: 9 }, () => Array(9).fill(0));

const shuffle = (array: number[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const fillBoard = (board: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of numbers) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const isValid = (board: number[][], row: number, col: number, num: number) => {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + (i % 3);
    if (board[boxRow][boxCol] === num) return false;
  }
  return true;
};

const removeNumbers = (board: number[][], clues: number) => {
  let attempts = 81 - clues;
  while (attempts > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      attempts--;
    }
  }
  return board;
};

const findDuplicates = (board: number[][], row: number, col: number) => {
  const value = board[row][col];
  if (value === 0) return false;

  // Check row
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === value) return true;
  }

  // Check column
  for (let i = 0; i < 9; i++) {
    if (i !== row && board[i][col] === value) return true;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = startRow; i < startRow + 3; i++) {
    for (let j = startCol; j < startCol + 3; j++) {
      if (i === row && j === col) continue;
      if (board[i][j] === value) return true;
    }
  }

  return false;
};

const isBoardSolved = (board: number[][], solution: number[][]) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== solution[row][col]) return false;
    }
  }
  return true;
};

// ==========================
// React Component: Home
// ==========================

export default function Home() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState(() => generateEmptyBoard());
  const [originalBoard, setOriginalBoard] = useState(() =>
    generateEmptyBoard()
  );
  const [solutionBoard, setSolutionBoard] = useState(() =>
    generateEmptyBoard()
  );
  const [showSolution, setShowSolution] = useState(false);
  const [winMessage, setWinMessage] = useState("");
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [activeHelp, setActiveHelp] = useState(false);

  const generateSudoku = useCallback(() => {
    const fullBoard = generateEmptyBoard();
    fillBoard(fullBoard);
    const puzzle = structuredClone(fullBoard);
    removeNumbers(puzzle, difficulties[difficulty]);

    setBoard(puzzle);
    setOriginalBoard(puzzle);
    setSolutionBoard(fullBoard);
    setShowSolution(false);
    setWinMessage("");
    setSelectedCell(null);
  }, [difficulty]);

  const handleInputChange = useCallback(
    (row: number, col: number, value: string) => {
      const num = parseInt(value);
      const newValue = Number.isNaN(num) || num < 1 || num > 9 ? 0 : num;

      setBoard((prev) => {
        const updated = prev.map((r, i) =>
          i === row ? r.map((c, j) => (j === col ? newValue : c)) : r
        );

        if (isBoardSolved(updated, solutionBoard)) {
          setWinMessage("Congratulations! You've solved the Sudoku!");
        } else if (winMessage) {
          setWinMessage("");
        }
        return updated;
      });
    },
    [solutionBoard, winMessage]
  );

  const handleShowSelectedSolution = useCallback(() => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (originalBoard[row][col] !== 0) return;

    setBoard((prev) => {
      const updated = prev.map((r, i) =>
        i === row
          ? r.map((c, j) => (j === col ? solutionBoard[row][col] : c))
          : r
      );

      if (isBoardSolved(updated, solutionBoard)) {
        setWinMessage("Congratulations! You've solved the Sudoku!");
      }
      return updated;
    });

    setSelectedCell(null);
  }, [selectedCell, solutionBoard, originalBoard]);

  const handleCellSelect = useCallback(
    (row: number, col: number) => {
      if (originalBoard[row][col] === 0) {
        setSelectedCell([row, col]);
      }
    },
    [originalBoard]
  );

  const getBorderClasses = useCallback((row: number, col: number) => {
    let classes = "border border-gray-400";
    if (col % 3 === 0) classes += " border-l-2";
    if (row % 3 === 0) classes += " border-t-2";
    if (col === 8) classes += " border-r-2";
    if (row === 8) classes += " border-b-2";
    return classes;
  }, []);

  const getTextColor = useCallback(
    (row: number, col: number) => {
      if (activeHelp) {
        const currentValue = board[row][col];
        const correctValue = solutionBoard[row][col];
        return currentValue !== 0 && currentValue !== correctValue
          ? "text-red-600"
          : "text-blue-600";
      }
      return findDuplicates(board, row, col) ? "text-red-600" : "text-blue-600";
    },
    [board, activeHelp, solutionBoard]
  );

  const getCellClasses = useCallback(
    (row: number, col: number) => {
      let classes = "";
      if (selectedCell?.[0] === row && selectedCell?.[1] === col) {
        classes += " bg-yellow-200";
      }
      return classes;
    },
    [selectedCell]
  );

  const displayedBoard = showSolution ? solutionBoard : board;

  useEffect(() => {
    generateSudoku();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Sudoku</h1>
      <p className="mb-5">Click the 'New Game' button to start a new game.</p>

      {winMessage && (
        <div className="text-green-600 text-xl font-bold mb-6">
          {winMessage}
        </div>
      )}

      <div className="mb-4 flex gap-2 flex-wrap justify-center">
        <select
          className="rounded-md border p-2 text-lg shadow"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        >
          {Object.keys(difficulties).map((diff) => (
            <option key={diff} value={diff}>
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </option>
          ))}
        </select>

        <Button onClick={generateSudoku}>New Game</Button>
        <Button onClick={() => setShowSolution((prev) => !prev)}>
          {showSolution ? "Hide Solution" : "Show All Solutions"}
        </Button>
        <Button
          onClick={handleShowSelectedSolution}
          disabled={!selectedCell}
          className={!selectedCell ? "opacity-50 cursor-not-allowed" : ""}
        >
          Reveal Selected Cell
        </Button>
        <Button onClick={() => setActiveHelp((prev) => !prev)}>
          {activeHelp ? "Deactivate Help" : "Activate Help"}
        </Button>
      </div>

      <div className="grid grid-cols-9">
        {displayedBoard.map((row, rowIndex) =>
          row.map((num, colIndex) => {
            const isOriginal = originalBoard[rowIndex][colIndex] !== 0;
            return (
              <Card
                key={`${rowIndex}-${colIndex}`}
                className={`${getBorderClasses(
                  rowIndex,
                  colIndex
                )} ${getCellClasses(rowIndex, colIndex)} bg-white`}
              >
                {isOriginal ? (
                  <span className="text-gray-800 text-xl font-bold">{num}</span>
                ) : (
                  <input
                    type="text"
                    maxLength={1}
                    className={`w-full h-full text-center text-xl font-bold focus:outline-none ${getTextColor(
                      rowIndex,
                      colIndex
                    )}`}
                    value={num || ""}
                    onChange={(e) =>
                      handleInputChange(rowIndex, colIndex, e.target.value)
                    }
                    onClick={() => handleCellSelect(rowIndex, colIndex)}
                    aria-label={`Cell at row ${rowIndex + 1}, column ${
                      colIndex + 1
                    }`}
                  />
                )}
              </Card>
            );
          })
        )}
      </div>
      <div className="pt-5">
        <Link
          href="https://github.com/hamidihabib/sudoku"
          target="_blank"
          className="flex items-baseline"
        >
          <svg
            height="32"
            aria-hidden="true"
            viewBox="0 0 24 24"
            version="1.1"
            width="32"
            data-view-component="true"
          >
            <path d="M12 1C5.9225 1 1 5.9225 1 12C1 16.8675 4.14875 20.9787 8.52125 22.4362C9.07125 22.5325 9.2775 22.2025 9.2775 21.9137C9.2775 21.6525 9.26375 20.7862 9.26375 19.865C6.5 20.3737 5.785 19.1912 5.565 18.5725C5.44125 18.2562 4.905 17.28 4.4375 17.0187C4.0525 16.8125 3.5025 16.3037 4.42375 16.29C5.29 16.2762 5.90875 17.0875 6.115 17.4175C7.105 19.0812 8.68625 18.6137 9.31875 18.325C9.415 17.61 9.70375 17.1287 10.02 16.8537C7.5725 16.5787 5.015 15.63 5.015 11.4225C5.015 10.2262 5.44125 9.23625 6.1425 8.46625C6.0325 8.19125 5.6475 7.06375 6.2525 5.55125C6.2525 5.55125 7.17375 5.2625 9.2775 6.67875C10.1575 6.43125 11.0925 6.3075 12.0275 6.3075C12.9625 6.3075 13.8975 6.43125 14.7775 6.67875C16.8813 5.24875 17.8025 5.55125 17.8025 5.55125C18.4075 7.06375 18.0225 8.19125 17.9125 8.46625C18.6138 9.23625 19.04 10.2125 19.04 11.4225C19.04 15.6437 16.4688 16.5787 14.0213 16.8537C14.42 17.1975 14.7638 17.8575 14.7638 18.8887C14.7638 20.36 14.75 21.5425 14.75 21.9137C14.75 22.2025 14.9563 22.5462 15.5063 22.4362C19.8513 20.9787 23 16.8537 23 12C23 5.9225 18.0775 1 12 1Z"></path>
          </svg>
          https://github.com/hamidihabib/sudoku
        </Link>
      </div>
    </main>
  );
}
