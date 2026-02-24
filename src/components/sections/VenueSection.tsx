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
  Map: new (container: string | HTMLElement, opts?: { center?: [number, number]; zoom?: number }) => AMapMap;
  Marker: new (opts: { position: [number, number]; map?: AMapMap }) => AMapMarker;
  InfoWindow: new (opts: { content?: string }) => AMapInfoWindow;
}
interface AMapMap {
  setCenter(center: [number, number]): void;
  destroy(): void;
}
interface AMapMarker {
  setMap(map: AMapMap | null): void;
}
interface AMapInfoWindow {
  open(map: AMapMap, position: [number, number]): void;
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
  const amapKey = process.env.NEXT_PUBLIC_AMAP_KEY || '';
  const amapSecurityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE || '';
  const debugInfo = useMemo(() => amapKey ? `Key: ${amapKey.substring(0, 4)}...` : 'No AMAP key', [amapKey]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(!amapKey || !amapSecurityCode);
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

    let mapInstance: AMapMap | null = null;

    window.AMapLoader.load({ key: amapKey, version: '2.0' })
      .then((AMap) => {
        if (!mapRef.current) return;
        try {
          const lng = weddingConfig.venue.coordinates.longitude;
          const lat = weddingConfig.venue.coordinates.latitude;
          const center: [number, number] = [lng, lat];
          const zoom = parseInt(weddingConfig.venue.mapZoom, 10) || 15;

          const map = new AMap.Map(AMAP_CONTAINER_ID, {
            center,
            zoom,
          });
          mapInstance = map as unknown as AMapMap;

          new AMap.Marker({ position: center, map: map as unknown as AMapMap });
          const infoWindow = new AMap.InfoWindow({
            content: `<div style="padding:10px;min-width:150px;text-align:center;font-size:14px;"><strong>${weddingConfig.venue.name}</strong></div>`,
          });
          infoWindow.open(map as unknown as AMapMap, center);
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
      if (mapInstance && typeof (mapInstance as AMapMap & { destroy?: () => void }).destroy === 'function') {
        (mapInstance as AMapMap & { destroy: () => void }).destroy();
      }
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
    const name = encodeURIComponent(weddingConfig.venue.name);
    // 高德 URI scheme: navigation to destination
    const url = `https://uri.amap.com/navigation?dest=${longitude},${latitude}&destName=${name}`;
    window.open(url, '_blank');
  };
  
  const navigateToNaver = () => {
    if (typeof window !== 'undefined') {
      // 네이버 지도 앱/웹으로 연결하는 URL (새로운 형식)
      const naverMapsUrl = `https://map.naver.com/p/directions/-/-/-/walk/place/${weddingConfig.venue.placeId}?c=${weddingConfig.venue.mapZoom},0,0,0,dh`;
      window.open(naverMapsUrl, '_blank');
    }
  };
  
  const navigateToKakao = () => {
    if (typeof window !== 'undefined') {
      // 카카오맵 앱/웹으로 연결
      const lat = weddingConfig.venue.coordinates.latitude;
      const lng = weddingConfig.venue.coordinates.longitude;
      const name = encodeURIComponent(weddingConfig.venue.name);
      const address = encodeURIComponent(weddingConfig.venue.address);
      const kakaoMapsUrl = `https://map.kakao.com/link/to/${name},${lat},${lng}`;
      window.open(kakaoMapsUrl, '_blank');
    }
  };
  
  const navigateToTmap = () => {
    if (typeof window !== 'undefined') {
      // TMAP 앱으로 연결 (앱 딥링크만 사용)
      const lat = weddingConfig.venue.coordinates.latitude;
      const lng = weddingConfig.venue.coordinates.longitude;
      const name = encodeURIComponent(weddingConfig.venue.name);
      
      // 모바일 디바이스에서는 앱 실행 시도
      window.location.href = `tmap://route?goalname=${name}&goaly=${lat}&goalx=${lng}`;
      
      // 앱이 설치되어 있지 않을 경우를 대비해 약간의 지연 후 TMAP 웹사이트로 이동
      setTimeout(() => {
        // TMAP이 설치되어 있지 않으면 TMAP 웹사이트 메인으로 이동
        if(document.hidden) return; // 앱이 실행되었으면 아무것도 하지 않음
        window.location.href = 'https://tmap.co.kr';
      }, 1000);
    }
  };
  
  return (
    <VenueSectionContainer $bgColor={bgColor}>
      <SectionTitle>Venue</SectionTitle>
      
      <VenueInfo>
        <VenueName>{weddingConfig.venue.name}</VenueName>
        <VenueAddress>{formatTextWithLineBreaks(weddingConfig.venue.address)}</VenueAddress>
        <VenueTel href={`tel:${weddingConfig.venue.tel}`}>{weddingConfig.venue.tel}</VenueTel>
      </VenueInfo>
      
      {mapError ? (
        renderStaticMap()
      ) : (
        <MapContainer ref={mapRef} id={AMAP_CONTAINER_ID}>
          {!mapLoaded && <MapLoading>Loading map...{debugInfo}</MapLoading>}
        </MapContainer>
      )}
      
      <NavigateButtonsContainer>
        <NavigateButton onClick={navigateToAmap} $mapType="naver">
          AMAP
        </NavigateButton>
        <NavigateButton onClick={navigateToNaver} $mapType="naver">
          Naver Map
        </NavigateButton>
        <NavigateButton onClick={navigateToKakao} $mapType="kakao">
          Kakao Map
        </NavigateButton>
        <NavigateButton onClick={navigateToTmap} $mapType="tmap">
          TMAP
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
        <TransportText>{weddingConfig.venue.parking}</TransportText>
      </ParkingCard>
      
      {/* 신랑측 배차 안내 - 정보가 있을 때만 표시 */}
      {weddingConfig.venue.groomShuttle && (
        <ShuttleCard>
          <ShuttleCardHeader onClick={() => toggleShuttle('groom')} $isExpanded={expandedShuttle === 'groom'}>
            <CardTitle>Groom&apos;s shuttle</CardTitle>
            <ExpandIcon $isExpanded={expandedShuttle === 'groom'}>
              {expandedShuttle === 'groom' ? '−' : '+'}
            </ExpandIcon>
          </ShuttleCardHeader>
          
          {expandedShuttle === 'groom' && (
            <ShuttleContent>
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
            </ShuttleContent>
          )}
        </ShuttleCard>
      )}
      
      {/* 신부측 배차 안내 - 정보가 있을 때만 표시 */}
      {weddingConfig.venue.brideShuttle && (
        <ShuttleCard>
          <ShuttleCardHeader onClick={() => toggleShuttle('bride')} $isExpanded={expandedShuttle === 'bride'}>
            <CardTitle>Bride&apos;s shuttle</CardTitle>
            <ExpandIcon $isExpanded={expandedShuttle === 'bride'}>
              {expandedShuttle === 'bride' ? '−' : '+'}
            </ExpandIcon>
          </ShuttleCardHeader>
          
          {expandedShuttle === 'bride' && (
            <ShuttleContent>
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
            </ShuttleContent>
          )}
        </ShuttleCard>
      )}
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

const NavigateButton = styled.button<{ $mapType?: 'naver' | 'kakao' | 'tmap' }>`
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