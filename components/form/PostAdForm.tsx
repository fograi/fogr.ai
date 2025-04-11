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
import { mergeImagesToDataURL } from "@/lib/mergeImagesToDataUrl";

interface PostAdFormProps {
  user: User;
}

filter.add(bannedWords);

export default function PostAdForm({ user }: PostAdFormProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<Blob[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
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
  function shouldDelete(item: string, callback: (n: null) => void) {
    if (window.confirm(`Are you sure you want to delete this ${item}?`)) {
      callback(null);
    }
  }

  const handleSubmit = async (_e: PressEvent) => {
    setError(null);
    setSuccess(null);
    setTitleError(null);
    setDescriptionError(null);

    if (!category) {
      setError("Please select a category.");

      return;
    }

    for (const file of imageFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return alert(
          `Invalid image type for ${file.name}. Only ${ALLOWED_IMAGE_TYPES.map((ait) => ait.substring(6)).join(" or ")} are allowed.`,
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return alert(
          `Image ${file.name} is too large. Maximum size is ${(MAX_IMAGE_SIZE / 1_000_000).toFixed(0)}MB.`,
        );
      }
    }

    if (title.length < MIN_TITLE_LENGTH) {
      setError(`Title too short.`);
      setTitleError(`Title too short.`);

      return;
    } else if (title.length > MAX_TITLE_LENGTH) {
      setTitleError(`Title too long.`);
      setError(`Title too long.`);

      return;
    }

    if (description.length < MIN_DESC_LENGTH) {
      setDescriptionError(`Description too short.`);
      setError(`Description too short.`);

      return;
    } else if (description.length > MAX_DESC_LENGTH) {
      setDescriptionError(`Description too long.`);
      setError(`Description too long.`);

      return;
    }

    if (price && (isNaN(price) || Number(price) < 0)) {
      return setError("Invalid price.");
    }

    // 🚩 Local Moderation

    if (filter.check(title)) {
      // @ts-expect-error
      setTitleError(filter.badWordsUsed(title).join(", "));

      return setError("Title failed profanity filter.");
    } else if (filter.check(description)) {
      // @ts-expect-error
      setDescriptionError(filter.badWordsUsed(description).join(", "));

      return setError("Description failed profanity filter.");
    }

    const obscenity = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });

    if (obscenity.hasMatch(title)) {
      setTitleError(
        obscenity
          .getAllMatches(title)
          .map(
            (m) =>
              englishDataset.getPayloadWithPhraseMetadata(m).phraseMetadata
                ?.originalWord,
          )
          .join(", "),
      );

      return setError("Title failed obscenity filter.");
    } else if (obscenity.hasMatch(description)) {
      setDescriptionError(
        obscenity
          .getAllMatches(description)
          .map(
            (m) =>
              englishDataset.getPayloadWithPhraseMetadata(m).phraseMetadata
                ?.originalWord,
          )
          .join(", "),
      );

      return setError("Description failed obscenity filter.");
    }

    const formData = new FormData();

    formData.append("category", category);
    formData.append("title", title);
    formData.append("description", description);
    price && formData.append("price", price.toString());
    if (imageFiles) {
      if (imageFiles.length > 32) {
        return setError("You can only upload up to 32 images.");
      }
      if (imageFiles.length === 1) {
        formData.append("images", imageFiles[0]);
      } else {
        const combinedImage = await mergeImagesToDataURL(imageFiles as File[]);

        window.open(combinedImage, "_blank");
        const img = document.createElement("img");

        img.src = combinedImage;
        img.style.maxWidth = "100%";
        img.style.border = "2px solid red";
        document.body.appendChild(img);

        formData.append("combinedImage", combinedImage);
      }
      // If more than one image, append each image separately
      imageFiles.forEach((file) => formData.append("images", file));
    }

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
          {images.length ? (
            // Display uploaded images in a carousel
            <div className="relative w-full overflow-hidden">
              <div
                className="flex transition-transform ease-out duration-300"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {images.map((img, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <Image
                      alt={`Ad Image ${index + 1}`}
                      className="w-full h-64 object-cover dark:grayscale cursor-pointer"
                      radius="none"
                      src={img}
                      onClick={() =>
                        shouldDelete(`image`, () => {
                          setImages(images.filter((_, i) => i !== index));
                          setImageFiles(
                            imageFiles.filter((_, i) => i !== index),
                          );
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} of {images.length}
              </div>
              <button
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
                onClick={() =>
                  setCurrentIndex(
                    (currentIndex - 1 + images.length) % images.length,
                  )
                }
              >
                &#8592;
              </button>
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
                onClick={() =>
                  setCurrentIndex((currentIndex + 1) % images.length)
                }
              >
                &#8594;
              </button>
            </div>
          ) : (
            <>
              <Input
                multiple
                accept="image/*"
                label={`Images (Up to 32, Max ${(MAX_IMAGE_SIZE / 1_000_000).toFixed(0)}MB each, ${ALLOWED_IMAGE_TYPES.map((ait) => ait.substring(6)).join(" or ")})`}
                labelPlacement="outside"
                type="file"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 32);

                  setImages(files.map((file) => URL.createObjectURL(file)));
                  setImageFiles(files);
                }}
              />
              <hr className="my-2 border-zinc-300 dark:border-zinc-600" />
            </>
          )}

          <Input
            isRequired
            errorMessage={titleError}
            isInvalid={titleError !== null}
            label="Title"
            labelPlacement="outside"
            maxLength={MAX_TITLE_LENGTH}
            minLength={MIN_TITLE_LENGTH}
            placeholder={`Enter Ad Title (${MIN_TITLE_LENGTH} - ${MAX_TITLE_LENGTH} characters)`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <hr className="my-2 border-zinc-300 dark:border-zinc-600" />

          <>
            <Textarea
              isRequired
              errorMessage={descriptionError}
              isInvalid={descriptionError !== null}
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
