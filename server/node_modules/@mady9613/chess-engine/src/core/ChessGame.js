// src/core/ChessGame.js

import { getInitialBoardPosition, FENToBoard, boardToFEN } from '../utils/index.js';
import { getAllLegalMoves } from '../validators/index.js';
import { executeMove } from './executeMove.js';
import { isSquareAttacked } from '../utils/attackUtils.js';

export class ChessGame {
    constructor(initialState = null) {
        this._board = null;
        this._turn = 'w';
        this._castlingRights = {
            w: { kingSide: true, queenSide: true },
            b: { kingSide: true, queenSide: true }
        };
        this._enPassantTarget = null;
        this._halfMoves = 0;
        this._fullMoves = 1;
        this._moveHistory = [];
        this._historyIndex = -1;
        this._initialState = null;
        this._gameOver = false;
        this._winner = null;
        this._result = null;

        this._kingPos = {
            w: { row: 7, col: 4 },
            b: { row: 0, col: 4 }
        };

        if (initialState) {
            this.loadFEN(initialState);
        } else {
            this.reset();
        }
    }

    reset() {
        this._board = getInitialBoardPosition();
        this._turn = 'w';
        this._castlingRights = {
            w: { kingSide: true, queenSide: true },
            b: { kingSide: true, queenSide: true }
        };
        this._enPassantTarget = null;
        this._halfMoves = 0;
        this._fullMoves = 1;
        this._moveHistory = [];
        this._historyIndex = -1;
        this._initialState = this._createStateSnapshot();
        this._gameOver = false;
        this._winner = null;
        this._result = null;

        this._kingPos = {
            w: { row: 7, col: 4 },
            b: { row: 0, col: 4 }
        };

        return this;
    }

    loadFEN(fen) {
        const { board, turn, castlingRights, enPassantTarget, halfMoves, fullMoves } = FENToBoard(fen);
        this._board = board;
        this._turn = turn;
        this._castlingRights = castlingRights;
        this._enPassantTarget = enPassantTarget;
        this._halfMoves = halfMoves;
        this._fullMoves = fullMoves;
        this._moveHistory = [];
        this._historyIndex = -1;
        this._initialState = this._createStateSnapshot();
        this._gameOver = false;
        this._winner = null;
        this._result = null;

        this._updateKingPositions();
        this._updateGameOverStatus();
        return this;
    }

    loadPGN(pgn) {
        const moves = this._parsePGN(pgn);
        this.reset();
        for (const move of moves) {
            const result = this.move(move);
            if (!result.success) break;
        }
        return this;
    }

    fromJSON(data) {
        this._board = data.board;
        this._turn = data.turn;
        this._castlingRights = data.castlingRights;
        this._enPassantTarget = data.enPassantTarget;
        this._halfMoves = data.halfMoves;
        this._fullMoves = data.fullMoves;
        this._moveHistory = data.moveHistory || [];
        this._historyIndex = data.historyIndex !== undefined ? data.historyIndex : this._moveHistory.length - 1;
        this._initialState = data.initialState || this._createStateSnapshot();
        this._gameOver = data.gameOver || false;
        this._winner = data.winner || null;
        this._result = data.result || null;
        this._kingPos = data.kingPos || { w: { row: 7, col: 4 }, b: { row: 0, col: 4 } };
        return this;
    }

