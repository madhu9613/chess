// src/components/Board/Pieces.jsx
import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import actionTypes from '../../reducer/actionTypes'
import { makeNewMove } from '../../reducer/actions/move'

// Load piece images
const pieces = import.meta.glob('../../assets/pieces/*.png', {
  eager: true,
  import: 'default'
})

const pieceImages = {}
for (const path in pieces) {
  const fileName = path.split('/').pop().replace('.png', '')
  pieceImages[fileName] = pieces[path]
}

const Pieces = () => {
  const { appstate, dispatch } = useContext(AppContext)
  const position = appstate.position[appstate.position.length - 1]

  const [draggingPiece, setDraggingPiece] = useState(null)
  const [hoveredSquare, setHoveredSquare] = useState(null)

  const handleDrop = (e, toRow, toCol) => {
    e.preventDefault()
    setHoveredSquare(null)

    const data = e.dataTransfer.getData('text/plain')
    const [fromRow, fromCol] = data.split(',').map(Number)

    if (fromRow === toRow && fromCol === toCol) return

    const piece = position[fromRow][fromCol]
    const pieceColor = piece?.[0] // 'w' or 'b'

    if (pieceColor !== appstate.turn) {
      // Invalid move: not this player's turn
      return
    }

    const newPosition = position.map(row => [...row])

    // Move the piece
    newPosition[fromRow][fromCol] = ''
    newPosition[toRow][toCol] = piece

    // Construct move info
    const newMove = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece
    }

    // Dispatch the move
    dispatch(makeNewMove({ newPosition, newMove }))
    setDraggingPiece(null)
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full grid grid-cols-8 grid-rows-8">
      {position.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isDragging = draggingPiece === `${rowIndex},${colIndex}`
          const isHovered = hoveredSquare?.row === rowIndex && hoveredSquare?.col === colIndex

          const lastMove = appstate.movesList[appstate.movesList.length - 1]
          const isFrom = lastMove?.from?.row === rowIndex && lastMove?.from?.col === colIndex
          const isTo = lastMove?.to?.row === rowIndex && lastMove?.to?.col === colIndex
          const highlightColor = isFrom
            ? 'bg-green-300/50'
            : isTo
            ? 'bg-yellow-300/50'
            : ''

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`tile-size flex items-center justify-center relative ${highlightColor} transition-colors duration-150`}
              onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
              onDragOver={(e) => {
                e.preventDefault()
                setHoveredSquare({ row: rowIndex, col: colIndex })
              }}
              onDragEnter={() => setHoveredSquare({ row: rowIndex, col: colIndex })}
              onDragLeave={() => setHoveredSquare(null)}
            >
              {piece && (
                <img
                  src={pieceImages[piece]}
                  alt={piece}
                  className={`w-[85%] h-[85%] object-contain cursor-grab ${
                    isDragging ? 'opacity-60' : 'opacity-100'
                  }`}
                  draggable={piece[0] === appstate.turn}
                  onDragStart={(e) => {
                    if (piece[0] !== appstate.turn) return
                    e.dataTransfer.setData('text/plain', `${rowIndex},${colIndex}`)
                    setDraggingPiece(`${rowIndex},${colIndex}`)
                    setTimeout(() => {
                      e.target.style.display = 'none'
                    }, 0)
                  }}
                  onDragEnd={(e) => {
                    e.target.style.display = 'block'
                    setDraggingPiece(null)
                    setHoveredSquare(null)
                  }}
                />
              )}
              {isHovered && (
                <div className="absolute inset-0 border-2 border-blue-400 rounded z-10 pointer-events-none"></div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default Pieces
