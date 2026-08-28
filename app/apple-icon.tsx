import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fb923c, #ea580c)",
          borderRadius: 36,
        }}
      >
        <svg width="126" height="126" viewBox="0 0 32 32">
          <path
            d="M16 6 C16 6, 22.5 14, 22.5 19 C22.5 22.6, 19.6 25.5, 16 25.5 C12.4 25.5, 9.5 22.6, 9.5 19 C9.5 14, 16 6, 16 6 Z"
            fill="#ffffff"
          />
          <circle cx="13.6" cy="20" r="1.7" fill="#ea580c" />
          <circle cx="18.4" cy="20" r="1.7" fill="#c2410c" />
        </svg>
      </div>
    ),
    size
  );
}
