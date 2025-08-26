"use client";

import { icons, type IconNameType } from "@/lib/icons/icons";
import type { IconData, IconProps } from "@/lib/icons/types";
import { motion, MotionProps } from "motion/react";
import { memo, type FC } from "react";
import { cn } from "../utils";

export type IconName = IconNameType;

export const Icon: FC<IconProps & { motionprops?: MotionProps }> = memo(
  ({
    name,
    className,
    size = 24,
    color = "currentColor",
    solid = true,
    motionprops,
    ...props
  }) => {
    const icon = icons[name] as IconData | undefined;

    // graceful fallback if icon not found
    const fallback = icons["unsupported"] as IconData | undefined;
    const svgSymbol = (icon && icon.symbol) ?? fallback?.symbol ?? "";
    const viewBox = (icon && icon.viewBox) ?? fallback?.viewBox ?? "0 0 24 24";

    // accessibility: hide from assistive tech unless an aria-label/role is provided
    const ariaHidden =
      !("aria-label" in props) && !("ariaLabel" in props) && !("role" in props);

    const svgElement = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={size}
        height={size}
        className={cn("size-4 shrink-0", className)}
        fill={solid ? color : "none"}
        stroke={solid ? undefined : color}
        strokeWidth={solid ? 0 : 1}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={ariaHidden}
        // keep SVG props clean
        {...props}
        dangerouslySetInnerHTML={{ __html: svgSymbol }}
      />
    );

    if (motionprops) {
      return <motion.div {...motionprops}>{svgElement}</motion.div>;
    }

    return <div>{svgElement}</div>;
  },
);

Icon.displayName = "Icon";
