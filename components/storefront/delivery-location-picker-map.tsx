"use client";

import {useEffect} from "react";
import {CircleMarker, MapContainer, TileLayer, useMap, useMapEvents} from "react-leaflet";

type Props = {
  center: [number, number];
  selectedLocation: [number, number] | null;
  onSelectLocation: (latitude: number, longitude: number) => void;
};

function MapClickHandler({onSelectLocation}: {onSelectLocation: (latitude: number, longitude: number) => void}) {
  useMapEvents({
    click(event) {
      onSelectLocation(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function RecenterMap({center}: {center: [number, number]}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), {animate: true});
  }, [center, map]);

  return null;
}

export function DeliveryLocationPickerMap({center, selectedLocation, onSelectLocation}: Props) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="h-64 w-full overflow-hidden rounded-xl border border-charcoal-900/20"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap center={center} />
      <MapClickHandler onSelectLocation={onSelectLocation} />

      {selectedLocation ? (
        <CircleMarker center={selectedLocation} radius={10} pathOptions={{color: "#b87861", fillOpacity: 0.75}} />
      ) : null}
    </MapContainer>
  );
}
