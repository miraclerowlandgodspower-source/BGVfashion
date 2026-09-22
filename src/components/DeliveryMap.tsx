"use client";

import { useEffect, useRef } from "react";

type DeliveryMapProps = { latitude?: string | number | null; longitude?: string | number | null; label?: string };

export function DeliveryMap({ latitude, longitude, label = "Last known delivery location" }: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    if (!containerRef.current || !hasLocation || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;
    let disposed = false;
    let marker: any;
    let map: any;
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed || !containerRef.current) return;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      map = new mapboxgl.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/light-v11", center: [lng, lat], zoom: 12 });
      marker = new mapboxgl.Marker({ color: "#b08a3e" }).setLngLat([lng, lat]).addTo(map);
      mapRef.current = map;
    });
    return () => { disposed = true; marker?.remove(); map?.remove(); mapRef.current = null; };
  }, [hasLocation, lat, lng]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return <div style={{ padding: 18, background: "var(--soft)", border: "1px solid var(--line)", color: "var(--muted)", fontSize: ".9rem" }}>Mapbox is not configured for this deployment.</div>;
  if (!hasLocation) return <div style={{ padding: 18, background: "var(--soft)", border: "1px solid var(--line)", color: "var(--muted)", fontSize: ".9rem" }}>No live courier location is available. This page is showing verified delivery events only.</div>;

  return <div><div ref={containerRef} aria-label={label} style={{ minHeight: 280, width: "100%" }} /><p style={{ color: "var(--muted)", fontSize: ".75rem", marginTop: 8 }}>Last known location only. BGV does not report live GPS without courier data.</p></div>;
}
