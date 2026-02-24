'use client';

import React from 'react';
import styled from 'styled-components';
import { weddingConfig } from '../config/wedding-config';

const watermarkId = weddingConfig.meta._jwk_watermark_id || 'JWK-NonCommercial';
const dateString = '2025-09-21'; 

export const Watermark: React.FC = () => {
  return (
    <HiddenWatermark className="jwk-watermark-container" data-jwk-id={watermarkId}>
      <WatermarkData id={`jwk-${watermarkId}`}>
        This template is for non-commercial use only.
        {dateString}
      </WatermarkData>
    </HiddenWatermark>
  );
};

export const getWatermarkProps = () => {
  return {
    'data-jwk-id': watermarkId,
    className: `jwk-${watermarkId.slice(0, 5)}-container`
  };
};

export const getWatermarkComment = (section: string): string => {
  return `WeddingInvitation-${section}-${watermarkId}`;
};

// 스타일 컴포넌트
const HiddenWatermark = styled.div`
  position: absolute;
  opacity: 0;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
  z-index: -9999;
`;

const WatermarkData = styled.span`
  font-size: 0;
  color: transparent;
`;

export default Watermark; 