"use client";

import Image from "next/image";
import Link from "next/link";
import { COVER_SIZES } from "@/lib/images/coverSizes";

export interface CarouselCard {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  onClick?: () => void;
  isCircular?: boolean;
}

interface SearchHorizontalCarouselProps {
  title: string;
  items: CarouselCard[];
}

export function SearchHorizontalCarousel({
  title,
  items,
}: SearchHorizontalCarouselProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {items.map((item) => {
          const inner = (
            <>
              <div
                className={`relative mb-3 aspect-square w-full overflow-hidden bg-surface-highlight shadow-md transition-transform group-hover:scale-[1.02] ${
                  item.isCircular ? "rounded-full" : "rounded-md"
                }`}
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes={COVER_SIZES.card}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl text-accent">
                    ♪
                  </div>
                )}
              </div>
              <p className="truncate text-sm font-semibold text-white group-hover:text-accent">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="truncate text-xs text-text-muted">{item.subtitle}</p>
              )}
            </>
          );

          const className =
            "group w-36 shrink-0 text-left sm:w-40";

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} className={className}>
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={className}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
