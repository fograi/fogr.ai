let classifiedData = []; // Global variable to store fetched data

// Fetch and store data
fetch('./mocks.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    classifiedData = data; // Store fetched data globally
    displayLoadingSkeletons();
    loadClassifieds(data); // Load all classifieds initially
  })
  .catch((error) => console.error('Failed to load mockData:', error));

const sectionsList = [
  'for-sale',
  'real-estate',
  'vehicles',
  'jobs',
  'services',
  'miscellaneous',
  'announcements',
  'personals',
  'lost-and-found',
  'community-events',
  'pets',
  'education',
  'business-opportunities',
  'rentals',
  'wanted',
];

function populateSectionFilter() {
  const sectionFilter = document.getElementById('section-filter');
  sectionFilter.innerHTML = ''; // Clear existing options

  // Add "All" option
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All';
  sectionFilter.appendChild(allOption);

  // Add dynamic sections
  sectionsList.forEach((section) => {
    const option = document.createElement('option');
    option.value = section;
    option.textContent = section
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    sectionFilter.appendChild(option);
  });
}

// Call function on load
populateSectionFilter();

// Filter classifieds based on the selected section
function filterClassifieds() {
  const selectedSection = document.getElementById('section-filter').value;

  // Filter data based on the selected section
  const filteredData =
    selectedSection === 'all'
      ? classifiedData // Show all if 'All' is selected
      : classifiedData.filter((ad) => ad.section === selectedSection);

  // Reload classifieds with filtered data
  loadClassifieds(filteredData);
}

// Attach event listener to the filter
document
  .getElementById('section-filter')
  .addEventListener('change', filterClassifieds);

const classifiedsContainer = document.getElementById('classifieds-container');

function displayLoadingSkeletons() {
  classifiedsContainer.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'classified-skeleton';
    skeleton.innerHTML = `
      <div class="skeleton-title"></div>
      <div class="skeleton-description"></div>
      <div class="skeleton-contact"></div>
      <div class="skeleton-time"></div>
    `;
    classifiedsContainer.appendChild(skeleton);
  }
}

