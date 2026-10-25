import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbfaf5" }}>
        <svg width="132" height="132" viewBox="0 0 24 24">
          <defs>
            <clipPath id="l"><rect width="11.4" height="24" /></clipPath>
            <clipPath id="r"><rect x="12.6" width="11.4" height="24" /></clipPath>
          </defs>
          <path d="M12 2.2C12 2.2 4.6 10 4.6 14.9a7.4 7.4 0 0 0 14.8 0C19.4 10 12 2.2 12 2.2Z" fill="#14886a" clipPath="url(#l)" />
          <path d="M12 2.2C12 2.2 4.6 10 4.6 14.9a7.4 7.4 0 0 0 14.8 0C19.4 10 12 2.2 12 2.2Z" fill="#f5b81c" clipPath="url(#r)" />
        </svg>
      </div>
    ),
    size,
  )
}
