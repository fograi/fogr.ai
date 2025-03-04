"use client";

import { Modal, ModalContent, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/react";
import { useState, useEffect } from "react";

import { PlusIcon } from "./icons";

import { supabase } from "@/lib/supabaseClient";
import LoginForm from "@/components/login-form";
import MessageDisplay from "@/components/submission-message";

const LoginModal = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [error, setError] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.slice(1)); // Remove the '#' and parse params
    const errorCode = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (errorCode) {
      setError(true);
      setMessage(errorDescription || "An unknown error occurred.");
    }

    // Clear the hash from the URL for a cleaner experience
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleEmailLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setError(true);
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link.");
    }
  };

  return (
    <>
      <Button
        isIconOnly
        aria-label="Login"
        radius="full"
        variant="light"
        onPress={onOpen}
      >
        <PlusIcon />
      </Button>
      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent className="bg-zinc-200 dark:bg-zinc-800">
          <ModalBody>
            {message ? (
              <MessageDisplay error={error} message={message} />
            ) : (
              <LoginForm onEmailSubmit={handleEmailLink} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LoginModal;
