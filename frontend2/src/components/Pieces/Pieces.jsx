import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// No animations: keep UI simple and static
import {
    makeMove,
    selectSquare,
    clearSelection,
    selectMoveHistory,
    resetGame,
    selectBoard,
    selectTurn,
    selectSelectedSquare,
    selectCandidateMoves,
    selectFEN,
    selectPlayerColor,
    selectIsMyTurn,
    selectIsCheck,
    selectIsCheckmate,
    selectIsStalemate,
    selectWinner,
} from '../../store/gameSlice';
import PromoteModal from '../PromoteModal';
import GameOverModal from '../GameOverModal';
import socket from '../../socket/socket';
import { ChessGame } from '@mady9613/chess-engine';

// Import piece images
import wpImg from '../../assets/pieces/wp.png';
import wrImg from '../../assets/pieces/wr.png';
import wnImg from '../../assets/pieces/wn.png';
import wbImg from '../../assets/pieces/wb.png';
import wqImg from '../../assets/pieces/wq.png';
import wkImg from '../../assets/pieces/wk.png';
import bpImg from '../../assets/pieces/bp.png';
import brImg from '../../assets/pieces/br.png';
import bnImg from '../../assets/pieces/bn.png';
import bbImg from '../../assets/pieces/bb.png';
import bqImg from '../../assets/pieces/bq.png';
import bkImg from '../../assets/pieces/bk.png';

// Piece images mapping
const pieceImages = {
    'wp': wpImg,
    'wr': wrImg,
    'wn': wnImg,
    'wb': wbImg,
    'wq': wqImg,
    'wk': wkImg,
    'bp': bpImg,
    'br': brImg,
    'bn': bnImg,
    'bb': bbImg,
    'bq': bqImg,
    'bk': bkImg,
};

