"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Checkbox } from "@heroui/checkbox";
import { Image } from "@heroui/image";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button, PressEvent } from "@heroui/button";
import { User } from "@supabase/supabase-js";
import { Code } from "@heroui/code";
import filter from "leo-profanity";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

import { MailIcon } from "@/components/icons";
import { bannedWords } from "@/constants/banned-words";
import { categories } from "@/constants/categories";
import {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESC_LENGTH,
  MAX_DESC_LENGTH,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "@/constants/validations";

interface PostAdFormProps {
  user: User;
}

filter.add(bannedWords);

export default function PostAdForm({ user }: PostAdFormProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [noPrice, setNoPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const email = user.email || "anon@no.mail";

  function shouldEdit(item: string, callback: (n: null) => void) {
    if (window.confirm(`Are you sure you want to edit the ${item}?`)) {
      callback(null);
    }
  }

  const handleSubmit = (_e: PressEvent) => {
    setError(null);
    setSuccess(null);

    if (!category) {
      setError("Please select a category.");

      return;
    }

    if (imageFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return alert(
          `Invalid image type. Only ${ALLOWED_IMAGE_TYPES.join(", ")} are allowed.`,
        );
      }
      if (imageFile.size > MAX_IMAGE_SIZE) {
        return alert("Image is too large. Maximum size is 5MB.");
      }
    }

    if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
      setError(
        `Title must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters.`,
      );

      return;
    }

    if (
      description.length < MIN_DESC_LENGTH ||
      description.length > MAX_DESC_LENGTH
    ) {
      setError(
        `Description must be between ${MIN_DESC_LENGTH} and ${MAX_DESC_LENGTH} characters.`,
      );

      return;
    }

    if (price && (isNaN(price) || Number(price) < 0)) {
      return setError("Invalid price.");
    }

    // 🚩 Local Moderation (Fastest to Slowest)
    const combinedText = `${title} ${description}`;

    if (filter.check(combinedText)) {
      return setError("Failed profanity filter.");
    }

    const obscenity = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });

    if (obscenity.hasMatch(combinedText)) {
      return setError("Failed obscenity filter.");
    }

    const formData = new FormData();

    formData.append("category", category);
    formData.append("title", title);
    formData.append("description", description);
    price && formData.append("price", price.toString());
    imageFile && formData.append("image", imageFile);

    setLoading(true);
    fetch("/api/submit", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to submit ad.");
        }
        setSuccess(response.statusText);
      })
      .catch((error) => {
        setError(error.message);
      })
      .finally(() => setLoading(false));
  };

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
            onClick={() => shouldEdit("category", () => setCategory(null))}
          >
            {category ?? "Create a New Ad"}
          </button>
        </CardHeader>
        <CardBody>
          {category === null && (
            <>
              <Select
                isRequired
                items={categories}
                label="Category"
                labelPlacement="outside"
              >
                {(category) => (
                  <SelectItem
                    key={category.key}
                    startContent={category.emoji}
                    onPress={() => {
                      setCategory(category.label);
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
                label={`Image (Max ${MAX_IMAGE_SIZE / 1_000_000}MB, ${ALLOWED_IMAGE_TYPES.join(", ")}`}
                labelPlacement="outside"
                type="file"
                onChange={(e) => {
                  setImage(URL.createObjectURL(e.target.files?.[0]!));
                  setImageFile(e.target.files?.[0]!);
                }}
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
                labelPlacement="outside"
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
          <>
            <Textarea
              isRequired
              label="Description"
              labelPlacement="outside"
              maxLength={MAX_DESC_LENGTH}
              minLength={MIN_DESC_LENGTH}
              placeholder={`Enter Description (${MIN_DESC_LENGTH} - ${MAX_DESC_LENGTH} characters)`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <hr className="my-2 border-zinc-300 dark:border-zinc-600" />
          </>
          <div className="flex items-baseline gap-12 w-fit">
            <Input
              className="flex-grow"
              isDisabled={noPrice}
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
              value={noPrice ? "" : price !== null ? price.toString() : ""}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
            <Checkbox
              isSelected={noPrice}
              onChange={() => {
                setNoPrice(!noPrice);
                setPrice(null);
              }}
            >
              No&nbsp;Price
            </Checkbox>
          </div>
        </CardBody>
        <CardFooter className="text-md border-t border-zinc-300 dark:border-zinc-600 flex justify-between">
          <p className="flex items-center">
            <MailIcon className="mr-1" /> &#64;{email?.split("@")[0]}
          </p>
          {price !== null && (
            <p className="text-md text-blue-500 font-medium">
              <strong>
                {price > 0
                  ? new Intl.NumberFormat("en-IE", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
                    }).format(price)
                  : "Free"}
              </strong>
            </p>
          )}
        </CardFooter>
        {(error || success) && (
          <CardFooter className="text-md border-t border-zinc-300 dark:border-zinc-600 flex justify-center">
            <Code color={error ? "danger" : "success"} size="lg">
              {error ?? success}
            </Code>
          </CardFooter>
        )}
        <CardFooter className="text-md border-t border-zinc-300 dark:border-zinc-600 flex justify-between">
          <Button
            className="mt-3 w-full bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800"
            isDisabled={loading}
            variant="ghost"
            onPress={handleSubmit}
          >
            Submit Ad
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
