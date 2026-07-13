# Project Architecture Guide

## 1) Scope
This document explains architecture, technology choices, and runtime flows for these three modules:
- server
- frontend2
- chess-engine

The repository also contains other folders (for example Backend and frontend), but this guide focuses on the currently integrated stack used by server + frontend2 + chess-engine.

## 2) High-Level Topology
- frontend2 is a React SPA (Vite) with Redux for game state.
- server is an Express + Socket.IO + MongoDB backend.
- chess-engine is a reusable chess rules engine package consumed by both frontend2 and server.
- Stockfish runs server-side via the stockfish npm package and is exposed through HTTP and Socket.IO flows.

Main direction of data:
- Local mode: frontend2 UI -> Redux -> chess-engine
- Multiplayer mode: frontend2 UI -> Socket.IO -> server -> chess-engine validation -> MongoDB -> Socket.IO broadcast -> frontend2 sync
- Practice mode vs AI: frontend2 -> Socket.IO requestAIMove -> server Stockfish pipeline -> frontend2 apply move
- Analysis mode: frontend2 -> HTTP /api/ai/analyze -> server Stockfish pipeline -> frontend2 render evaluation

## 3) Technology Stack

### frontend2
- React 19, React Router 7
- Redux Toolkit + React Redux
- Socket.IO client 4
- Tailwind CSS 4
- Framer Motion + lucide-react
- Vite 8
- Shared chess logic dependency: @mady9613/chess-engine

Defined in frontend2/package.json.

### server
- Node.js ESM
- Express 5
- Socket.IO 4
- Mongoose (MongoDB)
- stockfish npm package
- ioredis
- BullMQ
- dotenv, cors
- Shared chess logic dependency: @mady9613/chess-engine

Defined in server/package.json.

### chess-engine
- Pure ESM JS library
- Exposes ChessGame class + validators + piece move generators + utility helpers
- Packaged as @mady9613/chess-engine

Defined in chess-engine/package.json and chess-engine/src/index.js.

## 4) Module Layout and Responsibilities

### server module
- Entry and wiring: server/index.js
- Socket game orchestration: server/sockets/gameHandler.js
- Redis connection and shared client: server/config/redis.js
- Notification queue and worker: server/queues/notificationQueue.js
- AI service wrappers (Stockfish): server/utils/socketfish.js
- Move validation wrapper: server/utils/chessValidator.js
- Auth token and password utilities: server/utils/auth.js
- FFN formatter: server/utils/ffn.js
- REST routes:
  - server/routes/auth.js
  - server/routes/games.js
  - server/routes/rooms.js
  - server/routes/ai.js
- Persistence models:
  - server/models/User.js
  - server/models/Room.js
  - server/models/Game.js
- DB bootstrap: server/config/db.js

### frontend2 module
- App bootstrap: frontend2/src/main.jsx
- Router shell: frontend2/src/App.jsx
- Auth state/provider: frontend2/src/context/AuthContext.jsx
- Socket singleton: frontend2/src/socket/socket.js
- Redux store and game slice:
  - frontend2/src/store/store.js
  - frontend2/src/store/gameSlice.js
- Pages:
  - Auth: frontend2/src/pages/AuthPage.jsx, frontend2/src/pages/AuthCallback.jsx
  - Local play: frontend2/src/pages/LocalPlay.jsx
  - Practice AI: frontend2/src/pages/Practice.jsx
  - Multiplayer: frontend2/src/pages/Multiplayer.jsx
  - Watch live: frontend2/src/pages/WatchLive.jsx
  - Analysis: frontend2/src/pages/Analysis.jsx
- Board interaction layer:
  - frontend2/src/components/Board/Board.jsx
  - frontend2/src/components/Pieces/Pieces.jsx
  - frontend2/src/components/LiveChat.jsx

