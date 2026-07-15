# ♟️ GRANDMASTER ARCAD


<p align="center">

<img src="docs/images/logo.png" width="120"/>

</p>


<h3 align="center">
A scalable real-time multiplayer chess platform with custom chess engine, matchmaking, and Stockfish AI microservice.
</h3>


<p align="center">

Built with modern full-stack technologies and service-oriented architecture.

</p>



## 🚀 Live Demo


| Service | Link |
|---|---|
| 🌐 Frontend | https://chess-chi-wine.vercel.app/ |
| ⚙️ Backend API | https://chess-server-4657.onrender.com |
| 🤖 Stockfish Service | https://chess-i2kg.onrender.com |


---

# 🛠️ Tech Stack


<p align="center">

<img src="https://skillicons.dev/icons?i=react,vite,tailwind,nodejs,express,mongodb,redis,docker,js,linux" />

</p>


### Frontend

- React 19
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Socket.IO Client


### Backend

- Node.js
- Express.js
- Socket.IO
- MongoDB
- Mongoose
- Redis
- BullMQ


### AI Service

- Node.js Socket Server
- Native Stockfish Binary
- Worker Pool Architecture


### Custom Engine

- JavaScript Chess Engine
- Published package:

```
@mady9613/chess-engine
```


---

# 📸 Screenshots


<img width="1907" height="866" alt="homepage" src="https://github.com/user-attachments/assets/81d5a7f5-2ccd-4489-b9b0-8d7fec06eba4" />
## Multiplayer Game
<img width="1918" height="1022" alt="multiplayer1" src="https://github.com/user-attachments/assets/8325180f-f37d-420a-8975-1e77e7faedb3" />





## AI Practice Mode
<img width="1917" height="862" alt="practceVSai" src="https://github.com/user-attachments/assets/203353cd-9af0-4ae0-a421-3d64a2a67e02" />


## Game Analysis
<p align="center">

<img width="575" height="837" alt="image" src="https://github.com/user-attachments/assets/1b3be7c5-c14d-46f6-a5c1-9e0aa4b984a4" />

<img width="542" height="523" alt="image" src="https://github.com/user-attachments/assets/9a867411-f22a-4bc0-af0d-827f44525161" />

</p?



## Matchmaking

<img width="1907" height="928" alt="matchfound" src="https://github.com/user-attachments/assets/7f0d7b20-f708-4200-b7c5-7ef6270541fc" />

## guest watch mode:

<img width="1882" height="907" alt="guestmode_watch_ongoing_games" src="https://github.com/user-attachments/assets/37901925-48bb-4a3e-97dd-bd8793402aab" />

## Live chat:
<img width="456" height="581" alt="live chat feature" src="https://github.com/user-attachments/assets/4104bc45-2522-4577-9a25-0b7f13a972ce" />




---

# ✨ Features


## ♟️ Chess Gameplay

- Real-time multiplayer chess
- Private rooms
- Matchmaking
- Spectator mode
- Live chat
- Game clock
- Move history
- Game replay support


## 🤖 AI Features

- Play against Stockfish
- Multiple difficulty levels
- Position analysis
- Best move suggestions
- Evaluation lines


## 🔐 Authentication

- Email/password authentication
- Google OAuth
- Protected multiplayer actions


## ⚡ Infrastructure

- Redis powered matchmaking
- BullMQ background jobs
- MongoDB persistence
- Socket.IO realtime communication
- Separate AI computation service



---

# 🏗️ Architecture


![Architecture](docs/images/architecture.png)



```mermaid
flowchart TB

subgraph Client

UI[React Frontend<br/>Redux + Socket.IO]

end



subgraph Backend["Chess Server"]

API[Express API]

SOCKET[Socket.IO Gateway]

ENGINE[Chess Engine<br/>@mady9613/chess-engine]

VALIDATOR[Move Validator]

end



subgraph AI["Stockfish Service"]

AISOCKET[Socket Server]


subgraph Workers["Worker Pool"]

W1[Worker 1<br/>Stockfish Binary]

W2[Worker 2<br/>Stockfish Binary]

end

end



MONGO[(MongoDB)]

REDIS[(Redis)]

QUEUE[BullMQ Queue]



UI --> API

UI --> SOCKET


SOCKET --> VALIDATOR

VALIDATOR --> ENGINE


API --> MONGO

SOCKET --> MONGO


SOCKET --> REDIS


SOCKET --> QUEUE


SOCKET -->|AI Request| AISOCKET


AISOCKET --> W1

AISOCKET --> W2


W1 --> AISOCKET

W2 --> AISOCKET


AISOCKET --> SOCKET

SOCKET --> UI

```



