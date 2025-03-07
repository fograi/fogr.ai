import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";

import { MailIcon } from "../icons";

interface ClassifiedCardProps {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  email: string;
  img?: string;
}

const ClassifiedCard = ({
  title,
  description,
  category,
  price,
  email,
  img,
}: ClassifiedCardProps) => {
  const [user, domain] = email.split("@");

  return (
    <Card
      className="w-full font-serif bg-zinc-200 dark:bg-zinc-800"
      radius="none"
      shadow="lg"
    >
      <CardHeader className="flex justify-center items-center mb-2 pb-1 bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800">
        <h3 className="text-lg font-bold uppercase tracking-wide">{category}</h3>
      </CardHeader>
      <CardBody>
        {img && (
          <Image
            alt={title}
            className="dark:grayscale"
            radius="none"
            src={img}
            width={400}
          />
        )}
        <h4 className="text-lg font-semibold flex justify-center items-center mb-2">
          {title}
        </h4>
        <p className="text-md mb-3 leading-relaxed">
          {removePhoneNumbers(description)}
        </p>
      </CardBody>
      <CardFooter className="text-md border-t border-zinc-300 dark:border-zinc-600 flex justify-between">
        <Link
          isExternal
          href={`mailto:${user}@${domain}?subject=${encodeURIComponent(title)}`}
        >
          <MailIcon className="mr-1" />
          &#64;{user}
        </Link>
        {typeof price === "number" && (
          <p className="text-md text-blue-500 font-medium">
            <strong>
              {price > 0
                ? new Intl.NumberFormat("en-IE", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
                    maximumFractionDigits: 2,
                  }).format(price)
                : "Free"}
            </strong>
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default ClassifiedCard;

function removePhoneNumbers(text: string): string {
  // Regex to detect common phone number formats
  const phoneRegex =
    /\+?\d{2,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{2,5}[-.\s]?\d{2,5}[-.\s]?\d{2,5}/g;

  // Replace detected phone numbers with an empty string
  return text.replace(phoneRegex, "").trim();
}
