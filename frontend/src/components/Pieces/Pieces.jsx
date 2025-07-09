import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { makeNewMove } from '../../reducer/actions/move'
import { getValidMoves } from '../../arbiter/getMoves'

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
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [validMoves, setValidMoves] = useState([])

  const handleDrop = (e, toRow, toCol) => {
    e.preventDefault()
    setHoveredSquare(null)

    const data = e.dataTransfer.getData('text/plain')
    const [fromRow, fromCol] = data.split(',').map(Number)

    if (fromRow === toRow && fromCol === toCol) return

    const piece = position[fromRow][fromCol]
    const pieceColor = piece?.[0]
    if (pieceColor !== appstate.turn) return

    const newPosition = position.map(row => [...row])
    const captured = position[toRow][toCol] !== ''

    newPosition[fromRow][fromCol] = ''
    newPosition[toRow][toCol] = piece

    const newMove = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece,
      captured,
    }

    dispatch(makeNewMove({ newPosition, newMove }))
    setDraggingPiece(null)
    setSelectedSquare(null)
    setValidMoves([])
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

          const isNormalMove = validMoves.some(
            m => m.row === rowIndex && m.col === colIndex && !m.capture
          )

          const isCaptureMove = validMoves.some(
            m => m.row === rowIndex && m.col === colIndex && m.capture
          )

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
                  className={`w-[85%] h-[85%] object-contain cursor-pointer ${isDragging ? 'opacity-60' : 'opacity-100'}`}
                  draggable={piece[0] === appstate.turn}
                  onClick={() => {
                    if (piece[0] !== appstate.turn) return
                    setSelectedSquare({ row: rowIndex, col: colIndex })
                    const moves = getValidMoves(
                      { row: rowIndex, col: colIndex },
                      position,
                      appstate.turn
                    )
                    setValidMoves(moves)
                  }}
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

              {isNormalMove && (
                <div className="w-5 h-5 rounded-full bg-stone-600 opacity-70 z-10 pointer-events-none"></div>
              )}

              {isCaptureMove && (
                <div className="absolute inset-0 border-4 border-white rounded z-10 pointer-events-none"></div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default Pieces
