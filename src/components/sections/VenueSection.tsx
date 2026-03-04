'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { weddingConfig } from '../../config/wedding-config';

const AMAP_CONTAINER_ID = 'amap-venue-container';

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
    AMapLoader?: {
      load: (config: { key: string; version: string; plugins?: string[] }) => Promise<AMapNamespace>;
    };
  }
}

// AMAP (高德) uses [lng, lat]; types for loaded AMap namespace
interface AMapNamespace {
  Map: new (container: string | HTMLElement, opts?: { center?: [number, number]; zoom?: number; mapStyle?: string }) => AMapMap;
  Marker: new (opts: { position: [number, number]; map?: AMapMap; title?: string }) => AMapMarker;
  InfoWindow: new (opts: { content?: string }) => AMapInfoWindow;
  TileLayer: {
    Traffic: new (opts?: { autoRefresh?: boolean; interval?: number }) => AMapTrafficLayer;
  };
  Geolocation: new (opts?: { enableHighAccuracy?: boolean; timeout?: number }) => AMapGeolocation;
  Walking: new (opts?: { map?: AMapMap; panel?: string | HTMLElement }) => AMapWalking;
  Driving: new (opts?: { map?: AMapMap; panel?: string | HTMLElement; policy?: number }) => AMapDriving;
  plugin(plugins: string[], cb: () => void): void;
}
interface AMapMap {
  setCenter(center: [number, number]): void;
  add(target: unknown): void;
  remove(target: unknown): void;
  destroy(): void;
}
interface AMapMarker {
  setMap(map: AMapMap | null): void;
  on(event: 'click', handler: () => void): void;
}
interface AMapInfoWindow {
  open(map: AMapMap, position: [number, number]): void;
}
interface AMapTrafficLayer {
  setMap(map: AMapMap | null): void;
}
interface AMapPositionResult {
  position?: {
    lng: number;
    lat: number;
  };
  message?: string;
}
interface AMapPluginResult {
  info?: string;
  message?: string;
  result?: {
    routes?: Array<{
      distance?: number;
      time?: number;
      steps?: Array<{
        instruction?: string;
        distance?: number;
      }>;
    }>;
  };
}
interface AMapGeolocation {
  getCurrentPosition(cb: (status: 'complete' | 'error', result: AMapPositionResult) => void): void;
}
interface AMapWalking {
  search(
    origin: [number, number],
    destination: [number, number],
    cb: (status: 'complete' | 'error', result: AMapPluginResult) => void
  ): void;
  on(event: 'complete' | 'error', handler: (result: AMapPluginResult) => void): void;
  off(event: 'complete' | 'error', handler: (result: AMapPluginResult) => void): void;
}
interface AMapDriving {
  search(
    origin: [number, number],
    destination: [number, number],
    options: { waypoints?: [number, number][] },
    cb: (status: 'complete' | 'error', result: AMapPluginResult) => void
  ): void;
  on(event: 'complete' | 'error', handler: (result: AMapPluginResult) => void): void;
  off(event: 'complete' | 'error', handler: (result: AMapPluginResult) => void): void;
}

// 텍스트의 \n을 <br />로 변환하는 함수
const formatTextWithLineBreaks = (text: string) => {
  return text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < text.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
};

interface VenueSectionProps {
  bgColor?: 'white' | 'beige';
}