---

# 📂 Project Structure


```
Chess Platform

│
├── frontend2
│
├── server
│
├── chess-engine
│
└── stockfish-service

```



---

# 🎨 Frontend Service


## frontend2


Responsible for:

- Chess board UI
- User interaction
- Local gameplay
- Multiplayer synchronization
- AI mode
- Analysis interface



Architecture:


```
React

 |

Redux Store

 |

ChessGame Instance

 |

Socket.IO Client

```



---

# ⚙️ Backend Service


## server


Responsible for:


- Authentication
- Room management
- Matchmaking
- Socket events
- Move validation
- Game persistence
- AI communication



Structure:


```
server/

├── index.js

├── routes/

├── sockets/

├── models/

├── utils/

└── queues/

```



---

# ♟️ Chess Engine


The custom chess engine provides:


- Legal move generation
- Move validation
- Check detection
- Checkmate detection
- Castling
- En-passant
- Promotion
- FEN support
- SAN generation



Used by:


```
Frontend
    |
Chess Engine


Backend
    |
Chess Engine Validation

```



---

# 🤖 Stockfish AI Service


Stockfish is isolated into a separate service because the engine is CPU and memory intensive.


Old:


```
Server

 |

Stockfish

```


New:


```
Server

 |

Socket Connection

 |

Stockfish Service

 |

Worker Pool

 |

Native Stockfish Binary

```



## Worker Architecture


```
Stockfish Service


        Socket Server


              |


       ----------------

       |              |

   Worker 1       Worker 2

       |              |

 Stockfish      Stockfish

 Binary         Binary

```



Benefits:


- Independent scaling
- Lower backend memory usage
- Multiple concurrent AI searches
- Better deployment flexibility



---

# 🔥 Request Flow


```mermaid
sequenceDiagram


participant Client

participant Server

participant Stockfish

participant Worker



Client->>Server: requestAIMove


Server->>Stockfish: AI Request


Stockfish->>Worker: Search Position


Worker->>Worker: Run Native Binary


Worker-->>Stockfish: Best Move


Stockfish-->>Server: Evaluation


Server-->>Client: Move Response

```



---

# 🌐 Multiplayer Flow


```mermaid
sequenceDiagram


participant White

participant Server

participant Engine

participant Black



White->>Server: makeMove


Server->>Engine: Validate Move


Engine-->>Server: Valid Move


Server->>Server: Update Room State


Server-->>Black: moveMade

```



---

# 💾 Database Design


## MongoDB


### User

Stores:

- Profile
- Authentication
- OAuth information


### Room

Active game state:


```
Room

 ├── Players

 ├── Current FEN

 ├── Turn

 ├── Move History

 └── Status

```



### Game


Historical archive:


```
Game

 ├── Players

 ├── Moves

 ├── Result

 └── Metadata

```



---

# 🚀 Deployment Architecture


![Deployment](docs/images/deployment.png)



```mermaid
flowchart LR


USER[Users]


FRONTEND[Frontend Deployment]


SERVER[Backend Server]


STOCK[Stockfish Service]


DB[(MongoDB)]


REDIS[(Redis)]



USER --> FRONTEND


FRONTEND --> SERVER


SERVER --> DB


SERVER --> REDIS


SERVER --> STOCK


STOCK --> Worker1[Stockfish Worker 1]


STOCK --> Worker2[Stockfish Worker 2]

```



---

# ⚙️ Environment Variables


## Frontend


```env

VITE_API_URL=

VITE_SOCKET_URL=

```



## Backend


```env

PORT=

MONGO_URI=

REDIS_URL=

AUTH_SECRET=

STOCKFISH_SERVICE_URL=

```



## Stockfish Service


```env

PORT=

WORKER_COUNT=2

STOCKFISH_PATH=

```



---

# 🛠️ Local Development


Start Redis:


```bash
docker compose up -d redis
```



Start Stockfish:


```bash
cd stockfish-service

npm install

npm run start
```



Start Backend:


```bash
cd server

npm install

npm run dev
```



Start Frontend:


```bash
cd frontend2

npm install

npm run dev
```



---




---

# 👨‍💻 Author


**Madhujya Rajkhowa**

B.Tech Artificial Intelligence & Machine Learning

NIT Kurukshetra