    move(move, promotionPiece = 'q') {
        if (this._gameOver) {
            return { success: false, error: 'Game is already over' };
        }

        const parsedMove = this._parseMoveInput(move, promotionPiece);
        if (!parsedMove) {
            return { success: false, error: 'Invalid move format' };
        }

        // Get all legal moves for current player
        const legalMoves = getAllLegalMoves(
            this._board,
            this._turn,
            this._getLastMove(),
            this._castlingRights
        );

        // Find the specific move
        const legalMove = legalMoves.find(m =>
            m.from.row === parsedMove.from.row &&
            m.from.col === parsedMove.from.col &&
            m.to.row === parsedMove.to.row &&
            m.to.col === parsedMove.to.col
        );

        if (!legalMove) {
            return { success: false, error: 'Illegal move' };
        }

        const piece = this._board[parsedMove.from.row][parsedMove.from.col];

        // Apply promotion if specified
        if (legalMove.promotion) {
            legalMove.promotion = parsedMove.promotion;
        }

        // Execute the move
        const { newBoard, newCastlingRights, enPassantTarget, capturedPiece } = executeMove(
            this._board,
            legalMove,
            piece,
            this._castlingRights
        );

        // Update state
        this._board = newBoard;
        this._castlingRights = newCastlingRights;
        this._enPassantTarget = enPassantTarget;

        // Update king position if king moved
        if (piece[1] === 'k') {
            this._kingPos[this._turn] = { row: parsedMove.to.row, col: parsedMove.to.col };
        }

        // Update half-move counter
        if (piece[1] === 'p' || capturedPiece) {
            this._halfMoves = 0;
        } else {
            this._halfMoves++;
        }

        // Update full-move counter (increments after black moves)
        if (this._turn === 'b') {
            this._fullMoves++;
        }

        // Switch turn
        this._turn = this._turn === 'w' ? 'b' : 'w';

        // Generate SAN for the move
        const san = this._getSANForMove(legalMove, piece, capturedPiece);
        const isCheck = this.isCheck();
        const isCheckmate = this.isCheckmate();
        const finalSan = this._addCheckSymbol(san, isCheck, isCheckmate);

        const moveRecord = {
            from: parsedMove.from,
            to: parsedMove.to,
            piece,
            capturedPiece,
            promotion: legalMove.promotion || null,
            castle: legalMove.castle || null,
            enPassant: legalMove.enPassant || false
        };

        this._saveToHistory(finalSan, moveRecord);

        // Update game over status
        this._updateGameOverStatus();

        return {
            success: true,
            san: finalSan,
            capture: !!capturedPiece,
            check: isCheck,
            checkmate: isCheckmate,
            stalemate: this.isStalemate(),
            piece: piece,
            capturedPiece: capturedPiece,
            from: parsedMove.from,
            to: parsedMove.to,
            promotion: legalMove.promotion || null
        };
    }

    undo() {
        if (this._historyIndex < 0) {
            return false;
        }

        if (this._historyIndex === 0) {
            this._restoreFromState(this._initialState);
            this._historyIndex = -1;
        } else {
            const previousState = this._moveHistory[this._historyIndex - 1];
            this._restoreFromState(previousState);
            this._historyIndex--;
        }

        this._updateGameOverStatus();
        return true;
    }

    redo() {
        if (this._historyIndex + 1 >= this._moveHistory.length) {
            return false;
        }

        this._historyIndex++;
        const nextState = this._moveHistory[this._historyIndex];
        this._restoreFromState(nextState);

        this._updateGameOverStatus();
        return true;
    }

    canUndo() {
        return this._historyIndex >= 0;
    }

    canRedo() {
        return this._historyIndex + 1 < this._moveHistory.length;
    }

    getBoard() {
        return this._board.map(row => [...row]);
    }

    getPieceAt(square) {
        const { row, col } = this._parseSquare(square);
        return this._board[row][col];
    }

    getTurn() {
        return this._turn;
    }

    getMoves() {
        return this._moveHistory.map(state => state.lastMove).filter(m => m);
    }

    getMoveHistory() {
        return this._moveHistory.map((state, index) => ({
            move: state.lastMove,
            fen: state.fen,
            san: state.san,
            turn: state.turn,
            moveNumber: Math.floor(index / 2) + 1
        }));
    }

    getLastMove() {
        return this._getLastMove();
    }

    getMoveCount() {
        return this._moveHistory.length;
    }

    getCurrentPositionIndex() {
        return this._historyIndex + 1;
    }

    getKingPosition() {
        return { ...this._kingPos[this._turn] };
    }

    isGameOver() {
        return this._gameOver;
    }

    isCheck() {
        const kingPos = this._kingPos[this._turn];
        if (!kingPos) return false;

        return isSquareAttacked(
            kingPos,
            this._board,
            this._turn === 'w' ? 'b' : 'w',
            this._getLastMove(),
            this._castlingRights
        );
    }

    isCheckmate() {
        const legalMoves = getAllLegalMoves(
            this._board,
            this._turn,
            this._getLastMove(),
            this._castlingRights
        );
        return this.isCheck() && legalMoves.length === 0;
    }

    isStalemate() {
        const legalMoves = getAllLegalMoves(
            this._board,
            this._turn,
            this._getLastMove(),
            this._castlingRights
        );
        return !this.isCheck() && legalMoves.length === 0;
    }

