"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabaseClient";

interface WelcomeProps {
  user: User;
  onLogout: () => void;
}

export default function Profile({ user, onLogout }: WelcomeProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch display_name from Supabase auth.users
  useEffect(() => {
    const fetchUsername = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        alert("Fetch error: " + error);

        return;
      }

      if (data?.user?.user_metadata?.display_name) {
        setUsername(data.user.user_metadata.display_name);
      }
    };

    fetchUsername();
  }, [user.id]);

  // Update display_name in Supabase auth.users
  const updateUsername = async () => {
    if (!username.trim()) return;
    setLoading(true);
    const data = {
      display_name: username,
    };
    const { error } = await supabase.auth.updateUser({ data });

    setLoading(false);
    if (error) {
      alert("Error updating username:" + error.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold flex justify-center">
        You are logged in with email:
      </h1>
      <h2 className="text-xl font-bold mb-4 flex justify-center">
        {user.email}
      </h2>
      <div className="flex flex-col items-center mt-4">
        <Input
          disabled={loading}
          label="Username"
          placeholder="Enter your username"
          value={username}
          onBlur={updateUsername}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="mt-8 flex justify-center">
        <Button color="danger" onPress={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
