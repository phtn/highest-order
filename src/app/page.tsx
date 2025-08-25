import type { Metadata } from "next";
import { Content } from "./content";

export const metadata: Metadata = {
  title: "Chat Template - re-up.ph",
};

export default async function Page() {
  return <Content />;
}
