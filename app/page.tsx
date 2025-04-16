"use client";

import { useState, useCallback, useEffect } from "react";
import { HTMLAttributes, ButtonHTMLAttributes, forwardRef } from "react";
import jsPDF from "jspdf";

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

  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === value) return true;
    if (i !== row && board[i][col] === value) return true;
  }

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [numberOfSudokus, setNumberOfSudokus] = useState(6);

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

  const generateMultipleSudokus = (count: number) => {
    const sudokus = [];
    for (let i = 0; i < count; i++) {
      const fullBoard = generateEmptyBoard();
      fillBoard(fullBoard);
      const puzzle = structuredClone(fullBoard);
      removeNumbers(puzzle, difficulties[difficulty]);
      sudokus.push({ puzzle, solution: fullBoard });
    }
    return sudokus;
  };

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

  const handleDownloadPDF = useCallback(async () => {
    setIsGeneratingPDF(true);
    const doc = new jsPDF("p", "mm", "a4");
    const sudokus = generateMultipleSudokus(numberOfSudokus);
    const cellSize = 9.2;
    const margin = { x: 20, y: 20 };
    const spacing = 5;
    const puzzlesPerRow = 2;
    const gridSize = 9 * cellSize;
    const pageHeight = 297;

    const drawSudokuGrid = (
      doc: jsPDF,
      board: number[][],
      x: number,
      y: number
    ) => {
      // Draw grid lines
      for (let col = 0; col <= 9; col++) {
        const xPos = x + col * cellSize;
        doc.setLineWidth(col % 3 === 0 ? 0.5 : 0.2);
        doc.line(xPos, y, xPos, y + 9 * cellSize);
      }
      for (let row = 0; row <= 9; row++) {
        const yPos = y + row * cellSize;
        doc.setLineWidth(row % 3 === 0 ? 0.5 : 0.2);
        doc.line(x, yPos, x + 9 * cellSize, yPos);
      }

      // Add numbers
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          const num = board[i][j];
          if (num !== 0) {
            const xPos = x + j * cellSize + cellSize / 2;
            const yPos = y + (i + 0.685) * cellSize;
            doc.text(num.toString(), xPos, yPos, { align: "center" });
          }
        }
      }
    };

    // Draw Puzzles
    let currentPage = 0;
    let currentY = margin.y;
    doc.setFontSize(14);
    doc.text(`Sudoku Puzzles - ${difficulty}`, margin.x, 15);

    sudokus.forEach((sudoku, index) => {
      if (currentY + gridSize > pageHeight - 15) {
        doc.addPage();
        currentPage++;
        currentY = margin.y;
        doc.text(`Sudoku Puzzles - ${difficulty}`, margin.x, 15);
      }

      const col = index % puzzlesPerRow;
      const x = margin.x + col * (gridSize + spacing);
      drawSudokuGrid(doc, sudoku.puzzle, x, currentY);
      doc.rect(x, currentY, gridSize, gridSize);

      if ((index + 1) % puzzlesPerRow === 0) {
        currentY += gridSize + spacing;
      }
    });

    // Draw Solutions
    doc.addPage();
    currentY = margin.y;
    doc.text(`Sudoku Solutions - ${difficulty}`, margin.x, 15);

    sudokus.forEach((sudoku, index) => {
      if (currentY + gridSize > pageHeight - 15) {
        doc.addPage();
        currentY = margin.y;
        doc.text(`Sudoku Solutions - ${difficulty}`, margin.x, 15);
      }

      const col = index % puzzlesPerRow;
      const x = margin.x + col * (gridSize + spacing);
      drawSudokuGrid(doc, sudoku.solution, x, currentY);
      doc.rect(x, currentY, gridSize, gridSize);

      if ((index + 1) % puzzlesPerRow === 0) {
        currentY += gridSize + spacing;
      }
    });

    doc.save(`sudoku-${numberOfSudokus}-pack-${difficulty}.pdf`); // Update filename
    setIsGeneratingPDF(false);
  }, [difficulty, numberOfSudokus]);

  const displayedBoard = showSolution ? solutionBoard : board;

  useEffect(() => {
    generateSudoku();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Sudoku</h1>
      <p className="mb-5">
        Click <strong>"New Game"</strong> to start playing.
      </p>

      {winMessage && (
        <div className="text-green-600 text-xl font-bold mb-6">
          {winMessage}
        </div>
      )}

      <div className="mb-4 grid gap-2 flex-wrap justify-center">
        <div className="flex gap-1 items-center">
          <h3 className="font-bold text-lg">Difficulty</h3>
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
        </div>

        <div className="flex gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">Number of Puzzles</h3>
            <input
              type="number"
              min="1"
              max="1000"
              value={numberOfSudokus}
              onChange={(e) =>
                setNumberOfSudokus(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="rounded-md border p-1 text-lg shadow w-20"
              disabled={isGeneratingPDF}
            />
          </div>
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="whitespace-nowrap"
          >
            {isGeneratingPDF
              ? "Generating PDF..."
              : `Download ${numberOfSudokus} Puzzle${
                  numberOfSudokus > 1 ? "s" : ""
                }`}
          </Button>
        </div>

        <div className="flex gap-1">
          <Button onClick={() => setShowSolution((prev) => !prev)}>
            {showSolution ? "Hide All Solutions" : "Show All Solutions"}
          </Button>
          <Button
            onClick={handleShowSelectedSolution}
            disabled={!selectedCell}
            className={!selectedCell ? "opacity-50 cursor-not-allowed" : ""}
          >
            Reveal Selected Cell
          </Button>
          <Button title="Display the number in red if there's an error." onClick={() => setActiveHelp((prev) => !prev)}>
            {activeHelp ? "Turn Off Help" : "Turn On Help"}
          </Button>
        </div>
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
    </main>
  );
}
