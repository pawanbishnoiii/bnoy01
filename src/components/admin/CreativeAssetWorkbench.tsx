import { useMemo, useState } from "react";
import {
  Check,
  Download,
  Image as ImageIcon,
  Layers3,
  Monitor,
  Search,
  Smartphone,
  Square,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import assetBrowser from "@/assets/editor-kit/asset-00.webp";
import assetPhone from "@/assets/editor-kit/asset-01.webp";
import assetDesktop from "@/assets/editor-kit/asset-02.webp";
import assetAi from "@/assets/editor-kit/asset-03.webp";
import assetCloud from "@/assets/editor-kit/asset-04.webp";
import assetShop from "@/assets/editor-kit/asset-05.webp";
import assetAnalytics from "@/assets/editor-kit/asset-06.webp";
import assetSecurity from "@/assets/editor-kit/asset-07.webp";
import assetBooking from "@/assets/editor-kit/asset-08.webp";
import assetVersions from "@/assets/editor-kit/asset-09.webp";
import assetMedia from "@/assets/editor-kit/asset-10.webp";
import assetLaunch from "@/assets/editor-kit/asset-11.webp";

type Category = "All" | "Product" | "Business" | "System";
type Format = "square" | "landscape" | "story";

const assets = [
  { id: "browser", name: "Web canvas", category: "Product", src: assetBrowser },
  { id: "phone", name: "Mobile UI", category: "Product", src: assetPhone },
  { id: "desktop", name: "Desktop editor", category: "Product", src: assetDesktop },
  { id: "ai", name: "AI assistant", category: "System", src: assetAi },
  { id: "cloud", name: "Cloud upload", category: "System", src: assetCloud },
  { id: "shop", name: "Commerce", category: "Business", src: assetShop },
  { id: "analytics", name: "Analytics", category: "Business", src: assetAnalytics },
  { id: "security", name: "Security", category: "System", src: assetSecurity },
  { id: "booking", name: "Call booking", category: "Business", src: assetBooking },
  { id: "versions", name: "Version control", category: "System", src: assetVersions },
  { id: "media", name: "Media library", category: "Product", src: assetMedia },
  { id: "launch", name: "Launch", category: "Business", src: assetLaunch },
] as const;

const formats: Record<
  Format,
  { label: string; width: number; height: number; icon: typeof Square }
> = {
  square: { label: "Square", width: 1200, height: 1200, icon: Square },
  landscape: { label: "Landscape", width: 1600, height: 900, icon: Monitor },
  story: { label: "Story", width: 1080, height: 1920, icon: Smartphone },
};

const backgrounds = ["#ffffff", "#f6c945", "#0e766e", "#1558a6", "#171717"];

export default function CreativeAssetWorkbench({ onOpenMedia }: { onOpenMedia: () => void }) {
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("browser");
  const [format, setFormat] = useState<Format>("square");
  const [background, setBackground] = useState(backgrounds[1]);
  const [scale, setScale] = useState(72);
  const [exporting, setExporting] = useState(false);
  const selected = assets.find((asset) => asset.id === selectedId) || assets[0];
  const visibleAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          (category === "All" || asset.category === category) &&
          asset.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query],
  );
  const ratio = `${formats[format].width} / ${formats[format].height}`;

  const download = async () => {
    setExporting(true);
    try {
      const { width, height } = formats[format];
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      const image = new Image();
      image.src = selected.src;
      await image.decode();
      const maxWidth = width * (scale / 100);
      const maxHeight = height * (scale / 100);
      const imageRatio = image.naturalWidth / image.naturalHeight;
      let drawWidth = maxWidth;
      let drawHeight = drawWidth / imageRatio;
      if (drawHeight > maxHeight) {
        drawHeight = maxHeight;
        drawWidth = drawHeight * imageRatio;
      }
      ctx.drawImage(
        image,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
      const link = document.createElement("a");
      link.download = `bnoy-${selected.id}-${format}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export image");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section
      className="overflow-hidden border border-border bg-card"
      aria-labelledby="creative-workbench-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-primary">CREATIVE WORKBENCH</p>
          <h2 id="creative-workbench-title" className="font-display text-lg font-bold">
            Compose product artwork
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onOpenMedia}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Media cloud
          </Button>
          <Button size="sm" onClick={download} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export PNG"}
          </Button>
        </div>
      </div>

      <div className="grid min-h-[560px] xl:grid-cols-[210px_minmax(420px,1fr)_260px]">
        <aside className="border-b border-border p-4 xl:border-b-0 xl:border-r">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Layers3 className="h-4 w-4" />
            Assets
          </p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets"
              className="h-9 pl-8"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-1">
            {(["All", "Product", "Business", "System"] as Category[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex h-9 items-center justify-between px-3 text-left text-sm transition-colors ${category === item ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {item}
                <span className="text-xs opacity-70">
                  {item === "All"
                    ? assets.length
                    : assets.filter((asset) => asset.category === item).length}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground">LAYERS</p>
            <button
              className="mt-2 flex w-full items-center gap-2 bg-muted px-3 py-2 text-left text-sm"
              type="button"
            >
              <img src={selected.src} alt="" className="h-8 w-8 object-contain" />
              {selected.name}
              <Check className="ml-auto h-4 w-4 text-primary" />
            </button>
            <div className="mt-1 flex items-center gap-2 px-3 py-2 text-sm">
              <span className="h-5 w-5 border border-border" style={{ background }} />
              Background
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col bg-muted/40">
          <div className="flex flex-wrap items-center justify-center gap-1 border-b border-border bg-card px-3 py-2">
            {(Object.keys(formats) as Format[]).map((key) => {
              const Icon = formats[key].icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormat(key)}
                  title={`${formats[key].label} ${formats[key].width} x ${formats[key].height}`}
                  className={`flex h-9 items-center gap-2 px-3 text-xs font-semibold ${format === key ? "bg-foreground text-background" : "hover:bg-muted"}`}
                >
                  <Icon className="h-4 w-4" />
                  {formats[key].label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden p-5 sm:p-8">
            <div
              className="relative flex w-full max-w-[640px] items-center justify-center overflow-hidden shadow-xl transition-all"
              style={{ aspectRatio: ratio, background }}
            >
              <img
                src={selected.src}
                alt={`${selected.name} composition preview`}
                className="max-h-full max-w-full object-contain transition-transform duration-200"
                style={{ width: `${scale}%`, height: `${scale}%` }}
              />
              <span
                className={`absolute bottom-3 left-3 text-[10px] font-bold ${background === "#171717" || background === "#1558a6" || background === "#0e766e" ? "text-white" : "text-black"}`}
              >
                BNOY STUDIOS
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-px border-t border-border bg-border sm:grid-cols-6 xl:grid-cols-12">
            {visibleAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedId(asset.id)}
                title={asset.name}
                aria-label={`Use ${asset.name}`}
                className={`relative aspect-square bg-card p-2 hover:bg-muted ${asset.id === selected.id ? "outline outline-2 -outline-offset-2 outline-primary" : ""}`}
              >
                <img
                  src={asset.src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
            {!visibleAssets.length && (
              <p className="col-span-full bg-card p-4 text-center text-sm text-muted-foreground">
                No matching assets.
              </p>
            )}
          </div>
        </div>

        <aside className="border-t border-border p-4 xl:border-l xl:border-t-0">
          <p className="text-sm font-semibold">Inspector</p>
          <dl className="mt-4 space-y-3 border-b border-border pb-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Selected asset</dt>
              <dd className="mt-1 font-medium">{selected.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Output</dt>
              <dd className="mt-1 font-mono text-xs">
                {formats[format].width} x {formats[format].height} PNG
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">BACKGROUND</p>
            <div className="flex flex-wrap gap-2">
              {backgrounds.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use ${color} background`}
                  onClick={() => setBackground(color)}
                  className={`h-8 w-8 border border-border ${background === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <div className="mt-6">
            <label
              htmlFor="asset-scale"
              className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <ZoomIn className="h-3.5 w-3.5" />
                SCALE
              </span>
              <span>{scale}%</span>
            </label>
            <input
              id="asset-scale"
              type="range"
              min="35"
              max="92"
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            The preview exports at full resolution. Choose an asset, output format, background and
            scale, then export it directly as PNG.
          </div>
        </aside>
      </div>
    </section>
  );
}
