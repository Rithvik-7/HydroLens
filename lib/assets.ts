/** Public asset paths work at the domain root and under a GitHub Pages repo. */
export const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${path.replace(/^\/+/, "")}`;
