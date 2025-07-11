"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import data from "@/data/features.json";
import Fuse from "fuse.js";
import { useLocalStorageValue } from "@react-hookz/web";
import mapboxgl from "mapbox-gl";
import { coordEach } from "@turf/meta";
import "mapbox-gl/dist/mapbox-gl.css";
import "react-circular-progressbar/dist/styles.css";
import MenuComponent from "@/components/Menu";
import IntroModal from "@/components/IntroModal";
import removeAccents from "@/lib/removeAccents";
import FoundSummary from "@/components/FoundSummary";
import FoundList from "@/components/FoundList";
import { DataFeatureCollection, DataFeature } from "@/lib/types";
import Input from "@/components/Input";
import { BEG_THRESHOLD, LINES } from "@/lib/constants";
import useHideLabels from "@/hooks/useHideLabels";
import StripeModal from "@/components/StripeModal";

const fc = {
  ...data,
  features: data.features.filter((f) => !!LINES[f.properties.line]),
} as DataFeatureCollection;

export default function Home() {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { hideLabels, setHideLabels } = useHideLabels(map);
  const [showStripeModal, setShowStripeModal] = useState<boolean>(false);

  const { value: hasShownStripeModal, set: setHasShownStripeModal } =
    useLocalStorageValue<boolean>("has-shown-stripe-modal", {
      defaultValue: false,
      initializeWithValue: false,
    });

  const idMap = useMemo(() => {
    const map = new Map<number, DataFeature>();
    fc.features.forEach((feature) => {
      map.set(feature.id! as number, feature);
    });
    return map;
  }, []);

  const { value: localFound, set: setFound } = useLocalStorageValue<
    number[] | null
  >("london-stations", {
    defaultValue: null,
    initializeWithValue: false,
  });

  const { value: isNewPlayer, set: setIsNewPlayer } =
    useLocalStorageValue<boolean>("london-stations-is-new-player", {
      defaultValue: true,
      initializeWithValue: false,
    });

  const found: number[] = useMemo(() => {
    return (localFound || []).filter((f) => idMap.has(f));
  }, [localFound, idMap]);

  const onReset = useCallback(() => {
    if (confirm("You are going to lose all your progress. Are you sure?")) {
      setFound([]);
      setIsNewPlayer(true);
      setHasShownStripeModal(false);
    }
  }, [setFound, setIsNewPlayer, setHasShownStripeModal]);

  const foundStationsPerLine = useMemo(() => {
    const foundStationsPerLine: { [key: string]: number } = {};
    for (let id of found || []) {
      const feature = idMap.get(id);
      if (!feature) {
        continue;
      }
      const line = feature.properties.line;
      if (!line) {
        continue;
      }
      foundStationsPerLine[line] = (foundStationsPerLine[line] || 0) + 1;
    }

    return foundStationsPerLine;
  }, [found, idMap]);

  const fuse = useMemo(
    () =>
      new Fuse(fc.features, {
        includeScore: true,
        includeMatches: true,
        keys: [
          "properties.long_name",
          "properties.short_name",
          "properties.name",
        ],
        minMatchCharLength: 2,
        threshold: 0.15,
        distance: 10,
        getFn: (obj, path) => {
          const value = Fuse.config.getFn(obj, path);
          if (Array.isArray(value)) {
            return value.map((el) => removeAccents(el));
          } else {
            return removeAccents(value as string);
          }
        },
      }),
    []
  );

  const foundProportion = found.length / fc.features.length;

  useEffect(() => {
    if (foundProportion > BEG_THRESHOLD && !hasShownStripeModal) {
      // once we reach a certain threshold, we show the stripe modal
      // and unlock the rest of the game.
      setShowStripeModal(true);
      setHasShownStripeModal(true);
    }
  }, [
    hasShownStripeModal,
    setHasShownStripeModal,
    foundProportion,
    found,
    setFound,
    idMap,
  ]);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const mapboxMap = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/benjamintd/clnx0tw77005n01qsfyeya61u",
      bounds: [
        [-0.619997, 51.323273],
        [0.35504, 51.68869],
      ],
      maxBounds: [
        [-2.058488, 50.738554],
        [1.841659, 52.201223],
      ],
      minZoom: 6,
      fadeDuration: 50,
    });

    mapboxMap.on("load", () => {
      mapboxMap.addSource("london", {
        type: "geojson",
        data: fc,
      });

      mapboxMap.addSource("hovered", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      mapboxMap.addLayer({
        id: "underground-hovered",
        type: "circle",
        paint: {
          "circle-radius": 16,
          "circle-color": "#fde047",
          "circle-blur-transition": {
            duration: 100,
          },
          "circle-blur": 1,
        },
        source: "hovered",
        filter: ["==", "$type", "Point"],
      });

      mapboxMap.addLayer({
        type: "circle",
        source: "london",
        id: "underground-circles",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            ["case", ["to-boolean", ["feature-state", "found"]], 2, 1],
            16,
            ["case", ["to-boolean", ["feature-state", "found"]], 6, 4],
          ],
          "circle-color": [
            "case",
            ["to-boolean", ["feature-state", "found"]],
            [
              "match",
              ["get", "line"],
              ...Object.keys(LINES).flatMap((line) => [
                [line],
                LINES[line].color,
              ]),
              "rgba(255, 255, 255, 0.8)",
            ],
            "rgba(255, 255, 255, 0.8)",
          ],
          "circle-stroke-color": [
            "case",
            ["to-boolean", ["feature-state", "found"]],
            [
              "match",
              ["get", "line"],
              ...Object.keys(LINES).flatMap((line) => [
                [line],
                LINES[line].backgroundColor,
              ]),
              "rgba(255, 255, 255, 0.8)",
            ],
            "rgba(255, 255, 255, 0.8)",
          ],
          "circle-stroke-width": [
            "case",
            ["to-boolean", ["feature-state", "found"]],
            1,
            0,
          ],
        },
      });

      mapboxMap.addLayer({
        minzoom: 11,
        layout: {
          "text-field": ["to-string", ["get", "name"]],
          "text-font": [
            "Johnston100W03-Regular Regular",
            "Arial Unicode MS Regular",
          ],
          "text-anchor": "bottom",
          "text-offset": [0, -0.5],
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 12, 22, 14],
        },
        type: "symbol",
        source: "london",
        id: "underground-labels",
        paint: {
          "text-color": [
            "case",
            ["to-boolean", ["feature-state", "found"]],
            "rgb(29, 40, 53)",
            "rgba(0, 0, 0, 0)",
          ],
          "text-halo-color": [
            "case",
            ["to-boolean", ["feature-state", "found"]],
            "rgba(255, 255, 255, 0.8)",
            "rgba(0, 0, 0, 0)",
          ],
          "text-halo-blur": 1,
          "text-halo-width": 1,
        },
      });

      mapboxMap.addLayer({
        id: "hover-label-point",
        type: "symbol",
        paint: {
          "text-halo-color": "rgb(255, 255, 255)",
          "text-halo-width": 2,
          "text-halo-blur": 1,
          "text-color": "rgb(29, 40, 53)",
        },
        layout: {
          "text-field": ["to-string", ["get", "name"]],
          "text-font": [
            "Johnston100W03-Medium Regular",
            "Arial Unicode MS Regular",
          ],
          "text-anchor": "bottom",
          "text-offset": [0, -0.6],
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 14, 22, 16],
          "symbol-placement": "point",
        },
        source: "hovered",
        filter: ["==", "$type", "Point"],
      });

      mapboxMap.once("data", () => {
        setMap((map) => (map === null ? mapboxMap : map));
      });

      mapboxMap.once("idle", () => {
        setMap((map) => (map === null ? mapboxMap : map));
        mapboxMap.on("mousemove", ["underground-circles"], (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features.find((f) => f.state.found && f.id);
            if (feature && feature.id) {
              return setHoveredId(feature.id as number);
            }
          }

          setHoveredId(null);
        });

        mapboxMap.on("mouseleave", ["underground-circles"], () => {
          setHoveredId(null);
        });
      });
    });

    return () => {
      mapboxMap.remove();
    };
  }, [setMap]);

  useEffect(() => {
    if (!map) return;

    (map.getSource("hovered") as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: hoveredId ? [idMap.get(hoveredId)!] : [],
    });
  }, [map, hoveredId, idMap]);

  useEffect(() => {
    if (!map || !found) return;

    map.removeFeatureState({ source: "london" });

    for (let id of found) {
      map.setFeatureState({ source: "london", id }, { found: true });
    }
  }, [found, map]);

  const zoomToFeature = useCallback(
    (id: number) => {
      if (!map) return;

      const feature = idMap.get(id);
      if (!feature) return;

      if (feature.geometry.type === "Point") {
        map.flyTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: 14,
        });
      } else {
        const bounds = new mapboxgl.LngLatBounds();
        coordEach(feature, (coord) => {
          bounds.extend(coord as [number, number]);
        });
        map.fitBounds(bounds, { padding: 100 });
      }
    },
    [map, idMap]
  );

  return (
    <main className="flex flex-row items-center justify-between min-h-screen">
      <div className="relative flex justify-center min-h-screen grow">
        <div className="absolute top-0 left-0 w-full h-screen" id="map" />
        <div className="absolute h-12 max-w-full px-1 w-96 top-4 lg:top-32">
          <FoundSummary
            className="p-4 mb-4 bg-white rounded-lg shadow-md lg:hidden"
            foundProportion={foundProportion}
            foundStationsPerLine={foundStationsPerLine}
            stationsPerLine={fc.properties.stationsPerLine}
            defaultMinimized
            minimizable
          />
          <div className="flex gap-2 lg:gap-4">
            <Input
              fuse={fuse}
              found={found}
              setFound={setFound}
              setIsNewPlayer={setIsNewPlayer}
              inputRef={inputRef}
              map={map}
              idMap={idMap}
            />
            <MenuComponent
              onReset={onReset}
              hideLabels={hideLabels}
              setHideLabels={setHideLabels}
            />
          </div>
        </div>
      </div>
      <div className="h-full p-6 z-10 overflow-y-auto xl:w-[32rem] lg:w-96 hidden shadow-lg lg:block bg-zinc-50">
        <FoundSummary
          foundProportion={foundProportion}
          foundStationsPerLine={foundStationsPerLine}
          stationsPerLine={fc.properties.stationsPerLine}
          minimizable
          defaultMinimized
        />
        <hr className="w-full my-4 border-b border-zinc-100" />
        <FoundList
          found={found}
          idMap={idMap}
          setHoveredId={setHoveredId}
          hoveredId={hoveredId}
          hideLabels={hideLabels}
          zoomToFeature={zoomToFeature}
        />
      </div>
      <IntroModal
        inputRef={inputRef}
        open={isNewPlayer}
        setOpen={setIsNewPlayer}
      >
        Type a station name, and press Enter ⏎
      </IntroModal>
      <StripeModal
        foundProportion={foundProportion}
        open={showStripeModal}
        setOpen={setShowStripeModal}
      />
    </main>
  );
}
