# AI algebraic chess

## Overview

The project's aim is to build a chess game that's based on [chess algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) under the hood. The typical drag'n'drop interface layer will be added as well, but the end goal is to connect the project to openAI, having ChatGPT as your opponent - algebraic notation is an effective way to achieve that.

Currently, the interface to interact with the chessboard is exposed in browser console and it includes the following fields:
- pieces
and methods:
- movePiece(piece, newPosition)
- capturePiece(piece)
- validateMove(piece, newPosition)

<img width="868" alt="Screenshot 2024-08-07 at 17 03 18" src="https://github.com/user-attachments/assets/dec90721-8dfb-4292-97ad-114a6014be66">

## Running locally

The app is available publicly thanks to GitHub Pages - feel free to play with it under https://wojzbr.github.io/ai-algebraic-chess/

## Testing live

Use 'npm install' followed by 'npm start' and expect the app on your http://localhost:3000
