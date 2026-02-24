const uniqueIdentifier = "JWK-WEDDING-TEMPLATE-V1";

// Gallery layout type definitions
type GalleryLayout = "scroll" | "grid";
type GalleryPosition = "middle" | "bottom";

interface GalleryConfig {
  layout: GalleryLayout;
  position: GalleryPosition;
  images: string[];
}

export const weddingConfig = {
  // Meta information
  meta: {
    title: "You're invited to our wedding",
    description: "Wedding invitation",
    ogImage: "/images/ha0h-1fsi-bqt3.jpg",
    noIndex: true,
    _jwk_watermark_id: uniqueIdentifier,
  },

  // Main screen
  main: {
    title: "Wedding Invitation",
    image: "/images/ha0h-1fsi-bqt3.jpg",
    date: "Saturday, May 16, 2026 at 12:30 PM",
    venue: "Venue name"
  },

  // Introduction
  intro: {
    title: "",
    text: "The precious steps we have taken\nwhile looking at each other\nnow lead to a single path.\n\nWith love and faith,\nwe share our humble beginning\nas we build our new home together."
  },

  // Wedding schedule
  date: {
    year: 2026,
    month: 5,
    day: 16,
    hour: 12,
    minute: 30,
    displayDate: "May 16, 2026 · 12:30 PM",
  },

  // Venue information
  venue: {
    name: "Venue name",
    address: "123 Teheran-ro, Gangnam-gu\nSeoul, South Korea\nVenue name",
    tel: "02-1234-5678",
    naverMapId: "Venue name", // Place name for Naver Maps search
    coordinates: {
      latitude: 37.5665,
      longitude: 126.9780,
    },
    placeId: "123456789", // Naver Maps place ID
    mapZoom: "17", // Map zoom level
    mapNaverCoordinates: "14141300,4507203,15,0,0,0,dh", // Naver Maps directions URL coordinates
    transportation: {
      subway: "5 min walk from Subway Station Exit 1",
      bus: "Main lines\n 101, 102, 103\nBranch lines\n 1234, 5678",
    },
    parking: "Building underground parking available (2 hours free)",
    // Groom's shuttle information
    groomShuttle: {
      location: "Groom's shuttle departure point",
      departureTime: "Departure at 10:30 AM",
      contact: {
        name: "Contact name",
        tel: "010-1234-5678"
      }
    },
    // Bride's shuttle information
    brideShuttle: {
      location: "Bride's shuttle departure point",
      departureTime: "Departure at 11:00 AM",
      contact: {
        name: "Contact name",
        tel: "010-9876-5432"
      }
    }
  },

  // Gallery
  gallery: {
    layout: "grid" as GalleryLayout, // "scroll" or "grid"
    position: "bottom" as GalleryPosition, // "middle" (current position) or "bottom" (at bottom)
    images: [
      "/images/gallery/image1.jpg",
      "/images/gallery/image2.jpg",
      "/images/gallery/image3.jpg",
      "/images/gallery/image4.jpg",
      "/images/gallery/image5.jpg",
      "/images/gallery/image6.jpg",
      "/images/gallery/image7.jpg",
      "/images/gallery/image8.jpg",
      "/images/gallery/image9.jpg",
    ],
  } as GalleryConfig,

  // Invitation message
  invitation: {
    message: "Destined to meet like a ray of starlight,\nwe wish to walk through life together.\n\nWith your precious blessings,\nwe take our first step as one.\n\nYour presence would be the greatest gift of all.",
    groom: {
      name: "Groom's name",
      label: "Son",
      father: "Groom's father",
      mother: "Groom's mother",
    },
    bride: {
      name: "Bride's name",
      label: "Daughter",
      father: "Bride's father",
      mother: "Bride's mother",
    },
  },

  // Bank account information
  account: {
    groom: {
      bank: "Bank name",
      number: "123-456-789012",
      holder: "Groom's name",
    },
    bride: {
      bank: "Bank name",
      number: "987-654-321098",
      holder: "Bride's name",
    },
    groomFather: {
      bank: "Bank name",
      number: "111-222-333444",
      holder: "Groom's father",
    },
    groomMother: {
      bank: "Bank name",
      number: "555-666-777888",
      holder: "Groom's mother",
    },
    brideFather: {
      bank: "Bank name",
      number: "999-000-111222",
      holder: "Bride's father",
    },
    brideMother: {
      bank: "Bank name",
      number: "333-444-555666",
      holder: "Bride's mother",
    }
  },

  // RSVP settings
  rsvp: {
    enabled: false, // Show RSVP section
    showMealOption: false, // Show meal option input
  },

  // Slack notification settings
  slack: {
    webhookUrl: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || "",
    channel: "#wedding-response",
    compactMessage: true, // Display Slack messages concisely
  },
}; 
