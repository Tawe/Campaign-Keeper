import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Campaign Tracker: RPG Campaign Management for Dungeon Masters";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "72px",
          background: "#0b1020",
          position: "relative",
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: "#d4a95a",
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#d4a95a",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 20,
            display: "flex",
          }}
        >
          RPG Campaign Management
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            color: "#f3f0e8",
            lineHeight: 1.05,
            marginBottom: 28,
            display: "flex",
          }}
        >
          Campaign Tracker
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#b7b3a8",
            lineHeight: 1.4,
            maxWidth: 680,
            display: "flex",
          }}
        >
          Sessions, NPCs, locations, factions, and player recaps. Built for Dungeon Masters.
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 72,
            right: 72,
            fontSize: 16,
            color: "rgba(183,179,168,0.5)",
            display: "flex",
          }}
        >
          campaign-keeper.netlify.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
