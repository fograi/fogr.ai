import json  # Import the JSON module
import random
from datetime import datetime, timedelta

# Full provided dataset
full_data = [
  {
    "section": "for-sale",
    "title": "Antique Sofa",
    "description": "Vintage style, recently reupholstered. Perfect for a living room.",
    "contact": "555-111-2222",
    "platform": "viber",
    "timestamp": "2025-01-06T14:30:00Z"
  },
  {
    "section": "for-sale",
    "title": "Electric Scooter",
    "description": "Eco-friendly and barely used. Includes charger.",
    "contact": "555-333-4444"
  },
  {
    "section": "for-sale",
    "title": "Kitchen Appliances",
    "description": "Toaster and blender combo. Excellent condition.",
    "contact": "555-555-6666",
    "platform": "signal"
  },
  {
    "section": "real-estate",
    "title": "2-Bedroom Apartment",
    "description": "Modern apartment in city center. Close to public transport.",
    "contact": "555-777-8888"
  },
  {
    "section": "real-estate",
    "title": "Cozy Cottage",
    "description": "Charming 3-bedroom cottage with a large garden.",
    "contact": "555-999-0000"
  },
  {
    "section": "vehicles",
    "title": "Used Sedan",
    "description": "2016 Toyota Corolla. Low mileage and great condition.",
    "contact": "555-101-2020",
    "platform": "viber"
  },
  {
    "section": "vehicles",
    "title": "Harley Davidson Bike",
    "description": "Classic motorcycle, fully serviced, ready to ride.",
    "contact": "555-303-4040"
  },
  {
    "section": "jobs",
    "title": "Office Assistant",
    "description": "Part-time position in a friendly office environment.",
    "contact": "jobs@company.com"
  },
  {
    "section": "jobs",
    "title": "Construction Worker",
    "description": "Looking for experienced workers. Competitive pay.",
    "contact": "555-505-6060"
  },
  {
    "section": "jobs",
    "title": "Graphic Designer",
    "description": "Freelance opportunity for a creative individual.",
    "contact": "555-707-8080",
    "platform": "signal"
  },
  {
    "section": "services",
    "title": "Plumbing Services",
    "description": "Reliable plumber available for all types of repairs.",
    "contact": "555-909-1010",
    "platform": "sms"
  },
  {
    "section": "services",
    "title": "Lawn Mowing",
    "description": "Affordable lawn care services for all yard sizes.",
    "contact": "555-111-1212"
  },
  {
    "section": "miscellaneous",
    "title": "Book Collection",
    "description": "Selling a variety of novels and rare editions.",
    "contact": "555-131-1414",
    "platform": "messenger"
  },
  {
    "section": "miscellaneous",
    "title": "Vintage Camera",
    "description": "Classic film camera, great for collectors.",
    "contact": "555-151-1616"
  },
  {
    "section": "announcements",
    "title": "Charity Bake Sale",
    "description": "Come support our community with delicious treats!",
    "contact": "555-171-1818"
  },
  {
    "section": "announcements",
    "title": "Wedding Invitation",
    "description": "You are warmly invited to our special day.",
    "contact": "555-191-2020",
    "platform": "viber"
  },
  {
    "section": "personals",
    "title": "Friendship Wanted",
    "description": "Looking for a hiking partner. Enjoy the great outdoors.",
    "contact": "555-212-2323"
  },
  {
    "section": "personals",
    "title": "Language Exchange",
    "description": "Want to practice Spanish in exchange for English lessons.",
    "contact": "555-242-2525"
  },
  {
    "section": "lost-and-found",
    "title": "Lost Cat",
    "description": "Black cat with green eyes. Last seen near Main Street.",
    "contact": "555-262-2727"
  },
  {
    "section": "lost-and-found",
    "title": "Found Bracelet",
    "description": "Silver bracelet with engravings. Found in the park.",
    "contact": "555-282-2929",
    "platform": "sms"
  },
  {
    "section": "community-events",
    "title": "Neighborhood Cleanup",
    "description": "Join us to beautify our streets this Saturday.",
    "contact": "555-303-3131"
  },
  {
    "section": "community-events",
    "title": "Local Farmers Market",
    "description": "Fresh produce and homemade goods every weekend.",
    "contact": "555-323-3333",
    "platform": "call"
  },
  {
    "section": "pets",
    "title": "Golden Retriever Puppies",
    "description": "Adorable, playful puppies looking for a loving home.",
    "contact": "555-343-3535",
    "platform": "messenger"
  },
  {
    "section": "pets",
    "title": "Cat Adoption",
    "description": "Sweet tabby cat, 2 years old, spayed and vaccinated.",
    "contact": "555-363-3737"
  },
  {
    "section": "education",
    "title": "Math Tutoring",
    "description": "Experienced tutor available for all grade levels.",
    "contact": "555-383-3939",
    "platform": "whatsapp"
  },
  {
    "section": "education",
    "title": "Music Lessons",
    "description": "Piano and guitar lessons for beginners and intermediates.",
    "contact": "555-404-4141"
  },
  {
    "section": "business-opportunities",
    "title": "Franchise Available",
    "description": "Own your own coffee shop. Franchise opportunities open.",
    "contact": "555-424-4343"
  },
  {
    "section": "business-opportunities",
    "title": "Tech Startup Investment",
    "description": "Seeking partners for innovative tech project.",
    "contact": "555-444-4545",
    "platform": "messenger"
  },
  {
    "section": "rentals",
    "title": "Studio Apartment",
    "description": "Affordable studio near downtown. Utilities included.",
    "contact": "555-464-4747"
  },
  {
    "section": "rentals",
    "title": "Vacation Cabin",
    "description": "Secluded cabin rental for weekend getaways.",
    "contact": "555-484-4949",
    "platform": "whatsapp"
  },
  {
    "section": "wanted",
    "title": "Looking for a Bike",
    "description": "Seeking a used road bike in good condition.",
    "contact": "555-505-5151",
    "platform": "messenger"
  },
  {
    "section": "wanted",
    "title": "Roommate Needed",
    "description": "Looking for a roommate for a 2-bedroom apartment.",
    "contact": "555-525-5353",
    "platform": "call"
  }
]

# Function to add timestamps and randomize
def randomize_and_update_data(data):
    randomized_data = random.sample(data, len(data))
    current_time = datetime.now()
    for item in randomized_data:
        if "timestamp" not in item:
            random_days_ago = random.randint(0, 30)
            random_time = current_time - timedelta(days=random_days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            item["timestamp"] = random_time.isoformat() + "Z"
    sorted_data = sorted(randomized_data, key=lambda x: x["timestamp"], reverse=True)
    return sorted_data

# Process the data
processed_data = randomize_and_update_data(full_data)

# Save to a file
output_file_path = "processed_mock_data.json"
with open(output_file_path, "w") as f:
    json.dump(processed_data, f, indent=2)

print(f"Data saved to {output_file_path}")
