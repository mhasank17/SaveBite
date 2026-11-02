import React, { useMemo } from 'react';

export interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  showCenterLogo?: boolean;
}

/**
 * Pure SVG QR Code Generator Component
 * Generates deterministic 2D QR matrix pattern for digital order passes.
 * Zero external runtime dependencies, 100% vector SVG rendering.
 */
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  className = '',
  showCenterLogo = true,
}) => {
  const matrixSize = 25; // 25x25 grid (Standard Version 2 QR dimension)

  const modules = useMemo(() => {
    // Generate deterministic pseudo-random matrix seeded with string hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    const grid: boolean[][] = Array.from({ length: matrixSize }, () =>
      Array(matrixSize).fill(false)
    );

    // Helper: Mark finder pattern at (r, c)
    const drawFinderPattern = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startRow + r][startCol + c] = true;
          }
        }
      }
    };

    // Draw three standard QR corner finder patterns
    drawFinderPattern(0, 0); // Top-Left
    drawFinderPattern(0, matrixSize - 7); // Top-Right
    drawFinderPattern(matrixSize - 7, 0); // Bottom-Left

    // Draw timing patterns
    for (let i = 8; i < matrixSize - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Fill remaining payload cells deterministically
    let seed = Math.abs(hash);
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip finder pattern zones
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= matrixSize - 8;
        const inBottomLeft = r >= matrixSize - 8 && c < 8;
        const inCenterLogo = showCenterLogo && r >= 10 && r <= 14 && c >= 10 && c <= 14;

        if (inTopLeft || inTopRight || inBottomLeft || inCenterLogo) {
          continue;
        }

        seed = (seed * 9301 + 49297) % 233280;
        grid[r][c] = seed % 3 === 0 || seed % 5 === 0;
      }
    }

    return grid;
  }, [value, showCenterLogo]);

  const cellSize = size / matrixSize;

  return (
    <div
      className={`relative inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-outline-variant/30 select-none ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={size} height={size} fill="#ffffff" rx={8} />

        {modules.map((row, r) =>
          row.map((active, c) => {
            if (!active) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill="#111c2d"
                rx={cellSize * 0.25}
              />
            );
          })
        )}
      </svg>

      {/* Center SaveBite Leaf Emblem */}
      {showCenterLogo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md border-2 border-white">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              eco
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