const VenueSection = ({ bgColor = 'white' }: VenueSectionProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const routePanelRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AMapMap | null>(null);
  const trafficLayerRef = useRef<AMapTrafficLayer | null>(null);
  const geolocationRef = useRef<AMapGeolocation | null>(null);
  const walkingRef = useRef<AMapWalking | null>(null);
  const drivingRef = useRef<AMapDriving | null>(null);
  const amapKey = process.env.NEXT_PUBLIC_AMAP_KEY || '';
  const amapSecurityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE || '';
  const debugInfo = useMemo(() => amapKey ? `Key: ${amapKey.substring(0, 4)}...` : 'No AMAP key', [amapKey]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [trafficVisible, setTrafficVisible] = useState(false);
  const [routeStatusMessage, setRouteStatusMessage] = useState('');
  const hasAmapKeys = !!(amapKey && amapSecurityCode);
  // 배차 안내 펼침/접기 상태 관리
  const [expandedShuttle, setExpandedShuttle] = useState<'groom' | 'bride' | null>(null);
  
  // 배차 안내 펼침/접기 토글 함수
  const toggleShuttle = (shuttle: 'groom' | 'bride') => {
    if (expandedShuttle === shuttle) {
      setExpandedShuttle(null);
    } else {
      setExpandedShuttle(shuttle);
    }
  };

  const clearRoutePanel = () => {
    if (routePanelRef.current) {
      routePanelRef.current.innerHTML = '';
    }
  };

  const setRoutePanelHtml = (html: string) => {
    if (routePanelRef.current) {
      routePanelRef.current.innerHTML = html;
    }
  };

  const renderDrivingResult = (result: AMapPluginResult) => {
    const route = result.result?.routes?.[0];
    if (!route) {
      setRoutePanelHtml('<p>No driving route found.</p>');
      return;
    }
    const minutes = route.time ? Math.round(route.time / 60) : null;
    const km = route.distance ? (route.distance / 1000).toFixed(1) : null;
    const steps = route.steps ?? [];
    const stepsHtml = steps
      .map((step, idx) => {
        const distanceText = step.distance ? ` (${Math.round(step.distance)}m)` : '';
        return `<li>${idx + 1}. ${step.instruction ?? 'Continue'}${distanceText}</li>`;
      })
      .join('');

    setRoutePanelHtml(`
      <div>
        <p><strong>Driving route</strong>${km ? ` · ${km} km` : ''}${minutes ? ` · about ${minutes} min` : ''}</p>
        ${steps.length > 0 ? `<ol style="padding-left: 1rem; margin: 0.5rem 0 0;">${stepsHtml}</ol>` : '<p>Step details are unavailable.</p>'}
      </div>
    `);
  };

  const getCurrentPosition = (): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!geolocationRef.current) {
        reject(new Error('Geolocation is not ready yet.'));
        return;
      }
      geolocationRef.current.getCurrentPosition((status, result) => {
        if (status === 'complete' && result.position) {
          resolve([result.position.lng, result.position.lat]);
          return;
        }
        reject(new Error(result.message || 'Unable to get your current location.'));
      });
    });
  };

  const runRouteSearch = async (mode: 'walk' | 'drive') => {
    if (!mapInstanceRef.current) {
      setRouteStatusMessage('Map is not ready yet.');
      return;
    }

    setRouteStatusMessage('Getting your current location...');
    clearRoutePanel();

    try {
      const origin = await getCurrentPosition();
      const destination: [number, number] = [weddingConfig.venue.coordinates.longitude, weddingConfig.venue.coordinates.latitude];

      if (mode === 'walk') {
        if (!walkingRef.current) {
          setRouteStatusMessage('Walking service is not ready yet.');
          return;
        }
        setRouteStatusMessage('Searching walking route...');
        walkingRef.current.search(origin, destination, (status, result) => {
          if (status === 'complete') {
            setRouteStatusMessage('');
            return;
          }
          setRouteStatusMessage(result.message || 'Walking route search failed.');
        });
        return;
      }

      if (!drivingRef.current) {
        setRouteStatusMessage('Driving service is not ready yet.');
        return;
      }
      setRouteStatusMessage('Searching driving route...');
      drivingRef.current.search(origin, destination, { waypoints: [] }, (status, result) => {
        if (status === 'complete') {
          renderDrivingResult(result);
          setRouteStatusMessage('');
          return;
        }
        setRouteStatusMessage(result.message || 'Driving route search failed.');
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to get route.';
      setRouteStatusMessage(message);
    }
  };

  const toggleTraffic = () => {
    const map = mapInstanceRef.current;
    const trafficLayer = trafficLayerRef.current;
    if (!map || !trafficLayer) {
      return;
    }

    if (trafficVisible) {
      map.remove(trafficLayer);
      setTrafficVisible(false);
      return;
    }
    map.add(trafficLayer);
    setTrafficVisible(true);
  };

  // AMAP (高德地图) JS API load via Loader
  useEffect(() => {
    if (!amapKey || !amapSecurityCode) {
      return;
    }

    const loadAMap = () => {
      if (window.AMapLoader) {
        window.AMapLoader.load({
          key: amapKey,
          version: '2.0',
        })
          .then(() => {
            setMapLoaded(true);
          })
          .catch((e: unknown) => {
            console.error('AMAP load failed:', e);
            setMapError(true);
          });
        return;
      }

      (window as Window)._AMapSecurityConfig = { securityJsCode: amapSecurityCode };
      const script = document.createElement('script');
      script.src = 'https://webapi.amap.com/loader.js';
      script.async = true;
      script.onload = () => {
        if (!window.AMapLoader) {
          setMapError(true);
          return;
        }
        window.AMapLoader.load({ key: amapKey, version: '2.0' })
          .then(() => setMapLoaded(true))
          .catch((e: unknown) => {
            console.error('AMAP load failed:', e);
            setMapError(true);
          });
      };
      script.onerror = () => setMapError(true);
      document.head.appendChild(script);
    };

    loadAMap();

    const mapEl = mapRef.current;
    return () => {
      if (mapEl) {
        mapEl.innerHTML = '';
      }
    };
  }, [amapKey, amapSecurityCode]);

  // AMAP map init (after loader has set mapLoaded)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapError || !window.AMapLoader) return;

    let unmounted = false;
    let walkingCompleteHandler: ((result: AMapPluginResult) => void) | null = null;
    let walkingErrorHandler: ((result: AMapPluginResult) => void) | null = null;
    let drivingCompleteHandler: ((result: AMapPluginResult) => void) | null = null;
    let drivingErrorHandler: ((result: AMapPluginResult) => void) | null = null;

    window.AMapLoader.load({ key: amapKey, version: '2.0' })
      .then((AMap) => {
        if (unmounted || !mapRef.current) return;

        try {
          const lng = weddingConfig.venue.coordinates.longitude;
          const lat = weddingConfig.venue.coordinates.latitude;
          const center: [number, number] = [lng, lat];
          const zoom = parseInt(weddingConfig.venue.mapZoom, 10) || 15;

          const map = new AMap.Map(AMAP_CONTAINER_ID, {
            center,
            zoom,
            ...(weddingConfig.venue.amapMapStyleId ? { mapStyle: weddingConfig.venue.amapMapStyleId } : {}),
          });
          mapInstanceRef.current = map;

          const trafficLayer = new AMap.TileLayer.Traffic({ autoRefresh: true, interval: 180 });
          trafficLayerRef.current = trafficLayer;
          setTrafficVisible(false);

          const timelineLocations = weddingConfig.venue.timelineLocations ?? [];
          if (timelineLocations.length > 0) {
            timelineLocations.forEach((location, index) => {
              const position: [number, number] = [location.lng, location.lat];
              const marker = new AMap.Marker({ position, map, title: `${index + 1}. ${location.name}` });
              const infoWindow = new AMap.InfoWindow({
                content: `<div style="padding:10px;min-width:180px;font-size:14px;">
                  <strong>${location.time} · ${location.name}</strong>
                  <p style="margin:6px 0 0;">${location.desc}</p>
                </div>`,
              });
              marker.on('click', () => infoWindow.open(map, position));
              if (index === 0) {
                infoWindow.open(map, position);
              }
            });
          } else {
            const infoLabel = weddingConfig.venue.amapAddress ?? weddingConfig.venue.name;
            const marker = new AMap.Marker({ position: center, map, title: infoLabel });
            const infoWindow = new AMap.InfoWindow({
              content: `<div style="padding:10px;min-width:150px;text-align:center;font-size:14px;"><strong>${infoLabel}</strong></div>`,
            });
            marker.on('click', () => infoWindow.open(map, center));
            infoWindow.open(map, center);
          }

          const photoSpots = weddingConfig.venue.photoSpots ?? [];
          photoSpots.forEach((spot) => {
            const position: [number, number] = [spot.lng, spot.lat];
            const marker = new AMap.Marker({ position, map, title: `Photo: ${spot.name}` });
            const infoWindow = new AMap.InfoWindow({
              content: `<div style="padding:10px;min-width:180px;font-size:14px;">
                <strong>📸 ${spot.name}</strong>
                <p style="margin:6px 0 0;">${spot.desc}</p>
              </div>`,
            });
            marker.on('click', () => infoWindow.open(map, position));
          });

          AMap.plugin(['AMap.Driving', 'AMap.Walking', 'AMap.Geolocation'], () => {
            if (unmounted || !mapInstanceRef.current) return;
            const panel = routePanelRef.current ?? undefined;
            geolocationRef.current = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 10000 });
            walkingRef.current = new AMap.Walking({ map: mapInstanceRef.current, ...(panel ? { panel } : {}) });
            drivingRef.current = new AMap.Driving();

            walkingCompleteHandler = () => {
              setRouteStatusMessage('');
            };
            walkingErrorHandler = (result: AMapPluginResult) => {
              setRouteStatusMessage(result.message || 'Walking route search failed.');
            };
            drivingCompleteHandler = () => {
              setRouteStatusMessage('');
            };
            drivingErrorHandler = (result: AMapPluginResult) => {
              setRouteStatusMessage(result.message || 'Driving route search failed.');
            };

            walkingRef.current.on('complete', walkingCompleteHandler);
            walkingRef.current.on('error', walkingErrorHandler);
            drivingRef.current.on('complete', drivingCompleteHandler);
            drivingRef.current.on('error', drivingErrorHandler);
          });
        } catch (error) {
          console.error('AMAP map init error:', error);
          setMapError(true);
        }
      })
      .catch((e: unknown) => {
        console.error('AMAP init load failed:', e);
        setMapError(true);
      });

    return () => {
      unmounted = true;
      setTrafficVisible(false);
      clearRoutePanel();
      geolocationRef.current = null;

      if (walkingRef.current && walkingCompleteHandler && walkingErrorHandler) {
        walkingRef.current.off('complete', walkingCompleteHandler);
        walkingRef.current.off('error', walkingErrorHandler);
      }
      if (drivingRef.current && drivingCompleteHandler && drivingErrorHandler) {
        drivingRef.current.off('complete', drivingCompleteHandler);
        drivingRef.current.off('error', drivingErrorHandler);
      }

      walkingRef.current = null;
      drivingRef.current = null;

      if (mapInstanceRef.current && trafficLayerRef.current) {
        mapInstanceRef.current.remove(trafficLayerRef.current);
        trafficLayerRef.current.setMap(null);
      }
      trafficLayerRef.current = null;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
      mapInstanceRef.current = null;
    };
  }, [mapLoaded, mapError, amapKey]);
  
  // Static fallback when AMAP key is missing or API fails
  const renderStaticMap = () => {
    return (
      <StaticMapContainer>
        <StaticMapPlaceholder />
        <MapOverlay>
          <VenueName style={{ color: 'white', marginBottom: '0.5rem' }}>{weddingConfig.venue.name}</VenueName>
          <VenueAddress style={{ color: 'white', fontSize: '0.9rem' }}>{weddingConfig.venue.address}</VenueAddress>
        </MapOverlay>
      </StaticMapContainer>
    );
  };

  const navigateToAmap = () => {
    if (typeof window === 'undefined') return;
    const { latitude, longitude } = weddingConfig.venue.coordinates;
    const name = encodeURIComponent(weddingConfig.venue.amapAddress ?? weddingConfig.venue.name);
    // 高德 URI scheme: navigation to destination
    const url = `https://uri.amap.com/navigation?dest=${longitude},${latitude}&destName=${name}`;
    window.open(url, '_blank');
  };
  
  const navigateToBaidu = () => {
    if (typeof window === 'undefined') return;
    const query = encodeURIComponent(weddingConfig.venue.amapAddress ?? weddingConfig.venue.name);
    window.open(`https://map.baidu.com/search?query=${query}`, '_blank');
  };

  const navigateToGoogle = () => {
    if (typeof window === 'undefined') return;
    const { latitude, longitude } = weddingConfig.venue.coordinates;
    const query = encodeURIComponent(`${latitude},${longitude}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const navigateToApple = () => {
    if (typeof window === 'undefined') return;
    const { latitude, longitude } = weddingConfig.venue.coordinates;
    const q = encodeURIComponent(weddingConfig.venue.name);
    window.open(`https://maps.apple.com/?ll=${latitude},${longitude}&q=${q}`, '_blank');
  };
  
  return (
    <VenueSectionContainer $bgColor={bgColor}>
      <SectionTitle>Venue</SectionTitle>
      
      <VenueInfo>
        <VenueName>{weddingConfig.venue.name}</VenueName>
        <VenueAddress>{formatTextWithLineBreaks(weddingConfig.venue.address)}</VenueAddress>
        <VenueTel href={`tel:${weddingConfig.venue.tel}`}>{weddingConfig.venue.tel}</VenueTel>
      </VenueInfo>
      
      {(!hasAmapKeys || mapError) ? (
        renderStaticMap()
      ) : (
        <div style={{ position: 'relative' }}>
          <MapContainer ref={mapRef} id={AMAP_CONTAINER_ID} />
          {!mapLoaded && <MapLoading>Loading map...{debugInfo}</MapLoading>}
        </div>
      )}

      {hasAmapKeys && !mapError && (
        <>
          <MapActionButtonsContainer>
            <NavigateButton onClick={toggleTraffic} $mapType="amap" type="button">
              {trafficVisible ? 'Hide traffic' : 'Show traffic'}
            </NavigateButton>
            <NavigateButton onClick={() => void runRouteSearch('drive')} $mapType="amap" type="button">
              Drive here
            </NavigateButton>
            <NavigateButton onClick={() => void runRouteSearch('walk')} $mapType="amap" type="button">
              Walk here
            </NavigateButton>
          </MapActionButtonsContainer>
          {routeStatusMessage && <RouteStatusText>{routeStatusMessage}</RouteStatusText>}
          <RoutePanel ref={routePanelRef} id="route-panel" />
        </>
      )}
      
      <NavigateButtonsContainer>
        <NavigateButton onClick={navigateToAmap} $mapType="amap">
          AMAP
        </NavigateButton>
        <NavigateButton onClick={navigateToBaidu} $mapType="baidu">
          Baidu Map
        </NavigateButton>
        <NavigateButton onClick={navigateToGoogle} $mapType="google">
          Google Maps
        </NavigateButton>
        <NavigateButton onClick={navigateToApple} $mapType="apple">
          Apple Maps
        </NavigateButton>
      </NavigateButtonsContainer>
      
      <TransportCard>
        <CardTitle>Public transport</CardTitle>
        <TransportItem>
          <TransportLabel>Subway</TransportLabel>
          <TransportText>{weddingConfig.venue.transportation.subway}</TransportText>
        </TransportItem>
        <TransportItem>
          <TransportLabel>Bus</TransportLabel>
          <TransportText>{weddingConfig.venue.transportation.bus}</TransportText>
        </TransportItem>
      </TransportCard>
      
      <ParkingCard>
        <CardTitle>Parking</CardTitle>
        <TransportText>{weddingConfig.venue.parking || 'Not yet defined'}</TransportText>
      </ParkingCard>
      
      {/* Groom's shuttle - always show; "Not yet defined" when no info */}
      <ShuttleCard>
        <ShuttleCardHeader onClick={() => toggleShuttle('groom')} $isExpanded={expandedShuttle === 'groom'}>
          <CardTitle>Groom&apos;s shuttle</CardTitle>
          <ExpandIcon $isExpanded={expandedShuttle === 'groom'}>
            {expandedShuttle === 'groom' ? '−' : '+'}
          </ExpandIcon>
        </ShuttleCardHeader>
        
        {expandedShuttle === 'groom' && (
          <ShuttleContent>
            {weddingConfig.venue.groomShuttle ? (
              <>
                <ShuttleInfo>
                  <ShuttleLabel>Pick-up location</ShuttleLabel>
                  <ShuttleText>{formatTextWithLineBreaks(weddingConfig.venue.groomShuttle.location)}</ShuttleText>
                </ShuttleInfo>
                <ShuttleInfo>
                  <ShuttleLabel>Departure time</ShuttleLabel>
                  <ShuttleText>{weddingConfig.venue.groomShuttle.departureTime}</ShuttleText>
                </ShuttleInfo>
                <ShuttleInfo>
                  <ShuttleLabel>Contact</ShuttleLabel>
                  <ShuttleText>
                    {weddingConfig.venue.groomShuttle.contact.name} ({weddingConfig.venue.groomShuttle.contact.tel})
                    <ShuttleCallButton href={`tel:${weddingConfig.venue.groomShuttle.contact.tel}`}>
                      Call
                    </ShuttleCallButton>
                  </ShuttleText>
                </ShuttleInfo>
              </>
            ) : (
              <ShuttleText>Not yet defined</ShuttleText>
            )}
          </ShuttleContent>
        )}
      </ShuttleCard>
      
      {/* Bride's shuttle - always show; "Not yet defined" when no info */}
      <ShuttleCard>
        <ShuttleCardHeader onClick={() => toggleShuttle('bride')} $isExpanded={expandedShuttle === 'bride'}>
          <CardTitle>Bride&apos;s shuttle</CardTitle>
          <ExpandIcon $isExpanded={expandedShuttle === 'bride'}>
            {expandedShuttle === 'bride' ? '−' : '+'}
          </ExpandIcon>
        </ShuttleCardHeader>
        
        {expandedShuttle === 'bride' && (
          <ShuttleContent>
            {weddingConfig.venue.brideShuttle ? (
              <>
                <ShuttleInfo>
                  <ShuttleLabel>Pick-up location</ShuttleLabel>
                  <ShuttleText>{formatTextWithLineBreaks(weddingConfig.venue.brideShuttle.location)}</ShuttleText>
                </ShuttleInfo>
                <ShuttleInfo>
                  <ShuttleLabel>Departure time</ShuttleLabel>
                  <ShuttleText>{weddingConfig.venue.brideShuttle.departureTime}</ShuttleText>
                </ShuttleInfo>
                <ShuttleInfo>
                  <ShuttleLabel>Contact</ShuttleLabel>
                  <ShuttleText>
                    {weddingConfig.venue.brideShuttle.contact.name} ({weddingConfig.venue.brideShuttle.contact.tel})
                    <ShuttleCallButton href={`tel:${weddingConfig.venue.brideShuttle.contact.tel}`}>
                      Call
                    </ShuttleCallButton>
                  </ShuttleText>
                </ShuttleInfo>
              </>
            ) : (
              <ShuttleText>Not yet defined</ShuttleText>
            )}
          </ShuttleContent>
        )}
      </ShuttleCard>
    </VenueSectionContainer>
  );
};

