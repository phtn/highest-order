import type { Metadata } from "next";
import { Content } from "./content";
export const metadata: Metadata = {
  title: "Initializing...",
};

export default async function Page() {
  return <Content />;
}
