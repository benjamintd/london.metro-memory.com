import { LINES } from "@/lib/constants";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import Image from "next/image";
import classNames from "classnames";

const ProgressBars = ({
  foundStationsPerLine,
  stationsPerLine,
  minimized = false,
}: {
  foundStationsPerLine: Record<string, number>;
  stationsPerLine: Record<string, number>;
  minimized?: boolean;
}) => {
  return (
    <div
      className={classNames("@container grid gap-2", {
        "grid-cols-[repeat(7,min-content)]": minimized,
        "grid-cols-2": !minimized,
      })}
    >
      {Object.keys(LINES).map((line) => {
        const title = `${LINES[line].name} - ${
          foundStationsPerLine[line] || 0
        }/${stationsPerLine[line]}`;
        return (
          <div key={line} className="flex items-center gap-2">
            <div
              title={title}
              className="relative w-8 h-8 flex items-center justify-center shrink-0"
            >
              <div className="absolute w-full h-full shadow rounded-full">
                <CircularProgressbar
                  background
                  backgroundPadding={2}
                  styles={buildStyles({
                    backgroundColor: "white",
                    pathColor: LINES[line].color,
                    trailColor: "transparent",
                  })}
                  value={
                    (100 * (foundStationsPerLine[line] || 0)) /
                    stationsPerLine[line]
                  }
                />
              </div>
              <Image
                alt={line}
                src={`/images/${line}.svg`}
                width={64}
                height={64}
                className="h-6 w-6 rounded-full z-20 object-contain"
              />
            </div>
            {!minimized && (
              <p className="whitespace-nowrap text-sm truncate">{title}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressBars;
