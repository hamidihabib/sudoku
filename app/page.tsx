"use client";

import { useState, useCallback } from "react";
import { HTMLAttributes, ButtonHTMLAttributes, forwardRef } from "react";

// ==========================
// UI Components
// ==========================

interface CardProps extends HTMLAttributes<HTMLDivElement> {}
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center justify-center w-10 h-10 text-xl font-semibold ${className}`}
      {...props}
    />
  )
);
Card.displayName = "Card";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`rounded-md bg-blue-600 px-4 py-2 text-white font-bold shadow hover:bg-blue-700 ${className}`}
      {...props}
    />
  )
);
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
  const [originalBoard, setOriginalBoard] = useState(() => generateEmptyBoard());
  const [solutionBoard, setSolutionBoard] = useState(() => generateEmptyBoard());
  const [showSolution, setShowSolution] = useState(false);
  const [winMessage, setWinMessage] = useState("");
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

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
      
      setBoard(prev => {
        const updated = prev.map((r, i) => 
          i === row ? r.map((c, j) => j === col ? newValue : c) : r
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

    setBoard(prev => {
      const updated = prev.map((r, i) => 
        i === row ? r.map((c, j) => j === col ? solutionBoard[row][col] : c) : r
      );
      
      if (isBoardSolved(updated, solutionBoard)) {
        setWinMessage("Congratulations! You've solved the Sudoku!");
      }
      return updated;
    });
    
    setSelectedCell(null);
  }, [selectedCell, solutionBoard, originalBoard]);

  const handleCellSelect = useCallback((row: number, col: number) => {
    if (originalBoard[row][col] === 0) {
      setSelectedCell([row, col]);
    }
  }, [originalBoard]);

  const getBorderClasses = useCallback((row: number, col: number) => {
    let classes = "border border-gray-400";
    if (col % 3 === 0) classes += " border-l-2";
    if (row % 3 === 0) classes += " border-t-2";
    if (col === 8) classes += " border-r-2";
    if (row === 8) classes += " border-b-2";
    return classes;
  }, []);

  const getTextColor = useCallback(
    (row: number, col: number) =>
      findDuplicates(board, row, col) ? "text-red-600" : "text-blue-600",
    [board]
  );

  const getCellClasses = useCallback((row: number, col: number) => {
    let classes = "";
    if (selectedCell?.[0] === row && selectedCell?.[1] === col) {
      classes += " bg-yellow-100";
    }
    return classes;
  }, [selectedCell]);

  const displayedBoard = showSolution ? solutionBoard : board;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Sudoku</h1>
      
      {winMessage && (
        <div className="text-green-600 text-xl font-bold mb-6">{winMessage}</div>
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
      </div>

      <div className="grid grid-cols-9">
        {displayedBoard.map((row, rowIndex) =>
          row.map((num, colIndex) => {
            const isOriginal = originalBoard[rowIndex][colIndex] !== 0;
            return (
              <Card
                key={`${rowIndex}-${colIndex}`}
                className={`${getBorderClasses(rowIndex, colIndex)} ${
                  getCellClasses(rowIndex, colIndex)
                } bg-white`}
              >
                {isOriginal ? (
                  <span className="text-gray-800 text-xl font-bold">{num}</span>
                ) : (
                  <input
                    type="text"
                    maxLength={1}
                    className={`w-full h-full text-center text-xl font-bold focus:outline-none ${
                      getTextColor(rowIndex, colIndex)
                    }`}
                    value={num || ""}
                    onChange={(e) =>
                      handleInputChange(rowIndex, colIndex, e.target.value)
                    }
                    onClick={() => handleCellSelect(rowIndex, colIndex)}
                    aria-label={`Cell at row ${rowIndex + 1}, column ${colIndex + 1}`}
                  />
                )}
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}