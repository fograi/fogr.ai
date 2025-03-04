"use client";

import { useEffect } from "react";
import { Code } from "@heroui/code";

interface MessageDisplayProps {
  message: string;
  error?: boolean;
}

export default function MessageDisplay({
  message,
  error,
}: MessageDisplayProps) {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 3000); // 3000 milliseconds = 3 seconds

      return () => clearTimeout(timer); // Cleanup the timer on unmount
    }
  }, [error]);

  return (
    <div className="flex justify-center items-center text-center">
      <Code color={error ? "danger" : "success"} size="lg">
        {message}
      </Code>
    </div>
  );
}
