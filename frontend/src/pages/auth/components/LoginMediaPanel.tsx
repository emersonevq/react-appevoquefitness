import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type MediaKind = "image" | "video" | "message";

interface MediaItem {
  id: string | number;
  type: MediaKind;
  url?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  alt?: string;
  mime?: string;
}

async function fetchLoginMedia(signal?: AbortSignal): Promise<MediaItem[]> {
  const res = await apiFetch("/login-media", { signal });
  if (!res.ok) throw new Error("failed");
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data as MediaItem[];
}

export default function LoginMediaPanel() {
  const defaultItems: MediaItem[] = [
    {
      id: "default-1",
      type: "image",
      url: "https://cdn.builder.io/api/v1/image/assets%2Ffebea1b69437410ebd88e454001ca510%2Fe38b6c90873e4ea48f163db39b62fff9?format=webp&width=1600",
      alt: "Evoque Academia",
    },
    {
      id: "default-2",
      type: "image",
      url: "https://cdn.builder.io/api/v1/image/assets%2Ffebea1b69437410ebd88e454001ca510%2F3a4a4f300e384651b805810074ea77d3?format=webp&width=1600",
      alt: "Evoque Collection",
    },
  ];

  const [items, setItems] = useState<MediaItem[]>(defaultItems);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchLoginMedia(ac.signal)
      .then((list) => {
        if (list.length > 0) {
          setItems(list);
        }
      })
      .catch(() => {
        // Use default items
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const handleAutoplay = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const index = emblaApi.selectedIndex;
      const item = items[index];

      if (item?.type === "video") {
        // For videos, wait for them to end
        const slides = emblaApi.containerNode().querySelectorAll(".embla__slide");
        const videoEl = slides[index]?.querySelector("video") as HTMLVideoElement | null;

        if (videoEl) {
          const onVideoEnd = () => {
            videoEl.removeEventListener("ended", onVideoEnd);
            emblaApi.scrollNext();
          };
          videoEl.addEventListener("ended", onVideoEnd, { once: true });
        }
      } else {
        // For images, advance every 6 seconds
        timeoutRef.current = setTimeout(() => {
          emblaApi.scrollNext();
        }, 6000);
      }
    };

    handleAutoplay();
    emblaApi.on("select", handleAutoplay);

    return () => {
      emblaApi.off("select", handleAutoplay);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [emblaApi, items]);

  return (
    <div className="relative overflow-hidden rounded-2xl mx-auto w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] md:w-[520px] md:h-[520px] lg:w-[560px] lg:h-[560px] xl:w-[640px] xl:h-[640px]">
      <div
        className="absolute inset-0 brand-gradient opacity-70"
        aria-hidden="true"
      />
      <div className="relative h-full embla" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {items.map((item) => (
            <div
              key={item.id}
              className="embla__slide min-w-0 flex-[0_0_100%] h-full"
            >
              {item.type === "image" && item.url ? (
                <img
                  src={item.url}
                  alt={item.alt || "Mídia"}
                  className="w-full h-full object-cover"
                />
              ) : item.type === "video" && item.url ? (
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  controls={false}
                  preload="auto"
                >
                  <source src={item.url} type={item.mime || "video/mp4"} />
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <div
                    className={cn(
                      "rounded-xl p-6 w-full max-w-md text-center",
                      "bg-white/5 backdrop-blur border border-white/10 text-white",
                    )}
                  >
                    {item.title && (
                      <h3 className="text-xl font-bold tracking-tight">
                        {item.title}
                      </h3>
                    )}
                    {item.description && (
                      <p className="mt-2 text-sm/6 text-white/90">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