function loadClassifieds(data) {
  classifiedsContainer.innerHTML = ''; // Clear the container

  let currentSection = null; // Track the current section to handle group headings dynamically

  data.forEach((ad, index) => {
    // Add a new group heading if the section changes or it's the first item
    if (ad.section !== currentSection) {
      currentSection = ad.section;

      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'classified-section';

      const title = document.createElement('div');
      title.className = 'section-title';
      title.textContent = currentSection.replace(/-/g, ' ').toUpperCase();

      sectionDiv.appendChild(title);
      classifiedsContainer.appendChild(sectionDiv);
    }

    // Create a classified entry
    const adDiv = document.createElement('div');
    adDiv.className = 'classified';

    // Add image if available
    if (ad.img) {
      const img = document.createElement('img');
      img.src = ad.img;
      img.alt = ad.title || 'Classified Image';
      img.className = 'classified-image';
      img.classList.add('bw'); // Apply the B&W filter for higher satire
      adDiv.appendChild(img);
    }

    const adTitle = document.createElement('div');
    adTitle.className = 'classified-title';
    adTitle.textContent = ad.title;

    const adDescription = document.createElement('div');
    adDescription.className = 'classified-description';
    adDescription.textContent = ad.description;

    const adContact = document.createElement('div');
    adContact.className = 'classified-contact';

    // Recognize contact type and create a clickable link
    if (ad.contact) {
      let link = null;

      // Default handling for email and phone number
      if (!ad.platform) {
        if (/\S+@\S+\.\S+/.test(ad.contact)) {
          // Email
          link = document.createElement('a');
          link.href = `mailto:${ad.contact}`;
          link.textContent = `Email: ${ad.contact}`;
        } else if (/^\+?[\d\s()-]+$/.test(ad.contact)) {
          // Phone number
          link = document.createElement('a');
          link.href = `tel:${ad.contact.replace(/\s+/g, '')}`;
          link.textContent = `Call: ${ad.contact}`;
        }
      } else {
        // Platform-specific handling (e.g., WhatsApp, SMS)
        switch (ad.platform) {
          case 'call':
            link = document.createElement('a');
            link.href = `tel:${ad.contact.replace(/\s+/g, '')}`;
            link.textContent = `Call: ${ad.contact}`;
            break;
          case 'sms':
            link = document.createElement('a');
            link.href = `sms:${ad.contact.replace(/\s+/g, '')}`;
            link.textContent = `Text: ${ad.contact}`;
            break;
          case 'whatsapp':
            link = document.createElement('a');
            link.href = `https://wa.me/${ad.contact
              .replace(/\s+/g, '')
              .replace(/^0/, '353')}`;
            link.textContent = `WhatsApp: ${ad.contact}`;
            break;
          case 'signal':
            link = document.createElement('a');
            link.href = `signal://send?phone=${ad.contact
              .replace(/\s+/g, '')
              .replace(/^0/, '353')}`;
            link.textContent = `Signal: ${ad.contact}`;
            break;
          case 'messenger':
            link = document.createElement('a');
            link.href = `https://m.me/${ad.contact}`;
            link.textContent = `Messenger: ${ad.contact}`;
            break;
          default:
            link = document.createElement('span');
            link.textContent = ad.contact; // Fallback for unhandled cases
        }
      }

      if (link) {
        link.style.textDecoration = 'none';
        link.style.color = '#007bff';
        adContact.appendChild(link);
      }
    }

    const adTime = document.createElement('div');
    adTime.className = 'classified-time';
    adTime.textContent = timeAgo(ad.timestamp);

    // Add satire gauge
    // const gaugeContainer = document.createElement('div');
    // gaugeContainer.className = 'satire-gauge-container';
    // gaugeContainer.innerHTML = `
    //   <label class="satire-label">
    //     <i>Serious</i><br/>🤔&nbsp;(${100 - (ad.satire || 0)}%)
    //   </label>
    //   <div class="satire-gauge">
    //     <div class="satire-bar" style="width: ${ad.satire || 0}%;"></div>
    //   </div>
    //   <label class="satire-label">
    //     <i>Satire</i><br/>🤥&nbsp;(${ad.satire || 0}%)
    //   </label>
    // `;

    adDiv.appendChild(adTitle);
    adDiv.appendChild(adDescription);
    adDiv.appendChild(adContact);
    adDiv.appendChild(adTime);
    // adDiv.appendChild(gaugeContainer);

    // Append the ad to the current section
    classifiedsContainer.lastChild.appendChild(adDiv);

    // Add <hr> separator except after the last ad in the current group
    if (index < data.length - 1 && data[index + 1].section === ad.section) {
      const hr = document.createElement('hr');
      classifiedsContainer.lastChild.appendChild(hr);
    }
  });
}

