"use client";
//
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wrapper } from "@/components/wrapper";

export const Content = () => {
  return (
    <Wrapper>
      <main className="p-16">
        <div className="flex items-center justify-center gap-10">
          <Card className="h-96 w-md">
            <CardHeader>
              <CardTitle>Icons</CardTitle>
              <CardDescription>Icons List Card</CardDescription>
            </CardHeader>
            <CardContent>Content</CardContent>
          </Card>
          <Card className="h-96 w-md after:rounded-[inherit] after:absolute after:inset-0 after:shadow-[0_1px_2px_0_rgb(0_0_0/.25),inset_0_0.1px_0.5px_1px_rgb(255_255_255/.18)]">
            <CardHeader>
              <CardTitle>Icons</CardTitle>
              <CardDescription>Icons List Card</CardDescription>
            </CardHeader>
            <CardContent>Content</CardContent>
          </Card>
        </div>
      </main>
    </Wrapper>
  );
};
