"use client";

import { LINES } from "@/lib/constants";
import { usePrevious } from "@react-hookz/web";
import classNames from "classnames";
import { useEffect, useState } from "react";
import ProgressBars from "./ProgressBars";
import { MaximizeIcon } from "./MaximizeIcon";
import { MinimizeIcon } from "./MinimizeIcon";

const FoundSummary = ({
  className,
  foundStationsPerLine,
  stationsPerLine,
  foundProportion,
  minimizable = false,
  defaultMinimized = false,
}: {
  className?: string;
  foundStationsPerLine: Record<string, number>;
  stationsPerLine: Record<string, number>;
  foundProportion: number;
  minimizable?: boolean;
  defaultMinimized?: boolean;
}) => {
  const previousFound = usePrevious(foundStationsPerLine);
  const [minimized, setMinimized] = useState<boolean>(defaultMinimized);

  useEffect(() => {
    // confetti when new line is 100%
    const newFoundLines = Object.keys(foundStationsPerLine).filter(
      (line) =>
        previousFound &&
        foundStationsPerLine[line] > previousFound[line] &&
        foundStationsPerLine[line] === stationsPerLine[line]
    );

    if (newFoundLines.length > 0) {
      const makeConfetti = async () => {
        const confetti = (await import("tsparticles-confetti")).confetti;
        confetti({
          spread: 120,
          ticks: 200,
          particleCount: 150,
          origin: { y: 0.2 },
          decay: 0.85,
          gravity: 2,
          startVelocity: 50,
          shapes: ["image"],
          scalar: 2,
          shapeOptions: {
            image: newFoundLines.map((line) => ({
              src: `/images/${line}.svg`,
              width: 64,
              height: 64,
            })),
          },
        });
      };

      makeConfetti();
    }
  }, [previousFound, foundStationsPerLine, stationsPerLine]);

  return (
    <div
      className={classNames(className, "@container", {
        relative: minimizable,
        "grid grid-cols-2 gap-2": minimized,
      })}
    >
      <div className="mb-2">
        <p className="mb-2">
          <span className="text-lg @md:text-2xl font-bold">
            {((foundProportion || 0) * 100).toFixed(1)}
          </span>{" "}
          <span className="text-lg @md:text-xl">%</span>{" "}
          <span className="text-sm">stations found</span>
        </p>
        <ProgressBars
          minimized={minimized}
          foundStationsPerLine={foundStationsPerLine}
          stationsPerLine={stationsPerLine}
        />
      </div>
      {minimizable && (
        <div className="absolute bottom-0 right-0">
          <button
            onClick={() => setMinimized(!minimized)}
            className="text-gray-500 rounded-full flex items-center justify-center bg-white shadow w-8 h-8 my-1 mx-2"
          >
            {minimized ? (
              <MaximizeIcon className="w-4 h-4" />
            ) : (
              <MinimizeIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FoundSummary;