// Helper function to calculate time ago
function timeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now - past) / 1000); // Difference in seconds

  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('ad-form-overlay');
  const openButton = document.getElementById('open-overlay');
  const cancelButton = document.getElementById('cancel-button');
  const formContainer = document.querySelector('.form-container');
  const priceTotalHeader = document.getElementById('price-total-header');
  const priceTotalFooter = document.getElementById('price-total-footer');
  const contentInput = document.getElementById('content');
  const imagesInput = document.getElementById('images');

  const baseChars = 256; // First 256 characters are free
  const maxChars = 1024; // Maximum character limit
  const charGroupSize = 32; // Group size for additional pricing
  const pricePerGroup = 0.1; // Cost per group of characters
  const baseImages = 1; // First image is free
  const pricePerExtraImage = 0.1; // Cost per extra image

  // Open overlay
  openButton.addEventListener('click', () => {
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    formContainer.focus(); // Focus the form container for accessibility
  });

  // Close overlay function
  function closeOverlay() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    openButton.focus(); // Return focus to the trigger button
  }

  // Event listeners
  contentInput.addEventListener('input', () => {
    if (contentInput.value.length > maxChars) {
      contentInput.value = contentInput.value.slice(0, maxChars);
    }
    calculatePrice();
  });
  imagesInput.addEventListener('change', calculatePrice);
  cancelButton.addEventListener('click', closeOverlay);
  // Close overlay on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      closeOverlay();
    }
  });

  // Close overlay on clicking outside the form
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });

  const contactField = document.getElementById('contact');
  const contactLabel = document.getElementById('contact-label');
  const contactOptions = document.querySelectorAll(
    'input[name="preferred-method"]'
  );

  // Price mapping
  const methodPrices = {
    email: 0.0,
    sms: 0.15,
    call: 0.15,
    whatsapp: 0.1,
    signal: 0.05,
    viber: 0.1,
    messenger: 0.0,
    telegram: 0.0,
    snapchat: 0.0,
  };

  // Function to update the contact field and label
  function updateContactField(selectedValue) {
    if (selectedValue === 'email') {
      // Set as email input
      contactField.type = 'email';
      contactField.placeholder = 'Enter your email';
      contactLabel.textContent = 'Your Email:';
      contactField.setAttribute(
        'pattern',
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
      );
      contactField.setAttribute('title', 'Please enter a valid email address.');
    } else if (selectedValue === 'call' || selectedValue === 'sms') {
      // Special case for "Call" or "SMS" - strictly phone number
      contactField.type = 'tel';
      contactField.placeholder = 'Enter your phone number';
      contactLabel.textContent = 'Your Phone Number:';
      contactField.setAttribute(
        'pattern',
        '^\\+?[0-9]{1,4}?[ -]?\\(?[0-9]{1,3}\\)?[ -]?[0-9]{1,4}[ -]?[0-9]{1,9}$'
      );
      contactField.setAttribute(
        'title',
        'Please enter a valid phone number, e.g., +1234567890'
      );
    } else {
      // General case for other methods
      contactField.type = 'tel';
      contactField.placeholder = `Enter your ${selectedValue} ID or phone number`;
      contactLabel.textContent = `Your ${
        selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)
      }:`;
      contactField.removeAttribute('pattern'); // Remove previous validation
      contactField.removeAttribute('title'); // Remove previous tooltip
      contactField.setAttribute(
        'pattern',
        '^\\+?[0-9]{1,4}?[ -]?\\(?[0-9]{1,3}\\)?[ -]?[0-9]{1,4}[ -]?[0-9]{1,9}$'
      );
      contactField.setAttribute(
        'title',
        `Please enter a valid ${selectedValue} ID or phone number, e.g., +1234567890`
      );
    }
  }

  // Set the default state (email)
  updateContactField('email');

  // Add event listeners to update based on selection
  contactOptions.forEach((option) => {
    option.addEventListener('change', (event) => {
      const selectedValue = event.target.value;
      updateContactField(selectedValue);
      calculatePrice();
    });
  });

  function calculatePrice() {
    let price = 0; // Base price
    const contentPriceEl = document.getElementById('content-price');
    const imagesPriceEl = document.getElementById('images-price');
    const contactPriceEl = document.getElementById('contact-price');
    const breakdownTotalEl = document.getElementById('price-total-breakdown');
    const breakdownEl = document.getElementById('price-breakdown');

    const contentLength = contentInput.value.length;
    let contentPrice = 0;

    // Content pricing
    if (contentLength > baseChars) {
      const extraChars = Math.min(
        contentLength - baseChars,
        maxChars - baseChars
      );
      const groups = Math.ceil(extraChars / charGroupSize);
      contentPrice = groups * pricePerGroup;
      price += contentPrice;
    }

    // Image pricing
    const numImages = imagesInput.files.length;
    let imagesPrice = 0;
    if (numImages > baseImages) {
      const extraImages = numImages - baseImages;
      imagesPrice = extraImages * pricePerExtraImage;
      price += imagesPrice;
    }

    // Contact method pricing
    const selectedContactMethod = document.querySelector(
      'input[name="preferred-method"]:checked'
    ).value;
    const contactPrice = methodPrices[selectedContactMethod] || 0;
    price += contactPrice;

    // Credit card fee
    const creditCardFee = 0.25;
    if (price > 0) {
      price += creditCardFee;
    }

    // Update individual prices
    contentPriceEl.textContent = contentPrice.toFixed(2);
    imagesPriceEl.textContent = imagesPrice.toFixed(2);
    contactPriceEl.textContent = contactPrice.toFixed(2);
    breakdownTotalEl.textContent = price.toFixed(2);

    // Update total prices
    priceTotalHeader.textContent = price.toFixed(2);
    priceTotalFooter.textContent = price.toFixed(2);

    // Show or hide the breakdown
    if (price > 0) {
      breakdownEl.classList.remove('hidden');
    } else {
      breakdownEl.classList.add('hidden');
    }
  }
});