const VenueSectionContainer = styled.section<{ $bgColor: 'white' | 'beige' }>`
  padding: 4rem 1.5rem;
  text-align: center;
  background-color: ${props => props.$bgColor === 'beige' ? '#F8F6F2' : 'white'};
`;

const SectionTitle = styled.h2`
  position: relative;
  display: inline-block;
  margin-bottom: 2rem;
  font-weight: 500;
  font-size: 1.5rem;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -16px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--secondary-color);
  }
`;

const VenueInfo = styled.div`
  margin-bottom: 1.5rem;
`;

const VenueName = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const VenueAddress = styled.p`
  margin-bottom: 0.5rem;
`;

const VenueTel = styled.a`
  color: var(--secondary-color);
  text-decoration: none;
`;

const MapContainer = styled.div`
  height: 16rem;
  margin-bottom: 1rem;
  background-color: #f1f1f1;
  border-radius: 8px;
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
  position: relative;
`;

const StaticMapContainer = styled.div`
  height: 16rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  overflow: hidden;
`;

const StaticMapImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StaticMapPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-medium);
  font-size: 0.9rem;
`;

const MapOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 1rem;
  text-align: center;
`;

const MapLoading = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-medium);
`;

const NavigateButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
`;

const MapActionButtonsContainer = styled(NavigateButtonsContainer)`
  margin-bottom: 0.75rem;
`;

