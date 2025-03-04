"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Image } from "@heroui/image";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { User } from "@supabase/supabase-js";

import { MailIcon } from "@/components/icons";

const categories = [
  { key: "motors", label: "Motors", emoji: "🚗" },
  { key: "property", label: "Property", emoji: "🏠" },
  { key: "jobs", label: "Jobs", emoji: "💼" },
  { key: "services", label: "Services", emoji: "🛠️" },
  { key: "farming", label: "Farming", emoji: "🚜" },
  { key: "electronics", label: "Electronics", emoji: "📱" },
  { key: "homeAndGarden", label: "Home & Garden", emoji: "🛋️" },
  { key: "fashion", label: "Fashion", emoji: "👗" },
  { key: "sportsAndHobbies", label: "Sports & Hobbies", emoji: "⚽" },
  { key: "babyAndKids", label: "Baby & Kids", emoji: "🍼" },
  { key: "business", label: "Business", emoji: "🏢" },
  { key: "education", label: "Education", emoji: "📚" },
  { key: "community", label: "Community", emoji: "🗣️" },
  { key: "pets", label: "Pets", emoji: "🐶" },
  {
    key: "antiquesAndCollectables",
    label: "Antiques & Collectables",
    emoji: "🖼️",
  },
  { key: "artAndCrafts", label: "Art & Crafts", emoji: "🎨" },
  { key: "healthAndBeauty", label: "Health & Beauty", emoji: "💄" },
  { key: "booksAndMagazines", label: "Books & Magazines", emoji: "📖" },
  { key: "musicAndInstruments", label: "Music & Instruments", emoji: "🎸" },
  { key: "tickets", label: "Tickets", emoji: "🎟️" },
  { key: "freeStuff", label: "Free Stuff", emoji: "🎁" },
  { key: "swap", label: "Swap", emoji: "🔄" },
  { key: "wanted", label: "Wanted", emoji: "📢" },
];

interface PostAdFormProps {
  user: User;
}

export default function PostAdForm({ user }: PostAdFormProps) {
  const [section, setSection] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(true);
  const [isEditingDesc, setIsEditingDesc] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const email = user.email || "anon@no.mail";

  const MIN_TITLE_LENGTH = 5;
  const MAX_TITLE_LENGTH = 50;
  const MIN_DESC_LENGTH = 10;
  const MAX_DESC_LENGTH = 500;

  function shouldEdit(item: string, callback: (n: null) => void) {
    if (window.confirm(`Are you sure you want to edit the ${item}?`)) {
      callback(null);
    }
  }

  return (
    <div className="flex justify-center items-center pt-8">
      <Card
        className="w-full mb-4 max-w-md font-serif bg-zinc-200 dark:bg-zinc-800"
        radius="none"
        shadow="lg"
      >
        <CardHeader className="flex justify-center items-center mb-2 pb-1 bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800">
          <button
            className="text-lg font-bold uppercase tracking-wide bg-transparent border-none cursor-pointer"
            onClick={() => shouldEdit("section", () => setSection(null))}
          >
            {section ?? "Create a New Ad"}
          </button>
        </CardHeader>
        <CardBody>
          {section === null && (
            <>
              <Select isRequired items={categories} label="Category">
                {(category) => (
                  <SelectItem
                    onPress={() => {
                      setSection(category.label);
                    }}
                  >
                    {category.label}
                  </SelectItem>
                )}
              </Select>
              <hr className="my-2 border-zinc-300 dark:border-zinc-600" />
            </>
          )}
          {image ? (
            <Image
              alt={title ?? "Ad Image"}
              className="dark:grayscale"
              radius="none"
              src={image}
              width={400}
              onClick={() => shouldEdit("picture", () => setImage(null))}
            />
          ) : (
            <>
              <Input
                accept="image/*"
                label="Image"
                type="file"
                onChange={(e) =>
                  setImage(URL.createObjectURL(e.target.files?.[0]!))
                }
              />
              <hr className="my-2 border-zinc-300 dark:border-zinc-600" />
            </>
          )}
          {!isEditingTitle && title && title.length >= MIN_TITLE_LENGTH ? (
            <button
              className="text-lg font-semibold flex justify-center items-center mb-2 bg-transparent border-none p-0 cursor-pointer"
              onClick={() =>
                shouldEdit("title ", () => setIsEditingTitle(true))
              }
            >
              {title}
            </button>
          ) : (
            <>
              <Input
                isRequired
                label="Title"
                maxLength={MAX_TITLE_LENGTH}
                minLength={MIN_TITLE_LENGTH}
                placeholder={`Enter Ad Title (${MIN_TITLE_LENGTH} - ${MAX_TITLE_LENGTH} characters)`}
                value={title}
                onBlur={() => setIsEditingTitle(false)}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setIsEditingTitle(true)}
              />
              <hr className="my-2 border-zinc-300 dark:border-zinc-600" />
            </>
          )}
          {!isEditingDesc &&
          description &&
          description.length >= MIN_DESC_LENGTH ? (
            <button
              className="text-md mb-3 leading-relaxed flex justify-center items-center bg-transparent border-none p-0 text-left w-full cursor-pointer"
              onClick={() =>
                shouldEdit("description ", () => setIsEditingDesc(true))
              }
            >
              {description}
            </button>
          ) : (
            <>
              <Textarea
                isRequired
                label="Description"
                maxLength={MAX_DESC_LENGTH}
                minLength={MIN_DESC_LENGTH}
                placeholder={`Enter Description (${MIN_DESC_LENGTH} - ${MAX_DESC_LENGTH} characters)`}
                value={description}
                onBlur={() => setIsEditingDesc(false)}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setIsEditingDesc(true)}
              />
              <hr className="my-2 border-zinc-300 dark:border-zinc-600" />
            </>
          )}
          <Input
            label="Price"
            labelPlacement="outside"
            placeholder="Enter Price"
            startContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-default-400 text-small">€</span>
              </div>
            }
            step={0.01}
            type="number"
            validate={(value) =>
              parseFloat(value) >= 0 ? null : "Please enter a proper price"
            }
            value={price !== null ? price.toString() : ""}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
          />
        </CardBody>
        <CardFooter className="text-md border-t border-zinc-300 dark:border-zinc-600 flex justify-between">
          <p className="flex items-center">
            <MailIcon className="mr-1" /> &#64;{email?.split("@")[0]}
          </p>
          {price !== null && (
            <p className="text-md text-blue-500 font-medium">
              <strong>{price > 0 ? `€${price.toFixed(2)}` : "Free"}</strong>
            </p>
          )}
        </CardFooter>
        <CardFooter className="text-md border-t border-zinc-300 dark:border-zinc-600 flex justify-between">
          <Button
            className="mt-3 w-full bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800"
            variant="ghost"
          >
            Submit Ad
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
