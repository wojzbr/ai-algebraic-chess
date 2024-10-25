# CHANGELOG.md

## 2024-08-19

The console interface has been removed and substituted with in-app chat-like interface. Chess algebraic notation expected.

<img width="971" alt="Screenshot 2024-10-25 at 13 01 07" src="https://github.com/user-attachments/assets/7ea7eae5-470b-4293-aad0-48a076a095db">

## 2024-08-13

Currently, the interface to interact with the chessboard is exposed in browser console and it includes the following fields:
- pieces
and methods:
- makeMove(piece, newPosition)
- capturePiece(piece)
- validateMove(piece, newPosition)

Consider the following example:
```
let whitePawn = pieces[11]
let blackPawn = pieces[19]
makeMove(whitePawn, [3,3])
makeMove(blackPawn, [3,4])
```

<img width="868" alt="Screenshot 2024-08-07 at 17 03 18" src="https://github.com/user-attachments/assets/dec90721-8dfb-4292-97ad-114a6014be66">