const RouteStatusText = styled.p`
  max-width: 36rem;
  margin: 0 auto 0.75rem;
  font-size: 0.875rem;
  color: var(--text-medium);
`;

const RoutePanel = styled.div`
  max-width: 36rem;
  margin: 0 auto 1.5rem;
  text-align: left;
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--text-dark);
  min-height: 2.5rem;

  &:empty {
    display: none;
  }
`;

const NavigateButton = styled.button<{ $mapType?: 'amap' | 'baidu' | 'google' | 'apple' }>`
  flex: 1;
  min-width: 6rem;
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #c4a986;
    box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
  }
  
  &:active:after {
    animation: ripple 0.6s ease-out;
  }
  
  @keyframes ripple {
    0% {
      transform: scale(0, 0);
      opacity: 0.5;
    }
    20% {
      transform: scale(25, 25);
      opacity: 0.3;
    }
    100% {
      opacity: 0;
      transform: scale(40, 40);
    }
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
`;

const TransportCard = styled(Card)``;
const ParkingCard = styled(Card)``;
const ShuttleCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const CardTitle = styled.h4`
  font-weight: 500;
  margin-bottom: 1rem;
  font-size: 1rem;
`;

const TransportItem = styled.div`
  margin-bottom: 1rem;
`;

const TransportLabel = styled.p`
  font-weight: 500;
  font-size: 0.875rem;
`;

