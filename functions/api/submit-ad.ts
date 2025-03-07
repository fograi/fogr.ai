import {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESC_LENGTH,
  MAX_DESC_LENGTH,
} from "@/constants/validations";

export const onRequestPost = async (context: { request: Request }) => {
  try {
    const req = await context.request.json();
    const { category, title, description, image, price, userEmail } = req;

    // Server-side validation (same as frontend)
    if (!category) {
      return new Response(
        JSON.stringify({ error: "Please select a category." }),
        { status: 400 },
      );
    }
    if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Title must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters.`,
        }),
        { status: 400 },
      );
    }
    if (
      description.length < MIN_DESC_LENGTH ||
      description.length > MAX_DESC_LENGTH
    ) {
      return new Response(
        JSON.stringify({
          error: `Description must be between ${MIN_DESC_LENGTH} and ${MAX_DESC_LENGTH} characters.`,
        }),
        { status: 400 },
      );
    }

    // Random success/fail simulation for testing
    const isSuccess = Math.random() > 0.2; // 80% success rate

    const allItems = image + title + description + price + userEmail;

    if (!isSuccess) {
      return new Response(
        JSON.stringify({ error: "Random failure for testing." }),
        { status: 500 },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ad submitted successfully. ${allItems}`,
      }),
      { status: 200 },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error }), {
      status: 400,
    });
  }
};
