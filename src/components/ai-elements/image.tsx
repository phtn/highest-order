import { cn } from "@/lib/utils";
import type { Experimental_GeneratedImage } from "ai";
import Image from "next/image";

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
};

export const Img = ({
  base64,
  // uint8Array,
  mediaType,
  ...props
}: ImageProps) => (
  <Image
    {...props}
    alt={props.alt ?? "image-generated"}
    className={cn(
      "h-auto max-w-full overflow-hidden rounded-md",
      props.className,
    )}
    src={`data:${mediaType};base64,${base64}`}
  />
);
