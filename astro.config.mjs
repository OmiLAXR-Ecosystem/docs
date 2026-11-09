import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// Written by scripts/packages.mjs (make packages / make local): one entry per package with its sidebar.
const manifestUrl = new URL("./src/generated/packages.json", import.meta.url);
const packages = existsSync(manifestUrl) ? JSON.parse(readFileSync(manifestUrl, "utf8")) : [];
if (packages.length === 0) console.warn("No package docs generated yet. Run `make packages` or `make local` first.");

// https://astro.build/config
export default defineConfig({
  site: "https://docs.omilaxr.dev/",
  integrations: [
    starlight({
      title: "OmiLAXR Docs",
      description: "Documentation of OmiLAXR, the learning analytics tracking framework for Unity and XR.",
      logo: { src: "./src/assets/omilaxr.svg" },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/custom.css"],
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/OmiLAXR-Ecosystem" },
        { icon: "discord", label: "Discord", href: "https://discord.gg/u4gtXTBEx3" },
      ],
      editLink: { baseUrl: "https://github.com/OmiLAXR-Ecosystem/docs/edit/main/" },
      lastUpdated: false,
      sidebar: [
        { label: "Start here", items: [{ autogenerate: { directory: "start" } }] },
        ...packages.map((pkg) => ({ label: pkg.label, collapsed: pkg.slug !== "core", items: pkg.sidebar })),
      ],
    }),
  ],
});
