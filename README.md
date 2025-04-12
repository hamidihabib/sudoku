# Sudoku Web App

A simple and interactive **Sudoku** web application built with **Next.js** and **TypeScript**. Play Sudoku puzzles of different difficulty levels, check for mistakes, and reveal solutions.

---

## Features

- 🔍 **Dynamic Sudoku generation** based on selected difficulty
- ✅ **Win detection** when Sudoku is solved correctly
- ⚠️ **Duplicate detection** (highlight mistakes in red)
- 🔒 **Show/Hide Solution** toggle
- ✨ **Responsive and clean UI** with TailwindCSS

---

## How It Works

1. **Select a Difficulty:** Choose between Easy, Medium, or Hard.
2. **Generate Puzzle:** Click the **Generate** button to create a new Sudoku puzzle.
3. **Fill the Board:** Type numbers (1-9) into the empty cells.
4. **Check Mistakes:** Incorrect entries will automatically highlight in **red**.
5. **Win Message:** Solve the puzzle completely and correctly to see a victory message.
6. **Show Solution:** Toggle to view or hide the complete solution.

---

## Tech Stack

- **Next.js** with `use client` for client-side interactivity
- **TypeScript** for strong typing
- **TailwindCSS** for styling
- **React Hooks** like `useState` for state management

---

## Project Structure


## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/hamidihabib/sudoku.git
cd sudoku-app

# Install dependencies
npm install
# or
yarn install

# Run the development server
npm run dev
# or
yarn dev

# Open http://localhost:3000 in your browser
