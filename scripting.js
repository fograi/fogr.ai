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
    setTimeout(() => loadClassifieds(data), 2000); // Load all classifieds initially
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
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'loading-skeleton';
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

    adDiv.appendChild(adTitle);
    adDiv.appendChild(adDescription);
    adDiv.appendChild(adContact);
    adDiv.appendChild(adTime);

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
