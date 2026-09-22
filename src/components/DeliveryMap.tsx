"use client";

type DeliveryMapProps = {
  latitude?: string | number | null;
  longitude?: string | number | null;
  label?: string;
};

export function DeliveryMap({
  latitude,
  longitude,
  label = "Last known delivery location",
}: DeliveryMapProps) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  if (!hasLocation) {
    return (
      <div
        style={{
          padding: 18,
          background: "var(--soft)",
          border: "1px solid var(--line)",
          color: "var(--muted)",
          fontSize: ".9rem",
        }}
      >
        No live courier location is available. This page is showing verified delivery events only.
      </div>
    );
  }

  const delta = 0.035;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
  const directionsUrl = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
    String(lat)
  )}&mlon=${encodeURIComponent(String(lng))}#map=13/${encodeURIComponent(String(lat))}/${encodeURIComponent(
    String(lng)
  )}`;

  return (
    <div>
      <iframe
        title={label}
        aria-label={label}
        src={mapUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          minHeight: 280,
          width: "100%",
          border: "1px solid var(--line)",
          borderRadius: 16,
          background: "var(--soft)",
        }}
      />
      <p style={{ color: "var(--muted)", fontSize: ".75rem", marginTop: 8 }}>
        Last known location only. BGV does not report live GPS without courier data. Map data ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap contributors
        </a>
        .{" "}
        <a href={directionsUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
          Open full map
        </a>
      </p>
    </div>
  );
}
