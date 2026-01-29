// import { cn } from "@/lib/utils";
// import { animate, svg, stagger } from "animejs";
// import { ReactNode, useEffect } from "react";

// interface PathTracerProps {
//   className?: string;
//   children?: ReactNode;
// }

// export const PathTracer = ({ className, children }: PathTracerProps) => {
//   useEffect(() => {
//     animate(svg.createDrawable(`.${".nice .slow .strokes"} ${className}`), {
//       draw: ["0 0", "0 0.5", "0 1", "1 1"],
//       ease: "inOutQuad",
//       duration: 1600,
//       delay: stagger(50),
//       loop: true,
//       autoplay: true,
//     });
//   }, [className]);

//   return <div className="absolute w-full flex justify-center">{children}</div>;
// };