    isThreefoldRepetition() {
        const positions = new Map();

        const states = [this._initialState, ...this._moveHistory.slice(0, this._historyIndex + 1)]
            .filter(Boolean);

        for (const state of states) {
            const fen = (state.fen || this.getFEN()).split(' ').slice(0, 4).join(' ');
            positions.set(fen, (positions.get(fen) || 0) + 1);
        }

        return Math.max(...positions.values()) >= 3;
    }

    isFiftyMoveRule() {
        return this._halfMoves >= 100;
    }

    isInsufficientMaterial() {
        return this._isInsufficientMaterial();
    }

    isDraw() {
        return this.isStalemate() ||
            this.isThreefoldRepetition() ||
            this.isFiftyMoveRule() ||
            this.isInsufficientMaterial();
    }

    getWinner() {
        return this._winner;
    }

    getResult() {
        if (!this._gameOver) return '*';
        if (this._winner === 'w') return '1-0';
        if (this._winner === 'b') return '0-1';
        return '1/2-1/2';
    }

    isValidMove(move) {
        const parsedMove = this._parseMoveInput(move);
        if (!parsedMove) return false;

        const legalMoves = getAllLegalMoves(
            this._board,
            this._turn,
            this._getLastMove(),
            this._castlingRights
        );

        return legalMoves.some(m =>
            m.from.row === parsedMove.from.row &&
            m.from.col === parsedMove.from.col &&
            m.to.row === parsedMove.to.row &&
            m.to.col === parsedMove.to.col
        );
    }

    getValidMoves(square) {
        const { row, col } = this._parseSquare(square);
        const piece = this._board[row][col];
        if (!piece || piece[0] !== this._turn) return [];

        const allMoves = getAllLegalMoves(
            this._board,
            this._turn,
            this._getLastMove(),
            this._castlingRights
        );
        return allMoves.filter(m => m.from.row === row && m.from.col === col);
    }

    getAllValidMoves() {
        return getAllLegalMoves(
            this._board,
            this._turn,
            this._getLastMove(),
            this._castlingRights
        );
    }

    goToMove(index) {
        if (index < 0 || index > this._moveHistory.length) {
            return false;
        }

        if (index === 0) {
            return this.goToStart();
        }

        // Get the state AFTER the index-th move
        const targetState = this._moveHistory[index - 1];
        this._restoreFromState(targetState);
        this._historyIndex = index - 1;
        this._updateGameOverStatus();
        return true;
    }

    goToStart() {
        if (!this._initialState) return false;
        this._restoreFromState(this._initialState);
        this._historyIndex = -1;
        this._updateGameOverStatus();
        return true;
    }

    goToEnd() {
        if (this._moveHistory.length === 0) return true;
        const lastState = this._moveHistory[this._moveHistory.length - 1];
        this._restoreFromState(lastState);
        this._historyIndex = this._moveHistory.length - 1;
        this._updateGameOverStatus();
        return true;
    }

    getFEN() {
        return boardToFEN(
            this._board,
            this._turn,
            this._castlingRights,
            this._enPassantTarget,
            this._halfMoves,
            this._fullMoves
        );
    }

    getPGN() {
        let pgn = '';
        for (let i = 0; i < this._moveHistory.length; i++) {
            const state = this._moveHistory[i];
            const moveNumber = Math.floor(i / 2) + 1;
            if (i % 2 === 0) {
                pgn += `${moveNumber}. `;
            }
            pgn += `${state.san || '?'} `;
        }
        pgn += this.getResult();
        return pgn.trim();
    }

    toJSON() {
        return {
            board: this._board,
            turn: this._turn,
            castlingRights: this._castlingRights,
            enPassantTarget: this._enPassantTarget,
            halfMoves: this._halfMoves,
            fullMoves: this._fullMoves,
            moveHistory: this._moveHistory,
            historyIndex: this._historyIndex,
            gameOver: this._gameOver,
            winner: this._winner,
            result: this._result,
            kingPos: this._kingPos,
            initialState: this._initialState
        };
    }

    toObject() {
        return this.toJSON();
    }

    clone() {
        const cloned = new ChessGame();
        cloned.fromJSON(this.toJSON());
        return cloned;
    }

