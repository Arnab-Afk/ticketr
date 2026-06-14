import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/ticketr-logo.png";
const LOGO_WIDTH = 152;
const LOGO_HEIGHT = 119;

export function BrandLogo({
  href = "/",
  className,
  height = 72,
  fullWidth = false,
}: {
  href?: string;
  className?: string;
  height?: number;
  /** Scale logo to fill container width (best for sidebar). */
  fullWidth?: boolean;
}) {
  const width = Math.round(height * (LOGO_WIDTH / LOGO_HEIGHT));

  const img = fullWidth ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="ticketr"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      decoding="async"
      className={cn("block h-auto w-full max-w-none", className)}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="ticketr"
      width={width}
      height={height}
      decoding="async"
      className={cn("block max-w-none", className)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-block shrink-0 leading-none">
        {img}
      </Link>
    );
  }

  return <div className="inline-block shrink-0 leading-none">{img}</div>;
}

/** Sidebar sweet spot — between tiny fixed height and full-width. */
export const SIDEBAR_LOGO_HEIGHT = 96;
