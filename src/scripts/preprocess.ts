import * as path from "path";
import { groupBy, mapValues, sortBy, uniqBy } from "lodash";
import { promises as fs } from "fs";
import { LINES } from "@/lib/constants";

const Bun = {
  file(path: string) {
    return {
      async json() {
        return JSON.parse(await fs.readFile(path, "utf8"));
      },
    };
  },

  async write(path: string, content: string) {
    await fs.writeFile(path, content, "utf8");
  },
};

const main = async () => {
  // --- STATIONS ---
  const tube = Bun.file(path.join(__dirname, "../data/tube.json"));

  const { routes, stops } = (await tube.json()) as any;

  const availableLines = new Set(
    routes.map((route: any) => route.live_line_code)
  );

  let i = 0;
  const featuresStations = Object.keys(stops)
    .flatMap((code) => {
      const stop = stops[code];
      return stop.routes.map((route: string) => {
        const id = ++i;
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [stop.coords[1], stop.coords[0]],
          },
          properties: {
            id,
            name: stop.name,
            short_name: stop.code,
            line: route,
          },
          id,
        };
      });
    })
    .filter((f) => availableLines.has(f.properties.line));

  const featuresRoutes = routes.flatMap((route: any) => {
    return route.patterns.map((pattern: any) => {
      return {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: pattern.path.map((coord: any) => [coord[1], coord[0]]),
        },
        properties: {
          line: route.live_line_code,
          name: route.name,
          color: route.color,
          order: LINES[route.live_line_code].order,
        },
      };
    });
  });

  Bun.write(
    path.join(__dirname, "../data/features.json"),
    JSON.stringify({
      type: "FeatureCollection",
      features: sortBy(
        featuresStations,
        (f) => -(LINES[f.properties.line].order || Infinity)
      ),
      properties: {
        totalStations: featuresStations.length,
        stationsPerLine: mapValues(
          groupBy(featuresStations, (feature) => feature.properties!.line),
          (stations) => stations.length
        ),
      },
    })
  );

  Bun.write(
    path.join(__dirname, "../data/routes.json"),
    JSON.stringify({
      type: "FeatureCollection",
      features: sortBy(
        featuresRoutes,
        (f) => -(LINES[f.properties.line].order || Infinity)
      ),
    })
  );
};

main();