    static isValidFEN(fen) {
        try {
            FENToBoard(fen);
            return true;
        } catch {
            return false;
        }
    }

    static getStartingFEN() {
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }

    _saveToHistory(san, lastMove = null) {
        const state = {
            board: this._board.map(row => [...row]),
            turn: this._turn,
            castlingRights: {
                w: { ...this._castlingRights.w },
                b: { ...this._castlingRights.b }
            },
            enPassantTarget: this._enPassantTarget,
            halfMoves: this._halfMoves,
            fullMoves: this._fullMoves,
            fen: this.getFEN(),
            lastMove,
            san: san,
            kingPos: { ...this._kingPos }
        };

        // Remove future states if we're not at the end
        if (this._historyIndex + 1 < this._moveHistory.length) {
            this._moveHistory = this._moveHistory.slice(0, this._historyIndex + 1);
        }

        this._moveHistory.push(state);
        this._historyIndex++;
    }

    _createStateSnapshot(lastMove = null, san = null) {
        return {
            board: this._board.map(row => [...row]),
            turn: this._turn,
            castlingRights: {
                w: { ...this._castlingRights.w },
                b: { ...this._castlingRights.b }
            },
            enPassantTarget: this._enPassantTarget,
            halfMoves: this._halfMoves,
            fullMoves: this._fullMoves,
            fen: this.getFEN(),
            lastMove,
            san,
            kingPos: { ...this._kingPos }
        };
    }

    _restoreFromState(state) {
        this._board = state.board.map(row => [...row]);
        this._turn = state.turn;
        this._castlingRights = {
            w: { ...state.castlingRights.w },
            b: { ...state.castlingRights.b }
        };
        this._enPassantTarget = state.enPassantTarget;
        this._halfMoves = state.halfMoves;
        this._fullMoves = state.fullMoves;
        this._kingPos = state.kingPos ? { ...state.kingPos } : this._kingPos;
    }

    _getLastMove() {
        if (this._moveHistory.length === 0) return null;
        return this._moveHistory[this._moveHistory.length - 1].lastMove;
    }

    _updateGameOverStatus() {
        const legalMoves = getAllLegalMoves(
            this._board,
            this._turn,
            this._getLastMove(),
            this._castlingRights
        );
        const isKingAttacked = this.isCheck();

        if (legalMoves.length === 0) {
            this._gameOver = true;
            if (isKingAttacked) {
                // Checkmate - current player loses
                this._winner = this._turn === 'w' ? 'b' : 'w';
                this._result = this._winner === 'w' ? 'white_win' : 'black_win';
            } else {
                // Stalemate
                this._winner = null;
                this._result = 'draw';
            }
        } else if (this.isDraw()) {
            this._gameOver = true;
            this._winner = null;
            this._result = 'draw';
        } else {
            this._gameOver = false;
        }
    }