const TransportText = styled.p`
  font-size: 0.875rem;
  color: var(--text-medium);
  white-space: pre-line;
`;

const ShuttleInfo = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ShuttleLabel = styled.p`
  font-weight: 500;
  font-size: 0.875rem;
`;

const ShuttleText = styled.p`
  font-size: 0.875rem;
  color: var(--text-medium);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ShuttleCallButton = styled.a`
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
  text-decoration: none;
  margin-left: 0.5rem;
  position: relative;
  overflow: hidden;
  
  &:active {
    transform: translateY(1px);
  }
  
  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
  }
  
  &:active:after {
    animation: ripple 0.6s ease-out;
  }
`;

const ShuttleCardHeader = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  cursor: pointer;
  border-bottom: ${props => props.$isExpanded ? '1px solid #eee' : 'none'};
  
  h4 {
    margin: 0;
  }
`;

const ExpandIcon = styled.span<{ $isExpanded: boolean }>`
  font-size: 1.5rem;
  line-height: 1;
  color: var(--secondary-color);
  transition: transform 0.3s ease;
  transform: ${props => props.$isExpanded ? 'rotate(0deg)' : 'rotate(0deg)'};
`;

const ShuttleContent = styled.div`
  padding: 1rem 1.5rem 1.5rem;
`;

export default VenueSection; 