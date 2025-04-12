"use client";

import { useState } from "react";
import { HTMLAttributes, ButtonHTMLAttributes, forwardRef } from "react";

// ==========================
// UI Components
// ==========================

// Card component - a reusable styled div
interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center justify-center w-12 h-12 text-xl font-semibold ${className}`}
      {...props}
    />
  )
);
Card.displayName = "Card";

// Button component - a reusable styled button
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

// Difficulty levels and corresponding number of clues
type Difficulty = "easy" | "medium" | "hard";

const difficulties: Record<Difficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 24,
};

// Generate a 9x9 board filled with zeros
const generateEmptyBoard = () =>
  Array.from({ length: 9 }, () => Array(9).fill(0));

// Fisher-Yates shuffle to randomize an array
const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Recursively fill the board with valid numbers using backtracking
const fillBoard = (board: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of numbers) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0; // backtrack
          }
        }
        return false; // no valid number found
      }
    }
  }
  return true; // board is completely filled
};

// Check if placing a number is valid (no conflict in row, column, or box)
const isValid = (board: number[][], row: number, col: number, num: number) => {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false; // check row and column
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + (i % 3);
    if (board[boxRow][boxCol] === num) return false; // check 3x3 box
  }
  return true;
};

// Remove numbers from a full board to create a puzzle
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

// Check if a cell value is duplicated in its row or column
const findDuplicates = (
  board: number[][],
  row: number,
  col: number
): boolean => {
  const value = board[row][col];
  let isDuplicate = false;

  // Check row for duplicate
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === value) {
      isDuplicate = true;
      break;
    }
  }

  // Check column for duplicate
  if (!isDuplicate) {
    for (let i = 0; i < 9; i++) {
      if (i !== row && board[i][col] === value) {
        isDuplicate = true;
        break;
      }
    }
  }

  return isDuplicate;
};

// Verify if the board matches the solution
const isBoardSolved = (board: number[][], solution: number[][]): boolean => {
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
  // State for managing game
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<number[][]>(generateEmptyBoard());
  const [originalBoard, setOriginalBoard] = useState<number[][]>(
    generateEmptyBoard()
  );
  const [solutionBoard, setSolutionBoard] = useState<number[][]>(
    generateEmptyBoard()
  );
  const [showSolution, setShowSolution] = useState(false);
  const [winMessage, setWinMessage] = useState<string>("");

  // Generate a new Sudoku puzzle
  const generateSudoku = () => {
    const fullBoard = generateEmptyBoard();
    fillBoard(fullBoard);

    const puzzle = removeNumbers(
      JSON.parse(JSON.stringify(fullBoard)),
      difficulties[difficulty]
    );

    setBoard(puzzle);
    setOriginalBoard(puzzle);
    setSolutionBoard(fullBoard);
    setShowSolution(false);
    setWinMessage("");
  };

  // Handle user input changes in the board
  const handleInputChange = (row: number, col: number, value: string) => {
    const updatedBoard = board.map((r) => [...r]);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 9) {
      updatedBoard[row][col] = num;
    } else {
      updatedBoard[row][col] = 0;
    }
    setBoard(updatedBoard);

    // Check for victory after input
    if (isBoardSolved(updatedBoard, solutionBoard)) {
      setWinMessage("Congratulations! You've solved the Sudoku!");
    }
  };

  // Determine border styles for cells (thicker for box boundaries)
  const getBorderClasses = (row: number, col: number) => {
    let classes = "border border-gray-400";
    if (col % 3 === 0) classes += " border-l-2";
    if (row % 3 === 0) classes += " border-t-2";
    if (col === 8) classes += " border-r-2";
    if (row === 8) classes += " border-b-2";
    return classes;
  };

  // Determine text color based on duplication
  const getTextColor = (row: number, col: number) => {
    const isDuplicate = findDuplicates(board, row, col);
    return isDuplicate ? "text-red-600" : "text-blue-600"; // Red for duplicates, Blue for valid inputs
  };

  const displayedBoard = showSolution ? solutionBoard : board;

  // ==========================
  // Render
  // ==========================
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Sudoku</h1>

      {winMessage && (
        <div className="text-green-600 text-xl font-bold mb-6">
          {winMessage}
        </div>
      )}

      {/* Controls */}
      <div className="mb-4 flex gap-2">
        <select
          className="rounded-md border p-2 text-lg shadow"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <Button onClick={generateSudoku}>Generate</Button>

        <Button onClick={() => setShowSolution((prev) => !prev)}>
          {showSolution ? "Hide Solution" : "Show Solution"}
        </Button>
      </div>

      {/* Sudoku Grid */}
      <div className="grid grid-cols-9">
        {displayedBoard.map((row, rowIndex) =>
          row.map((num, colIndex) => {
            const isOriginal = originalBoard[rowIndex][colIndex] !== 0;
            return (
              <Card
                key={`${rowIndex}-${colIndex}`}
                className={`${getBorderClasses(rowIndex, colIndex)} bg-white`}
              >
                {isOriginal ? (
                  <span className={"text-gray-800 text-xl font-bold"}>{num}</span> // Show original puzzle numbers
                ) : (
                  <input
                    type="text"
                    maxLength={1}
                    className={`w-full h-full text-center text-xl font-bold focus:outline-none ${getTextColor(
                      rowIndex,
                      colIndex
                    )}`}
                    value={num !== 0 ? num : ""}
                    onChange={(e) =>
                      handleInputChange(rowIndex, colIndex, e.target.value)
                    }
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