const Pieces = ({ reversed = false, roomId = null, isMultiplayer = false }) => {
    const dispatch = useDispatch();
    const board = useSelector(selectBoard);
    const moveHistory = useSelector(selectMoveHistory);
    const turn = useSelector(selectTurn);
    const selectedSquare = useSelector(selectSelectedSquare);
    const candidateMoves = useSelector(selectCandidateMoves);
    const fen = useSelector(selectFEN);
    const playerColor = useSelector(selectPlayerColor);
    const isMyTurn = useSelector(selectIsMyTurn);
    const isCheck = useSelector(selectIsCheck);
    const isCheckmate = useSelector(selectIsCheckmate);
    const isStalemate = useSelector(selectIsStalemate);
    const winner = useSelector(selectWinner);

    const [draggingPiece, setDraggingPiece] = useState(null);
    const [hoveredSquare, setHoveredSquare] = useState(null);
    const [showPromotion, setShowPromotion] = useState(false);
    const [pendingMove, setPendingMove] = useState(null);
    const [localSelectedSquare, setLocalSelectedSquare] = useState(null);

    // Get last move from game history
    const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1].move : null;

    // Helper to check if a square is a valid move destination
    const isValidMoveDestination = useCallback((row, col) => {
        if (!localSelectedSquare) return false;
        // Compute valid moves directly from the current FEN to avoid stale selector state
        const fromAlg = `${String.fromCharCode(97 + localSelectedSquare.col)}${8 - localSelectedSquare.row}`;
        const g = new ChessGame();
        g.loadFEN(fen);
        const moves = g.getValidMoves(fromAlg);
        return moves.some(move => move.to.row === row && move.to.col === col);
    }, [fen, localSelectedSquare]);

    // Helper to check if a move is a promotion
    const isPromotionMove = useCallback((fromRow, fromCol, toRow, toCol, piece) => {
        if (!piece || piece[1] !== 'p') return false;
        const toRank = piece[0] === 'w' ? 0 : 7;
        return toRow === toRank;
    }, []);

    // Handle move execution
    const executeMove = useCallback((fromRow, fromCol, toRow, toCol, promotionPiece = 'q') => {
        const from = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}`;
        const to = `${String.fromCharCode(97 + toCol)}${8 - toRow}`;
        const piece = board[fromRow][fromCol];

        // Check if this is a promotion move
        if (isPromotionMove(fromRow, fromCol, toRow, toCol, piece)) {
            setPendingMove({ from, to, piece });
            setShowPromotion(true);
            return;
        }

        // Make the move
        dispatch(makeMove({ from, to }));
        dispatch(clearSelection());
        setLocalSelectedSquare(null);

        // Emit for multiplayer
        if (isMultiplayer && roomId) {
            socket.emit('make-move', { roomId, move: { from, to } });
        }
    }, [board, dispatch, isMultiplayer, roomId, isPromotionMove]);

    // Handle promotion completion
    const handlePromotionComplete = useCallback((promotionPiece) => {
        if (pendingMove) {
            dispatch(makeMove({
                from: pendingMove.from,
                to: pendingMove.to,
                promotion: promotionPiece
            }));
            dispatch(clearSelection());
            setLocalSelectedSquare(null);

            if (isMultiplayer && roomId) {
                socket.emit('make-move', {
                    roomId,
                    move: { from: pendingMove.from, to: pendingMove.to, promotion: promotionPiece }
                });
            }
        }
        setShowPromotion(false);
        setPendingMove(null);
    }, [pendingMove, dispatch, isMultiplayer, roomId]);

    // Handle square click (for mouse users)
    const handleSquareClick = useCallback((row, col, piece) => {
        // If multiplayer, disallow actions when it's not the player's turn
        if (isMultiplayer && !isMyTurn) return;

        // If no local selection yet, only allow selecting your own piece
        if (!localSelectedSquare) {
            if (!piece) return;
            if (isMultiplayer) {
                if (playerColor && piece[0] !== playerColor) return;
            } else {
                if (piece[0] !== turn) return;
            }

            setLocalSelectedSquare({ row, col });
            dispatch(selectSquare(`${String.fromCharCode(97 + col)}${8 - row}`));
            return;
        }

        // If we have a selected piece, allow clicking any square (including opponent pieces) to attempt a move
        if (isValidMoveDestination(row, col)) {
            executeMove(localSelectedSquare.row, localSelectedSquare.col, row, col);
        } else {
            // Clear selection and optionally select another own piece
            dispatch(clearSelection());
            setLocalSelectedSquare(null);
            if (piece) {
                if (isMultiplayer) {
                    if (!playerColor || piece[0] === playerColor) {
                        setLocalSelectedSquare({ row, col });
                        dispatch(selectSquare(`${String.fromCharCode(97 + col)}${8 - row}`));
                    }
                } else if (piece[0] === turn) {
                    setLocalSelectedSquare({ row, col });
                    dispatch(selectSquare(`${String.fromCharCode(97 + col)}${8 - row}`));
                }
            }
        }
    }, [localSelectedSquare, isValidMoveDestination, executeMove, dispatch, isMultiplayer, isMyTurn, playerColor, turn]);

    // Handle drag start
    const handleDragStart = useCallback((e, row, col, piece) => {
        // Check if can drag
        if (isMultiplayer && (!isMyTurn || (playerColor && piece && piece[0] !== playerColor))) {
            e.preventDefault();
            return false;
        }
        if (!isMultiplayer && piece && piece[0] !== turn) {
            e.preventDefault();
            return false;
        }

        e.dataTransfer.setData('text/plain', `${row},${col}`);
        setDraggingPiece(`${row},${col}`);

        // Highlight valid moves
        dispatch(selectSquare(`${String.fromCharCode(97 + col)}${8 - row}`));
        setLocalSelectedSquare({ row, col });

        e.dataTransfer.effectAllowed = 'move';
    }, [dispatch, isMultiplayer, isMyTurn, playerColor, turn]);

    // Handle drag over
    const handleDragOver = useCallback((e, row, col) => {
        e.preventDefault();
        setHoveredSquare({ row, col });
        e.dataTransfer.dropEffect = 'move';
    }, []);

    // Handle drop
    const handleDrop = useCallback((e, toRow, toCol) => {
        e.preventDefault();
        setHoveredSquare(null);

        const [fromRow, fromCol] = e.dataTransfer.getData('text/plain').split(',').map(Number);

        if (isValidMoveDestination(toRow, toCol)) {
            executeMove(fromRow, fromCol, toRow, toCol);
        }

        setDraggingPiece(null);
    }, [isValidMoveDestination, executeMove]);

    // Get highlight class for a square (simple, no animations)
    const getHighlightClass = useCallback((row, col, piece) => {
        const classes = [];
    // Check/King in check highlight
        if (piece === `${turn}k` && isCheck) {
            classes.push('ring-4 ring-red-500');
        }

        // Selected square
        if (localSelectedSquare?.row === row && localSelectedSquare?.col === col) {
            classes.push('ring-4 ring-yellow-400');
        }

        // Valid move destination
        if (isValidMoveDestination(row, col)) {
            const isCapture = candidateMoves.some(m => m.to.row === row && m.to.col === col && m.capture);
            if (isCapture) {
                classes.push('ring-2 ring-red-500');
            } else {
                classes.push('ring-2 ring-green-500');
            }
        }

        // Last move highlight
        if (lastMove) {
            if (lastMove.from?.row === row && lastMove.from?.col === col) {
                classes.push('bg-green-400/30');
            }
            if (lastMove.to?.row === row && lastMove.to?.col === col) {
                classes.push('bg-yellow-400/30');
            }
        }

        return classes.join(' ');
    }, [localSelectedSquare, isValidMoveDestination, candidateMoves, lastMove, turn, isCheck]);

    // Render the board with pieces
    const renderBoard = () => {
        const squares = [];
        const startRow = reversed ? 7 : 0;
        const endRow = reversed ? -1 : 8;
        const rowStep = reversed ? -1 : 1;

        for (let row = startRow; row !== endRow; row += rowStep) {
            for (let col = 0; col < 8; col++) {
                const actualCol = reversed ? 7 - col : col;
                const piece = board[row][actualCol];
                const isLightTile = (row + actualCol) % 2 === 0;
                const isHovered = hoveredSquare?.row === row && hoveredSquare?.col === actualCol;

                squares.push(
                    <div
                        key={`${row}-${actualCol}`}
                        style={{
                            backgroundColor: isLightTile ? '#f0d9b5' : '#b58863',
                        }}
                        className={`tile-size flex items-center justify-center cursor-pointer relative border border-gray-700/30 ${getHighlightClass(row, actualCol, piece)}`}
                        onClick={() => handleSquareClick(row, actualCol, piece)}
                        onDragOver={(e) => handleDragOver(e, row, actualCol)}
                        onDrop={(e) => handleDrop(e, row, actualCol)}
                    >
                        {/* Coordinates */}
                        <div className="absolute top-1 left-1 text-xs text-gray-600 opacity-40 pointer-events-none font-mono">
                            {actualCol === 0 && `${8 - row}`}
                        </div>
                        <div className="absolute bottom-1 right-1 text-xs text-gray-600 opacity-40 pointer-events-none font-mono">
                            {row === (reversed ? 0 : 7) && `${String.fromCharCode(97 + actualCol)}`}
                        </div>

                        {/* Piece */}
                        {piece && (
                            <img
                                src={pieceImages[piece]}
                                alt={piece}
                                className="w-[85%] h-[85%] object-contain select-none pointer-events-auto"
                                draggable={!isMultiplayer || (isMyTurn && (!playerColor || piece[0] === playerColor))}
                                onDragStart={(e) => handleDragStart(e, row, actualCol, piece)}
                                onDragEnd={() => setDraggingPiece(null)}
                            />
                        )}

                        {/* Hover indicator */}
                        {isHovered && (
                            <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none" />
                        )}

                        {/* Valid move indicator */}
                        {isValidMoveDestination(row, actualCol) && !piece && (
                            <div className="w-3 h-3 rounded-full bg-green-500 absolute" />
                        )}
                    </div>
                );
            }
        }
        return squares;
    };

    return (
        <div className="relative w-fit">
            <div className="grid grid-cols-8 gap-0 border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl">
                {renderBoard()}
            </div>

            {/* Promotion Modal */}
            {showPromotion && (
                <PromoteModal
                    onSelect={handlePromotionComplete}
                    onClose={() => setShowPromotion(false)}
                    color={pendingMove?.piece?.[0] || 'w'}
                />
            )}

            {/* Game Over Modal */}
            {(isCheckmate || isStalemate) && (
                <GameOverModal
                    type={isCheckmate ? 'checkmate' : 'stalemate'}
                    winner={winner}
                    onNewGame={() => {
                        dispatch(resetGame());
                        setLocalSelectedSquare(null);
                    }}
                    onClose={() => { }}
                />
            )}
        </div>
    );
};

export default Pieces;