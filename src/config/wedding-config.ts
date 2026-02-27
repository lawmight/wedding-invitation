const uniqueIdentifier = "JWK-WEDDING-TEMPLATE-V1";

// Gallery layout type definitions
type GalleryLayout = "scroll" | "grid";
type GalleryPosition = "middle" | "bottom";

interface GalleryConfig {
  layout: GalleryLayout;
  position: GalleryPosition;
  maxDisplay: number;
  images: string[];
  /** Optional rotation in degrees (e.g. 90 = rotate right) per image path */
  imageRotations?: Record<string, number>;
}

export const weddingConfig = {
  // Meta information
  meta: {
    title: "You're invited to our wedding",
    description: "Wedding invitation",
    ogImage: "/images/gallery/IMG_20250609_222047.jpg",
    noIndex: true,
    _jwk_watermark_id: uniqueIdentifier,
  },

  // Main screen (fallback when no random main is available)
  main: {
    title: "Wedding Invitation",
    image: "/images/gallery/IMG_20250609_222047.jpg",
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
    name: "Zongcheng Real Estate Building",
    address: "Room 402, Unit 1, Zongcheng Real Estate Building\nNo. 105 Zhongshan West Road\nTongxian City, Jiaxing, Zhejiang Province, 314500\nChina",
    tel: "02-1234-5678",
    naverMapId: "Zongcheng Real Estate Building", // Place name for Naver Maps search
    amapAddress: "嘉兴市桐乡市中山西路联建房105幢", // Address used for AMap (高德) navigation
    coordinates: {
      latitude: 30.640054,
      longitude: 120.542085,
    },
    placeId: "123456789", // Naver Maps place ID
    mapZoom: "17", // Map zoom level
    mapNaverCoordinates: "14141300,4507203,15,0,0,0,dh", // Naver Maps directions URL coordinates
    transportation: {
      subway: "No subway service in Tongxiang",
      bus: "Nearest stops:\n• Wenlan Yuan (North) - 145m\n  Routes: K340, K347\n• Huangjin Shuian - 454m\n  Routes: K01, K231, K232\n• Route 1 also serves this area",
    },
    parking: "", // e.g. "Building underground parking available (2 hours free)"
    // Groom's shuttle - set when defined; omit for "Not yet defined"
    // groomShuttle: {
    //   location: "Groom's shuttle departure point",
    //   departureTime: "Departure at 10:30 AM",
    //   contact: { name: "Contact name", tel: "010-1234-5678" }
    // },
    // Bride's shuttle - set when defined; omit for "Not yet defined"
    // brideShuttle: {
    //   location: "Bride's shuttle departure point",
    //   departureTime: "Departure at 11:00 AM",
    //   contact: { name: "Contact name", tel: "010-9876-5432" }
    // }
  },

  // Gallery
  gallery: {
    layout: "grid" as GalleryLayout, // "scroll" or "grid"
    position: "bottom" as GalleryPosition, // "middle" (current position) or "bottom" (at bottom)
    maxDisplay: 9,
    images: [] as string[], // fallback when folder read fails; runtime uses folder + shuffle
    imageRotations: {
      "/images/gallery/20250308_113710.jpg": 90,
      "/images/gallery/20250215_112534.jpg": 180,
      "/images/gallery/20250214_155325.jpg": 90,
      "/images/gallery/20250115_114642.jpg": 90,
    } as Record<string, number>,
  } as GalleryConfig,

  // Invitation message
  invitation: {
    message: "Destined to meet like a ray of starlight,\nwe wish to walk through life together.\n\nWith your precious blessings,\nwe take our first step as one.\n\nYour presence would be the greatest gift of all.",
    groom: {
      name: "Tom Coustols",
      label: "Son",
      father: "Gérald Coustols",
      mother: "Julie Coquilledemoncourt",
    },
    bride: {
      name: "Xin Gao",
      label: "Daughter",
      father: "", // to be added
      mother: "", // to be added
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
