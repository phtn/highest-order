import type { SVGProps } from "react";
import type { IconNameType } from "../icons/icons";
import type { ClassName } from "../../app/types";
export type IconList = Record<
  IconNameType,
  { viewBox: string; symbol: string }
>;

export type IconName = IconNameType;

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconNameType;
  className?: ClassName;
  size?: number;
  color?: string;
  solid?: boolean;
}

export interface IconData {
  symbol: string;
  set: string;
  viewBox?: string;
}
