'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import { weddingConfig } from '../../config/wedding-config';

const watermarkId = weddingConfig.meta._jwk_watermark_id || 'JWK-NonCommercial';
const EDGE_SAMPLE_RATIO = 0.05;
const SAMPLE_STEP = 4;

type RGBColor = {
  r: number;
  g: number;
  b: number;
};

type EdgeColors = {
  top: RGBColor;
  bottom: RGBColor;
};

const averageStripColor = (data: Uint8ClampedArray): RGBColor | null => {
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4 * SAMPLE_STEP) {
    // Skip fully transparent pixels to avoid blending with empty canvas areas.
    if (data[i + 3] === 0) {
      continue;
    }

    red += data[i];
    green += data[i + 1];
    blue += data[i + 2];
    count += 1;
  }

  if (count === 0) {
    return null;
  }

  return {
    r: Math.round(red / count),
    g: Math.round(green / count),
    b: Math.round(blue / count),
  };
};

const MainSection = ({ mainImageUrl }: { mainImageUrl?: string }) => {
  const imageSrc = mainImageUrl ?? weddingConfig.main.image;
  const [edgeColors, setEdgeColors] = useState<EdgeColors | null>(null);

  useEffect(() => {
    let isActive = true;

    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';

    image.onload = () => {
      if (!isActive) {
        return;
      }

      try {
        const width = image.naturalWidth;
        const height = image.naturalHeight;

        if (!width || !height) {
          setEdgeColors(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          setEdgeColors(null);
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        const stripHeight = Math.max(1, Math.floor(height * EDGE_SAMPLE_RATIO));
        const topStrip = context.getImageData(0, 0, width, stripHeight).data;
        const bottomStrip = context.getImageData(0, height - stripHeight, width, stripHeight).data;

        const topColor = averageStripColor(topStrip);
        const bottomColor = averageStripColor(bottomStrip);

        if (!topColor || !bottomColor) {
          setEdgeColors(null);
          return;
        }

        setEdgeColors({
          top: topColor,
          bottom: bottomColor,
        });
      } catch {
        // Canvas can fail for cross-origin images; fallback keeps current behavior.
        setEdgeColors(null);
      }
    };

    image.onerror = () => {
      if (isActive) {
        setEdgeColors(null);
      }
    };

    image.src = imageSrc;

    return () => {
      isActive = false;
    };
  }, [imageSrc]);

  return (
    <MainSectionContainer className={`wedding-container jwk-${watermarkId.slice(0, 8)}-main`}>
      {}
      <BackgroundImage 
        src={imageSrc}
        alt="Wedding background image"
        fill
        priority
        sizes="100vw"
        quality={90}
        style={{ objectFit: 'contain', objectPosition: 'center' }}
      />
      {edgeColors && (
        <>
          <TopColorFade $color={edgeColors.top} />
          <BottomColorFade $color={edgeColors.bottom} />
        </>
      )}
      <Overlay />
      <MainContent>
        <MainTitle>{weddingConfig.main.title}</MainTitle>
        <DateText>{weddingConfig.main.date}</DateText>
        <VenueText>{weddingConfig.main.venue}</VenueText>
        {}
        <HiddenWatermark aria-hidden="true">
          {watermarkId}
        </HiddenWatermark>
      </MainContent>
      
      <ScrollIndicator>
        <i className="fas fa-chevron-down"></i>
      </ScrollIndicator>
    </MainSectionContainer>
  );
};

const MainSectionContainer = styled.section`
  position: relative;
  height: 100vh;
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  padding-top: 3.5vh;
  text-align: center;
  color: white;
  overflow: hidden;
  background: #f8f6f2;

  /* Mobile: don't stretch to full viewport; size by aspect ratio so full image fits */
  @media (max-width: 767px) {
    height: auto;
    min-height: auto;
    aspect-ratio: 9 / 16;
    width: 100%;
  }

  @media (min-width: 768px) and (min-height: 780px) {
    aspect-ratio: 9 / 16;
    max-width: calc(100vh * 9 / 16);
    width: auto;
    margin: 0 auto;
    border-radius: 24px; /* 선택사항: 모서리 둥글게 */
    box-shadow: 0 0 32px rgba(0,0,0,0.08); /* 선택사항: 그림자 */
  }
`;

const BackgroundImage = styled(Image)`
  z-index: 0;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%);
  z-index: 2;
`;

const TopColorFade = styled.div<{ $color: RGBColor }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 28%;
  pointer-events: none;
  z-index: 1;
  background: ${({ $color }) =>
    `linear-gradient(to bottom, rgba(${$color.r}, ${$color.g}, ${$color.b}, 0.6) 0%, rgba(${$color.r}, ${$color.g}, ${$color.b}, 0) 100%)`};
`;

const BottomColorFade = styled.div<{ $color: RGBColor }>`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 26%;
  pointer-events: none;
  z-index: 1;
  background: ${({ $color }) =>
    `linear-gradient(to bottom, rgba(${$color.r}, ${$color.g}, ${$color.b}, 0) 0%, rgba(${$color.r}, ${$color.g}, ${$color.b}, 0.6) 100%)`};
`;

const MainContent = styled.div`
  position: relative;
  z-index: 3;
  margin-top: 0.5vh;
  @media (max-width: 600px) {
    margin-top: 0.5vh;
    padding-left: 1rem;
    padding-right: 1rem;
  }
`;

const MainTitle = styled.h1`
  font-family: 'PlayfairDisplay', 'Times New Roman', serif;
  font-style: italic;
  font-size: 3rem;
  min-height: 3rem;
  letter-spacing: 2px;
  margin-bottom: 1rem;
  font-weight: 400;
  line-height: 1.2;
  
  /* 기본 크기에서 세로 길이가 짧을 때 */
  @media (min-width: 769px) and (max-height: 700px) {
    letter-spacing: 1.5px;
    margin-bottom: 0.8rem;
  }
  @media (min-width: 769px) and (max-height: 600px) {
    letter-spacing: 1px;
    margin-bottom: 0.6rem;
  }
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    min-height: 2.5rem;
  }
  
  /* 768px 이하에서 세로 길이가 짧을 때 */
  @media (max-width: 768px) and (max-height: 650px) {
    letter-spacing: 1px;
    margin-bottom: 0.8rem;
  }
  @media (max-width: 768px) and (max-height: 550px) {
    letter-spacing: 0.5px;
    margin-bottom: 0.6rem;
  }
  
  @media (max-width: 450px) {
    font-size: 2rem;
    min-height: 2rem;
    letter-spacing: 1.5px;
  }
  
  /* 450px 이하에서 세로 길이가 짧을 때 */
  @media (max-width: 450px) and (max-height: 600px) {
    letter-spacing: 1px;
    margin-bottom: 0.8rem;
  }
  @media (max-width: 450px) and (max-height: 500px) {
    letter-spacing: 0.5px;
    margin-bottom: 0.6rem;
  }
  
  @media (max-width: 360px) {
    font-size: 1.8rem;
    min-height: 1.8rem;
    letter-spacing: 1px;
  }
  
  /* 360px 이하에서 세로 길이가 짧을 때 */
  @media (max-width: 360px) and (max-height: 550px) {
    letter-spacing: 0.5px;
    margin-bottom: 0.8rem;
  }
  @media (max-width: 360px) and (max-height: 450px) {
    letter-spacing: 0.2px;
    margin-bottom: 0.6rem;
  }
  
  @media (max-width: 295px) {
    font-size: 1.6rem;
    min-height: 1.6rem;
    letter-spacing: 0.5px;
  }
  
  /* 295px 이하에서 세로 길이가 짧을 때 */
  @media (max-width: 295px) and (max-height: 500px) {
    letter-spacing: 0.2px;
    margin-bottom: 0.8rem;
  }
  @media (max-width: 295px) and (max-height: 400px) {
    letter-spacing: 0px;
    margin-bottom: 0.6rem;
  }
`;

const DateText = styled.p`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  
  /* 기본 크기에서 세로 길이가 짧을 때 */
  @media (min-width: 769px) and (max-height: 700px) {
    margin-bottom: 0.4rem;
  }
  @media (min-width: 769px) and (max-height: 600px) {
    margin-bottom: 0.3rem;
  }
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    min-height: 0.3rem;
  }
  
  /* 768px 이하에서 세로 길이가 짧을 때 */
  @media (max-width: 768px) and (max-height: 650px) {
    margin-bottom: 0.4rem;
  }
  @media (max-width: 768px) and (max-height: 550px) {
    margin-bottom: 0.3rem;
  }
  
  @media (max-width: 450px) {
    font-size: 1.1rem;
    margin-bottom: 0.15rem;
  }
  
  /* 450px 이하에서 세로 길이가 짧을 때 */
  @media (max-width: 450px) and (max-height: 600px) {
    margin-bottom: 0.1rem;
  }
  @media (max-width: 450px) and (max-height: 500px) {
    margin-bottom: 0.05rem;
  }
  
  @media (max-width: 360px) {
    font-size: 1rem;
    margin-bottom: 0.1rem;
  }
  
  /* 360px 이하에서 세로 길이가 짧을 때 */
  @media (max-width: 360px) and (max-height: 550px) {
    margin-bottom: 0.05rem;
  }
  @media (max-width: 360px) and (max-height: 450px) {
    margin-bottom: 0.02rem;
  }
  
  @media (max-width: 295px) {
    font-size: 0.9rem;
    margin-bottom: 0.05rem;
  }
  
  /* 295px 이하에서 세로 길이가 짧을 때 */
  @media (max-width: 295px) and (max-height: 500px) {
    margin-bottom: 0.02rem;
  }
  @media (max-width: 295px) and (max-height: 400px) {
    margin-bottom: 0rem;
  }
`;

const VenueText = styled.p`
  font-size: 1rem;
  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
  @media (max-width: 450px) {
    font-size: 0.9rem;
  }
  @media (max-width: 360px) {
    font-size: 0.85rem;
  }
  @media (max-width: 295px) {
    font-size: 0.75rem;
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  animation: bounce 2s infinite;
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateX(-50%) translateY(0);
    }
    40% {
      transform: translateX(-50%) translateY(-20px);
    }
    60% {
      transform: translateX(-50%) translateY(-10px);
    }
  }
`;

const HiddenWatermark = styled.span`
  position: absolute;
  opacity: 0.01;
  font-size: 1px;
  color: rgba(255, 255, 255, 0.01);
  pointer-events: none;
  user-select: none;
  z-index: -9999;
  bottom: 0;
  right: 0;
`;

export default MainSection; 