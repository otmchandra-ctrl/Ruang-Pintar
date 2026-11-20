import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ruang Pintar — School Digital Operating Platform",
    short_name: "Ruang Pintar",
    description:
      "School Digital Operating Platform terintegrasi untuk akademik, CBT, dan administrasi sekolah.",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    background_color: "#090D16",
    theme_color: "#0F172A",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["education", "productivity"],
    shortcuts: [
      {
        name: "CBT & Ujian",
        short_name: "CBT",
        description: "Universal CBT Exam Engine",
        url: "/cbt-ujian",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Jadwal Saya",
        short_name: "Jadwal",
        description: "Jadwal Mengajar dan Pembelajaran",
        url: "/jadwal-saya",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Kelas Saya",
        short_name: "Kelas",
        description: "Ruang Kelas & Siswa",
        url: "/kelas-saya",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
