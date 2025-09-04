import { Content } from "./content";
import dynamic from "next/dynamic";

const VimMode = dynamic(() => import("@/components/code/vim"));

export default async function Page() {
  return (
    <Content>
      <VimMode />
    </Content>
  );
}
