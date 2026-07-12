import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    makeMove,
    resetGame,
    selectSquare,
    clearSelection,
    selectGame,
    selectBoard,
    selectTurn,
    selectSelectedSquare,
    selectCandidateMoves,
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
import { useAuth } from '../../context/AuthContext';

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

const Pieces = ({ reversed = false, roomId = null, isMultiplayer = false, isSpectator = false, practiceColor = null }) => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useAuth();
    const game = useSelector(selectGame);
    const board = useSelector(selectBoard);
    const turn = useSelector(selectTurn);
    const selectedSquare = useSelector(selectSelectedSquare);
    const candidateMoves = useSelector(selectCandidateMoves);
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
    const readOnlyMode = isSpectator || (isMultiplayer && !isAuthenticated);
    const localPlayerColor = practiceColor;

    // Get last move from game history
    const moveHistory = game.getMoveHistory();
    const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1].move : null;

    // Helper to check if a square is a valid move destination
    const isValidMoveDestination = useCallback((row, col) => {
        return candidateMoves.some(move => move.to.row === row && move.to.col === col);
    }, [candidateMoves]);

    // Helper to check if a move is a promotion
    const isPromotionMove = useCallback((fromRow, fromCol, toRow, toCol, piece) => {
        if (!piece || piece[1] !== 'p') return false;
        const toRank = piece[0] === 'w' ? 0 : 7;
        return toRow === toRank;
    }, []);

    // Handle move execution
    const executeMove = useCallback((fromRow, fromCol, toRow, toCol, promotionPiece = 'q') => {
        if (readOnlyMode) return;
        const from = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}`;
        const to = `${String.fromCharCode(97 + toCol)}${8 - toRow}`;
        const piece = board[fromRow][fromCol];

        // Check if this is a promotion move
        if (isPromotionMove(fromRow, fromCol, toRow, toCol, piece)) {
            setPendingMove({ from, to, piece });
            setShowPromotion(true);
            return;
        }

        if (isMultiplayer && roomId) {
            socket.emit('makeMove', { roomCode: roomId, move: { from, to, promotion: promotionPiece } }, (response) => {
                if (!response?.success) {
                    console.error('Multiplayer move rejected:', response?.error || 'Unknown error');
                }
            });
            dispatch(clearSelection());
            setLocalSelectedSquare(null);
            return;
        }

        dispatch(makeMove({ from, to }));
        dispatch(clearSelection());
        setLocalSelectedSquare(null);
    }, [board, dispatch, isMultiplayer, roomId, isPromotionMove, readOnlyMode]);

    // Handle promotion completion
    const handlePromotionComplete = useCallback((promotionPiece) => {
        if (readOnlyMode) return;
        if (pendingMove) {
            if (isMultiplayer && roomId) {
                socket.emit('makeMove', {
                    roomCode: roomId,
                    move: { from: pendingMove.from, to: pendingMove.to, promotion: promotionPiece }
                }, (response) => {
                    if (!response?.success) {
                        console.error('Multiplayer promotion move rejected:', response?.error || 'Unknown error');
                    }
                });
            } else {
                dispatch(makeMove({
                    from: pendingMove.from,
                    to: pendingMove.to,
                    promotion: promotionPiece
                }));
            }

            dispatch(clearSelection());
            setLocalSelectedSquare(null);
        }
        setShowPromotion(false);
        setPendingMove(null);
    }, [pendingMove, dispatch, isMultiplayer, roomId, readOnlyMode]);

    // Handle square click (for mouse users)
    const handleSquareClick = useCallback((row, col, piece) => {
        if (readOnlyMode) return;
        // In multiplayer, check if it's player's turn
        if (isMultiplayer && (!isMyTurn || (playerColor && piece && piece[0] !== playerColor))) {
            return;
        }

        // In local play, check turn
        if (!isMultiplayer && piece && piece[0] !== (localPlayerColor || turn)) {
            return;
        }

        if (localSelectedSquare) {
            if (isValidMoveDestination(row, col)) {
                executeMove(localSelectedSquare.row, localSelectedSquare.col, row, col);
            } else {
                // Clear selection if clicking an invalid square
                dispatch(clearSelection());
                setLocalSelectedSquare(null);

                // If clicking on own piece, select it
                if (piece && (!isMultiplayer ? piece[0] === (localPlayerColor || turn) : piece[0] === playerColor)) {
                    setLocalSelectedSquare({ row, col });
                    dispatch(selectSquare(`${String.fromCharCode(97 + col)}${8 - row}`));
                }
            }
        } else {
            // Select piece
            if (piece && (!isMultiplayer ? piece[0] === (localPlayerColor || turn) : piece[0] === playerColor)) {
                setLocalSelectedSquare({ row, col });
                dispatch(selectSquare(`${String.fromCharCode(97 + col)}${8 - row}`));
            }
        }
    }, [localSelectedSquare, isValidMoveDestination, executeMove, dispatch, isMultiplayer, isMyTurn, playerColor, turn, candidateMoves, readOnlyMode, localPlayerColor]);

    // Handle drag start
    const handleDragStart = useCallback((e, row, col, piece) => {
        if (readOnlyMode) {
            e.preventDefault();
            return false;
        }
        // Check if can drag
        if (isMultiplayer && (!isMyTurn || (playerColor && piece && piece[0] !== playerColor))) {
            e.preventDefault();
            return false;
        }
        if (!isMultiplayer && piece && piece[0] !== (localPlayerColor || turn)) {
            e.preventDefault();
            return false;
        }

        e.dataTransfer.setData('text/plain', `${row},${col}`);
        setDraggingPiece(`${row},${col}`);

        // Highlight valid moves
        dispatch(selectSquare(`${String.fromCharCode(97 + col)}${8 - row}`));
        setLocalSelectedSquare({ row, col });

        e.dataTransfer.effectAllowed = 'move';
    }, [dispatch, isMultiplayer, isMyTurn, playerColor, turn, readOnlyMode, localPlayerColor]);

    // Handle drag over
    const handleDragOver = useCallback((e, row, col) => {
        e.preventDefault();
        setHoveredSquare({ row, col });
        e.dataTransfer.dropEffect = 'move';
    }, []);

    // Handle drop
    const handleDrop = useCallback((e, toRow, toCol) => {
        if (readOnlyMode) return;
        e.preventDefault();
        setHoveredSquare(null);

        const [fromRow, fromCol] = e.dataTransfer.getData('text/plain').split(',').map(Number);

        if (isValidMoveDestination(toRow, toCol)) {
            executeMove(fromRow, fromCol, toRow, toCol);
        }

        setDraggingPiece(null);
    }, [isValidMoveDestination, executeMove, readOnlyMode]);

    // Get highlight class for a square
    const getHighlightClass = useCallback((row, col, piece) => {
        const classes = [];

        // Check/King in check highlight - enhanced with better animation
        if (piece === `${turn}k` && isCheck) {
            classes.push('ring-4 ring-red-500 animate-pulse-glow shadow-lg shadow-red-500/50');
        }

        // Selected square
        if (localSelectedSquare?.row === row && localSelectedSquare?.col === col) {
            classes.push('ring-4 ring-yellow-400 ring-offset-2 scale-105 z-10 shadow-lg shadow-yellow-400/30');
        }

        // Valid move destination
        if (isValidMoveDestination(row, col)) {
            const isCapture = candidateMoves.some(m => m.to.row === row && m.to.col === col && m.capture);
            if (isCapture) {
                classes.push('ring-2 ring-red-500 shadow-lg');
            } else {
                classes.push('ring-2 ring-green-500/50 shadow-lg');
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
                    <motion.div
                        key={`${row}-${actualCol}`}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            backgroundColor: isLightTile ? '#f0d9b5' : '#b58863',
                        }}
                        className={`flex aspect-square h-full w-full min-w-0 items-center justify-center cursor-pointer transition-all duration-200 relative border border-gray-700/30
              ${getHighlightClass(row, actualCol, piece)}
            `}
                        onClick={() => handleSquareClick(row, actualCol, piece)}
                        onDragOver={(e) => handleDragOver(e, row, actualCol)}
                        onDrop={(e) => handleDrop(e, row, actualCol)}
                    >
                        {/* Coordinates */}
                        <div className="absolute top-1 left-1 text-[clamp(0.45rem,1.1vw,0.7rem)] text-gray-600 opacity-40 pointer-events-none font-mono">
                            {actualCol === 0 && `${8 - row}`}
                        </div>
                        <div className="absolute bottom-1 right-1 text-[clamp(0.45rem,1.1vw,0.7rem)] text-gray-600 opacity-40 pointer-events-none font-mono">
                            {row === (reversed ? 0 : 7) && `${String.fromCharCode(97 + actualCol)}`}
                        </div>

                        {/* Piece */}
                        {piece && (
                            <img
                                src={pieceImages[piece]}
                                alt={piece}
                                                                className={`h-[82%] w-[82%] object-contain select-none pointer-events-auto
                  ${draggingPiece === `${row},${actualCol}` ? 'opacity-50 scale-95' : 'opacity-100 hover:scale-105'}
                  transition-all duration-200
                `}
                                draggable={!readOnlyMode && (!isMultiplayer || (isMyTurn && (!playerColor || piece[0] === playerColor)))}
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
                            <div className="absolute h-[clamp(0.45rem,1.4vw,0.75rem)] w-[clamp(0.45rem,1.4vw,0.75rem)] rounded-full bg-green-500/70" />
                        )}
                    </motion.div>
                );
            }
        }
        return squares;
    };

    return (
        <div className="relative w-fit">
            <div className="grid grid-cols-8 gap-0 border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl aspect-square w-full">
                {renderBoard()}
            </div>

            {/* Promotion Modal */}
            <AnimatePresence>
                {showPromotion && (
                    <PromoteModal
                        onSelect={handlePromotionComplete}
                        onClose={() => setShowPromotion(false)}
                        color={pendingMove?.piece?.[0] || 'w'}
                    />
                )}
            </AnimatePresence>

            {/* Game Over Modal */}
            <AnimatePresence>
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
            </AnimatePresence>
        </div>
    );
};

export default Pieces;