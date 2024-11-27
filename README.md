# AI algebraic chess

## Overview

The project's aim is to build a chess game that's based on [chess algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) under the hood. The typical drag'n'drop interface layer will be added as well, but the end goal is to connect the project to openAI, having ChatGPT as your opponent - algebraic notation is an effective way to achieve that.

<img width="971" alt="Screenshot 2024-10-25 at 13 01 07" src="https://github.com/user-attachments/assets/7ea7eae5-470b-4293-aad0-48a076a095db">

## Testing live

The app is made available on Vercel under https://ai-algebraic-chess.vercel.app/
It requires configuring the app with an OpenAI API key which can be generated in your OpenAI account [here](https://platform.openai.com/api-keys). The API key is only stored locally in your browser's localStorage - it's not sored or logged by the app.

## Running locally

Use 'npm install' followed by 'npm start' and expect the app on your http://localhost:3000
