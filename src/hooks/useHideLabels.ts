import mapboxgl from "mapbox-gl";
import { useEffect, useState } from "react";

const useHideLabels = (map: mapboxgl.Map | null) => {
  const [hideLabels, setHideLabels] = useState<boolean>(false);

  useEffect(() => {
    if (map && hideLabels) {
      if (map.getLayer("voies-labels")) {
        map.setLayoutProperty("voies-labels", "visibility", "none");

        map.setLayoutProperty("underground-labels", "visibility", "none");
      } else if (map) {
        if (map.getLayer("voies-labels")) {
          map.setLayoutProperty("voies-labels", "visibility", "visible");
        }
        map.setLayoutProperty("underground-labels", "visibility", "visible");
      }
    }
  }, [hideLabels, map]);

  return { hideLabels, setHideLabels };
};

export default useHideLabels;
