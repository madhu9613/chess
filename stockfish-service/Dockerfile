FROM node:22-slim

# Install Stockfish and create a symlink so it's in PATH
RUN apt-get update && apt-get install -y stockfish && \
    ln -s /usr/games/stockfish /usr/local/bin/stockfish && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Stockfish is now in PATH (via /usr/local/bin)
ENV STOCKFISH_PATH=stockfish

EXPOSE 3001

CMD ["node", "index.js"]