### chess-engine module
- Public exports: chess-engine/src/index.js
- Core game class: chess-engine/src/core/ChessGame.js
- Move execution primitive: chess-engine/src/core/executeMove.js
- Validation path: chess-engine/src/validators/isMoveLegal.js and validator index files
- Piece movement rules: chess-engine/src/pieces/*
- FEN, SAN, board and attack utilities: chess-engine/src/utils/*

## 5) Server Architecture Details

### 5.1 Server bootstrap and middleware
In server/index.js:
- Creates Express app and HTTP server
- Attaches Socket.IO server with CORS enabled
- Connects MongoDB via connectDB()
- Registers REST routes under /api/*
- Adds centralized Express error middleware
- Adds Socket.IO auth middleware:
  - Reads token from socket.handshake.auth.token
  - Verifies via verifyAuthToken
  - Attaches socket.data.authUser if valid
- On each socket connection, delegates handlers to gameHandler(io, socket)
- Starts BullMQ notification worker with startNotificationWorker(io)

### 5.2 REST API surface
Auth routes in server/routes/auth.js:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me (requires token)
- POST /api/auth/logout
- GET /api/auth/google/start
- GET /api/auth/google/callback

Game archive routes in server/routes/games.js:
- GET /api/games/recent
- GET /api/games/room/:roomCode
- GET /api/games/user/:userId

Room snapshot routes in server/routes/rooms.js:
- GET /api/rooms/active
- GET /api/rooms/:roomCode
- GET /api/rooms/:roomCode/moves

AI routes in server/routes/ai.js:
- POST /api/ai/move
- POST /api/ai/analyze

### 5.3 Socket.IO event architecture
Implemented in server/sockets/gameHandler.js.

Primary inbound events from clients:
- createRoom
- joinRoom
- watchRoom
- getRoomState
- sendChatMessage
- makeMove
- requestAIMove
- findMatch
- cancelMatchmaking

Primary outbound events to clients:
- roomCreated
- joinedRoom
- opponentJoined
- gameStart
- moveMade
- gameOver
- opponentDisconnected
- watchRoomJoined
- spectatorJoined
- roomPresenceUpdated
- chatMessage
- matchmakingQueued
- matchmakingCanceled
- matchFound
- gameClockUpdated
- notification (emitted by BullMQ worker)

Key design behavior:
- Authenticated users can create/join and make moves.
- Spectators can watch with guest identity support.
- Guest chat limits are persisted per room (guestChatCounts).
- Room presence is computed with io.in(roomCode).fetchSockets().
- Every important room change updates Room and upserts Game archive doc.
- Matchmaking queues are Redis-backed (shared across server instances).
- Player notification jobs are enqueued via BullMQ and emitted asynchronously.

### 5.7 Shared matchmaking and notifications (Redis + BullMQ)
- Matchmaking queue keys in Redis are scoped by time control (for example, 5+0 and 15+0).
- Server stores temporary matchmaking entry + mode per socket in Redis and removes them on match, cancel, or disconnect.
- This removes in-memory queue coupling and enables horizontally scaled socket workers to share one matchmaking pool.

Notification architecture:
- Producer: socket handlers enqueue jobs using enqueueNotification(type, payload).
- Queue: notifications queue in BullMQ backed by Redis.
- Consumer: worker started in server bootstrap emits Socket.IO notification event to payload.socketId.

Current notification types:
- matchmaking_queued
- match_found
- game_result

Notification trigger points:
- matchmaking_queued: player is added to waiting queue.
- match_found: two players are paired and room is created.
- game_result: match ends by checkmate, stalemate, resignation, timeout, or disconnect.

### 5.4 Persistence model strategy
Room model (server/models/Room.js):
- Operational real-time state
- Includes players with socketId, currentFen, turn, status, moveHistory
- Includes recent chat and guest rate-limit counters

Game model (server/models/Game.js):
- Historical snapshot archive
- Includes players, start/current fen, full move history, ffn, moveCount, result metadata
- Updated on room lifecycle through upsertGameDocument in socket handlers

User model (server/models/User.js):
- Local and Google identity fields
- Stores passwordSalt/passwordHash for local auth

### 5.5 Move validation boundary
- Server validates incoming multiplayer moves with validateMove in server/utils/chessValidator.js.
- validateMove loads FEN into ChessGame, checks turn, then applies move.
- Response includes authoritative next FEN, SAN, and tactical flags.

This keeps multiplayer state server-authoritative.

### 5.6 Stockfish service boundary
Implemented in server/utils/socketfish.js:
- Singleton Stockfish engine initialization
- Difficulty levels map to skill/depth settings
- Queueing with searchQueue to serialize engine searches
- collectSearch captures info/bestmove lines and transforms to structured data
- chooseAIMove returns one move plus compact analysis
- analyzePosition returns MultiPV lines and notes

Used by:
- HTTP analysis routes (/api/ai/*)
- Socket event requestAIMove in gameHandler

## 6) frontend2 Architecture Details

### 6.1 App composition and providers
In frontend2/src/main.jsx:
- Redux Provider wraps entire app
- AuthProvider wraps app and syncs auth token into socket auth payload

In frontend2/src/App.jsx:
- Public auth routes: /auth, /auth/callback
- Main app routes rendered through Layout wrapper:
  - /
  - /local
  - /practice
  - /analysis
  - /multiplayer
  - /watch

### 6.2 State architecture
In frontend2/src/store/gameSlice.js:
- Stores a live ChessGame instance inside Redux state (non-serializable by design)
- UI state: selected square, candidate moves, checkmate animation
- Multiplayer state: roomId, playerColor, opponent flags, turn ownership
- Settings state: board options

In frontend2/src/store/store.js:
- Serializable check is configured to ignore ChessGame paths and related actions

### 6.3 Socket client architecture
In frontend2/src/socket/socket.js:
- Single io client instance
- Auto-reconnect enabled
- Connection lifecycle logs

AuthContext updates socket auth and reconnects when token changes.

### 6.6 Notification UI architecture
In frontend2/src/components/NotificationToaster.jsx:
- Listens to notification socket event globally.
- Renders animated toast stack with type-aware visual styling.
- Supports auto-dismiss and manual dismiss.
- For toasts with roomCode, click action navigates to /multiplayer with notification context.

In frontend2/src/pages/Multiplayer.jsx:
- Consumes notification navigation state.
- Pre-fills room input with notified room code.
- Attempts immediate room state sync using getRoomState.
- Clears handled navigation state to prevent duplicate handling.

### 6.4 Board interaction architecture
In frontend2/src/components/Pieces/Pieces.jsx:
- Handles click/drag/drop interactions
- Local and multiplayer selection rules
- Promotion modal flow
- For multiplayer, emits makeMove and waits for server acceptance
- For local/practice, dispatches local makeMove reducer

This component is the move-dispatch boundary from UI to state/transport.

### 6.5 Chat architecture
In frontend2/src/components/LiveChat.jsx:
- Emits sendChatMessage with roomCode + message + identity metadata
- Listens for chatMessage and roomPresenceUpdated
- Applies guest send limits exposed by server callback

## 7) chess-engine Architecture Details

### 7.1 Public API layer
chess-engine/src/index.js exports:
- ChessGame class
- Validators (getValidMoves, getAllLegalMoves, isMoveLegal, etc.)
- Piece move generators
- Utility helpers for board/notation/FEN
- Core executeMove helpers

### 7.2 Core game state machine
In chess-engine/src/core/ChessGame.js, ChessGame owns:
- Board representation
- Turn
- Castling rights
- En passant target
- Half/full move counters
- Move history and history index
- Game-over, winner, result state
- King positions cache

Main mutation path:
- Parse move input
- Compute legal moves for current turn
- Match intended move
- Execute with executeMove
- Update counters/turn/castling/en-passant
- Compute SAN/check/checkmate status
- Save snapshot history and update terminal state

### 7.3 Move execution primitive
In chess-engine/src/core/executeMove.js:
- Applies normal moves, castling, en passant, promotions
- Updates castling rights when king/rook moves or rooks are captured
- Returns normalized output shape with newBoard/newCastlingRights/enPassantTarget/capturedPiece

### 7.4 Validation semantics
In chess-engine/src/validators/isMoveLegal.js:
- Generates piece-legal moves
- Optionally simulates board and rejects king-in-check outcomes when castlingRights context is provided

## 8) End-to-End Flows

### 8.1 Local play flow
1. User interacts with board squares in frontend2.
2. Pieces component dispatches makeMove directly to Redux slice.
3. gameSlice applies move through ChessGame instance.
4. Board and move list re-render from selectors.

No server dependency.

### 8.2 Practice vs AI flow
1. User makes a white move locally.
2. Practice page watches game state turn change to black.
3. Practice emits requestAIMove over Socket.IO with current fen and selected level.
4. Server gameHandler requestAIMove calls chooseAIMove from Stockfish pipeline.
5. Server acks callback with success + move + analysis.
6. Frontend applies AI move via makeMove and updates status.

Current implementation includes explicit client/server logs for request and response tracing.

### 8.3 Multiplayer create/join/play flow
1. Authenticated player creates room via createRoom.
2. Server creates Room document, assigns white, emits roomCreated.
3. Opponent joins with joinRoom, server assigns black and emits gameStart.
4. Player move emits makeMove to server.
5. Server validates move against authoritative FEN via chess-engine.
6. Server persists room + game snapshot and broadcasts moveMade.
7. Clients sync board from server payload.
8. If checkmate/stalemate/disconnect, server emits gameOver.

### 8.4 Multiplayer matchmaking flow (Redis-backed)
1. Player emits findMatch with selected time control.
2. Server removes stale matchmaking state for that socket from Redis.
3. Server attempts to pop an opponent from Redis list for same mode.
4. If no opponent exists:
  - Server stores matchmaking entry with TTL and pushes socketId into Redis list.
  - Server emits matchmakingQueued and enqueues matchmaking_queued notification.
5. If opponent exists:
  - Server creates room, joins both players, starts clock.
  - Server emits roomCreated/joinedRoom/gameStart/matchFound.
  - Server enqueues match_found notifications for both players.

Cancel/disconnect path:
- cancelMatchmaking removes Redis queue state and emits matchmakingCanceled.
- disconnect also removes Redis queue state to prevent stale queue entries.

### 8.5 Watch live spectator flow
1. Guest or user selects active room on /watch.
2. Frontend emits watchRoom with roomCode and identity.
3. Server joins socket to room as spectator role and emits watchRoomJoined.
4. Frontend syncs board and chat via getRoomState and live events.
5. Presence updates broadcast with roomPresenceUpdated.
6. Guest chat is allowed up to configured limit; server tracks count per guest per room.

### 8.6 Analysis flow
1. User chooses a recent game or imports a FEN on /analysis.
2. Frontend requests POST /api/ai/analyze.
3. Server runs analyzePosition via Stockfish + chess-engine legal move count.
4. Frontend renders evaluation label, score, top lines, notes.

### 8.7 Auth flow (email/password)
1. AuthPage sends /api/auth/register or /api/auth/login.
2. Server hashes/verifies with PBKDF2 and issues HMAC-based token.
3. Frontend stores token in localStorage via AuthContext.
4. AuthContext syncs token to socket auth and reconnects socket.
5. Protected player actions use token-backed socket identity.

### 8.8 Google OAuth flow
1. Frontend starts /api/auth/google/start with returnTo.
2. Server sets oauth_state cookie and redirects to Google.
3. Google redirects to /api/auth/google/callback.
4. Server verifies state, exchanges code, fetches profile, upserts user.
5. Server issues token and redirects to frontend /auth/callback.
6. AuthCallback stores token and navigates to return path.

### 8.9 Notification-to-UI flow
1. Socket handler enqueues notification job to BullMQ.
2. Worker consumes job and emits notification event to target socketId.
3. NotificationToaster receives event and renders toast.
4. User clicks actionable toast (roomCode present).
5. App navigates to /multiplayer with notification context.
6. Multiplayer page syncs room state and displays latest board/clock/chat.

### 8.10 Disconnect and recovery flow
- Socket disconnection triggers cleanup in gameHandler:
  - spectator presence update
  - player removal and possible game completion by disconnect
- Frontend multiplayer page can resync state via getRoomState and server room snapshots.

## 9) Data Contracts Summary

### 9.1 Move object
Common move payload shape used across layers:
- from: square algebraic (example e2)
- to: square algebraic (example e4)
- promotion: optional single-char piece code

### 9.2 Room game status domain
- waiting
- playing
- completed
- abandoned (Game archive only)

### 9.3 Color and result domain
- turn/color: w or b
- winner: w, b, or draw

## 10) Configuration and Environment

### frontend2 expected env variables
- VITE_API_URL (default http://localhost:5000)
- VITE_SOCKET_URL (default http://localhost:5000)

### server expected env variables
- PORT (default 5000)
- MONGO_URI
- REDIS_URL (default redis://127.0.0.1:6379)
- AUTH_SECRET
- AUTH_TOKEN_TTL_SECONDS
- FRONTEND_URL
- API_BASE_URL
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI

### Local infrastructure
- Root docker compose file provides Redis service for local development.
- Start command from repository root: docker compose up -d redis
- Default server Redis connection works with mapped local port 6379.

## 11) Operational Notes
- Multiplayer state is server-authoritative; clients should treat server moveMade payload as source of truth.
- AI analysis and move generation are serialized through one Stockfish queue to avoid engine contention.
- Room documents serve real-time operations, while Game documents serve historical querying.
- frontend2 intentionally stores a non-serializable ChessGame instance in Redux for performant chess-state operations.
- Matchmaking queue state survives across server restarts as long as Redis is retained.
- Notification delivery is best-effort to active socketId targets.

## 12) Suggested Next Documentation Additions
- API OpenAPI spec for REST routes.
- Socket event schema table with required and optional fields.
- Sequence diagrams for multiplayer and practice flows.
- Deployment topology and scaling notes (separate socket and API workers, Redis adapter, etc.).
- Notification persistence and unread-center design if offline delivery is required.
