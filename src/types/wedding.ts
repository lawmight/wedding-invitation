export interface AccountInfo {
  bank: string;
  number: string;
  holder: string;
}

export interface WeddingAccountConfig {
  groom: AccountInfo;
  bride: AccountInfo;
  groomFather: AccountInfo;
  groomMother: AccountInfo;
  brideFather: AccountInfo;
  brideMother: AccountInfo;
}

export interface ShuttleContact {
  name: string;
  tel: string;
}

export interface ShuttleInfo {
  location: string;
  departureTime: string;
  contact: ShuttleContact;
}

export interface Venue {
  name: string;
  address: string;
  tel: string;
  naverMapId: string;
  /** Optional address used for AMap (高德) navigation destination name; defaults to venue.name */
  amapAddress?: string;
  photoSpots?: Array<{
    lng: number;
    lat: number;
    name: string;
    desc: string;
  }>;
  timelineLocations?: Array<{
    time: string;
    name: string;
    lng: number;
    lat: number;
    desc: string;
  }>;
  amapMapStyleId?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  /** When true, venue coordinates (center, timeline, photo spots) are WGS-84 and will be converted to GCJ-02 for AMap. Omit or false if coordinates are already GCJ-02 (e.g. from AMap). */
  coordinatesInWGS84?: boolean;
  placeId: string;
  mapZoom: string;
  mapNaverCoordinates?: string;
  transportation: {
    subway: string;
    bus: string;
  };
  parking: string;
  groomShuttle?: ShuttleInfo;
  brideShuttle?: ShuttleInfo;
} 