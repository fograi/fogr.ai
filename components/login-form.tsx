"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { MailIcon } from "./icons";

interface LoginFormProps {
  onEmailSubmit: (email: string) => void;
  message?: string;
}

export default function LoginForm({
  onEmailSubmit,
  message = "Verify email to create ad",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (email) {
      setIsLoading(true);
      onEmailSubmit(email);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 flex justify-center">{message}</h1>
      <Input
        autoComplete="email"
        className="mb-4"
        endContent={
          <MailIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
        }
        placeholder="Enter your email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="mt-8 flex justify-center">
        <Button
          color="success"
          isDisabled={isLoading}
          isLoading={isLoading}
          onPress={handleSubmit}
        >
          {`Send${isLoading ? "ing" : ""} Email Link`}
        </Button>
      </div>
    </div>
  );
}
