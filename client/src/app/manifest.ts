import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Highlights — your link shelf",
    short_name: "Highlights",
    description:
      "Save links, check if they are alive, and keep a preview of everything you want to read later.",
    id: "/",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b0e14",
    theme_color: "#0b0e14",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