    _updateKingPositions() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._board[row][col];
                if (piece === 'wk') this._kingPos.w = { row, col };
                if (piece === 'bk') this._kingPos.b = { row, col };
            }
        }
    }

    _isInsufficientMaterial() {
        let bishops = { w: 0, b: 0 };
        let knights = { w: 0, b: 0 };
        let otherPieces = { w: 0, b: 0 };

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._board[row][col];
                if (piece === '') continue;

                const color = piece[0];
                const type = piece[1];

                if (type === 'k') continue;
                if (type === 'b') bishops[color]++;
                else if (type === 'n') knights[color]++;
                else otherPieces[color]++;
            }
        }

        if (otherPieces.w === 0 && otherPieces.b === 0 &&
            bishops.w === 0 && bishops.b === 0 &&
            knights.w === 0 && knights.b === 0) {
            return true;
        }

        if (otherPieces.w === 0 && otherPieces.b === 0 &&
            knights.w === 0 && knights.b === 0) {
            if ((bishops.w === 1 && bishops.b === 0) ||
                (bishops.w === 0 && bishops.b === 1)) {
                return true;
            }
        }

        if (otherPieces.w === 0 && otherPieces.b === 0 &&
            bishops.w === 0 && bishops.b === 0) {
            if ((knights.w === 1 && knights.b === 0) ||
                (knights.w === 0 && knights.b === 1)) {
                return true;
            }
        }

        return false;
    }

    _getSANForMove(move, piece, capturedPiece) {
        const pieceType = piece[1].toUpperCase();
        const toFile = String.fromCharCode(97 + move.to.col);
        const toRank = 8 - move.to.row;

        if (move.castle) {
            return move.castle === 'kingSide' ? 'O-O' : 'O-O-O';
        }

        if (pieceType === 'P') {
            if (capturedPiece) {
                const fromFile = String.fromCharCode(97 + move.from.col);
                return `${fromFile}x${toFile}${toRank}`;
            }
            if (move.promotion) {
                return `${toFile}${toRank}=${move.promotion.toUpperCase()}`;
            }
            return `${toFile}${toRank}`;
        }

        let san = pieceType;

        // Check for disambiguation (same piece types that can move to same square)
        const samePieces = [];
        const allMoves = getAllLegalMoves(
            this._board,
            this._turn,
            this._getLastMove(),
            this._castlingRights
        );

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const p = this._board[row][col];
                if (row === move.from.row && col === move.from.col) continue;
                if (p === piece) {
                    if (allMoves.some(m =>
                        m.from.row === row && m.from.col === col &&
                        m.to.row === move.to.row && m.to.col === move.to.col)) {
                        samePieces.push({ row, col });
                    }
                }
            }
        }

        if (samePieces.length > 0) {
            const sameFile = samePieces.some(p => p.col === move.from.col);
            const sameRank = samePieces.some(p => p.row === move.from.row);

            if (sameFile && sameRank) {
                san += `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}`;
            } else if (sameFile) {
                san += `${8 - move.from.row}`;
            } else {
                san += `${String.fromCharCode(97 + move.from.col)}`;
            }
        }

        if (capturedPiece) {
            san += 'x';
        }

        san += `${toFile}${toRank}`;

        if (move.promotion) {
            san += `=${move.promotion.toUpperCase()}`;
        }

        return san;
    }

    _addCheckSymbol(san, isCheck, isCheckmate) {
        if (isCheckmate) {
            return san + '#';
        }
        if (isCheck) {
            return san + '+';
        }
        return san;
    }

    _parseMoveInput(move, defaultPromotion = 'q') {
        if (typeof move === 'string') {
            if (move.length >= 4) {
                const fromFile = move[0];
                const fromRank = move[1];
                const toFile = move[2];
                const toRank = move[3];

                let promotion = defaultPromotion;
                if (move.length >= 5) {
                    const promoChar = move[4].toLowerCase();
                    if (['q', 'r', 'b', 'n'].includes(promoChar)) {
                        promotion = promoChar;
                    }
                }

                return {
                    from: this._algebraicToRowCol(`${fromFile}${fromRank}`),
                    to: this._algebraicToRowCol(`${toFile}${toRank}`),
                    promotion: promotion
                };
            }
            return null;
        }

        if (typeof move === 'object') {
            let from, to;

            if (move.from && move.to) {
                from = this._parseSquare(move.from);
                to = this._parseSquare(move.to);
            } else if (move.fromRow !== undefined) {
                from = { row: move.fromRow, col: move.fromCol };
                to = { row: move.toRow, col: move.toCol };
            } else {
                return null;
            }

            const promotion = move.promotion || defaultPromotion;

            return {
                from,
                to,
                promotion: ['q', 'r', 'b', 'n'].includes(promotion) ? promotion : 'q'
            };
        }

        return null;
    }

    _parseSquare(square) {
        if (typeof square === 'string') {
            return this._algebraicToRowCol(square);
        }
        if (typeof square === 'object') {
            return { row: square.row, col: square.col };
        }
        return null;
    }

    _algebraicToRowCol(algebraic) {
        const file = algebraic[0];
        const rank = algebraic[1];
        const col = file.charCodeAt(0) - 97;
        const row = 8 - parseInt(rank);
        return { row, col };
    }

    _rowColToAlgebraic(row, col) {
        const file = String.fromCharCode(97 + col);
        const rank = 8 - row;
        return `${file}${rank}`;
    }

    _parsePGN(pgn) {
        const moves = [];
        const moveRegex = /([NBRQK])?([a-h])?([1-8])?x?([a-h][1-8])(=[NBRQ])?[\+#]?/g;
        let match;
        while ((match = moveRegex.exec(pgn)) !== null) {
            if (match[4]) {
                moves.push(match[4]);
            }
        }
        return moves;
    }
}

export default ChessGame;