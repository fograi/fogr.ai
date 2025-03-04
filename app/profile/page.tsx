"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { User } from "@supabase/supabase-js";

import Profile from "@/components/profile";
import LoginForm from "@/components/login-form";
import MessageDisplay from "@/components/submission-message";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [error, setError] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.slice(1));
    const errorCode = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (errorCode) {
      setError(true);
      setMessage(errorDescription || "An unknown error occurred.");
    }

    const fetchUser = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    };

    fetchUser();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMessage(null);
  };

  return (
    <section className="flex flex-col items-center justify-center">
      <Card className="w-auto p-4">
        <CardBody>
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : user ? (
            <Profile user={user} onLogout={handleLogout} />
          ) : message ? (
            <MessageDisplay error={error} message={message} />
          ) : (
            <LoginForm
              message="Login to view profile"
              onEmailSubmit={handleEmailLink}
            />
          )}
        </CardBody>
      </Card>
    </section>
  );
}
