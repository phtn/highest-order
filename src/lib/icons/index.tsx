"use client";

import { icons, type IconNameType } from "@/lib/icons/icons";
import type { IconData, IconProps } from "@/lib/icons/types";
import { motion, MotionProps } from "motion/react";
import type { FC } from "react";
import { cn } from "../utils";

export type IconName = IconNameType;

export const Icon: FC<IconProps & { motionprops?: MotionProps }> = ({
  name,
  className,
  size = 24,
  color = "currentColor",
  solid = true,
  ...props
}) => {
  const icon = icons[name] as IconData;

  return (
    <motion.div {...props.motionprops}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={icon.viewBox ?? "0 0 24 24"}
        width={size}
        height={size}
        className={cn("size-4 shrink-0", className)}
        fill={solid ? color : "none"}
        stroke={solid ? undefined : color}
        strokeWidth={solid ? 0 : 1}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
        dangerouslySetInnerHTML={{ __html: icon.symbol }}
      />
    </motion.div>
  );
};
