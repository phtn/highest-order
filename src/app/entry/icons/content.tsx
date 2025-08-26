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
        <div className="flex items-center justify-start gap-10">
          <Card className="h-96 w-md">
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
