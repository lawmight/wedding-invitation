'use client';

import React from 'react';
import styled from 'styled-components';
import { weddingConfig } from '../../config/wedding-config';

interface InvitationSectionProps {
  bgColor?: 'white' | 'beige';
}

const InvitationSection = ({ bgColor = 'white' }: InvitationSectionProps) => {
  const { invitation } = weddingConfig;
  
  const hasGroomFather = Boolean(invitation.groom.father && invitation.groom.father.trim() !== '');
  const hasGroomMother = Boolean(invitation.groom.mother && invitation.groom.mother.trim() !== '');
  const hasGroomParents = hasGroomFather || hasGroomMother;
  
  const hasBrideFather = Boolean(invitation.bride.father && invitation.bride.father.trim() !== '');
  const hasBrideMother = Boolean(invitation.bride.mother && invitation.bride.mother.trim() !== '');
  const hasBrideParents = hasBrideFather || hasBrideMother;
  
  const translateLabel = (label: string): string => {
    const map: Record<string, string> = {
      '아들': 'Son',
      '딸': 'Daughter',
      '신랑': 'Groom',
      '신부': 'Bride',
    };
    return map[label] ?? label;
  };

  const getParentsText = (
    father: string, 
    mother: string, 
    hasFather: boolean, 
    hasMother: boolean
  ): string => {
    if (hasFather && hasMother) {
      return `${father} · ${mother}`;
    } else if (hasFather) {
      return father;
    } else if (hasMother) {
      return mother;
    }
    return "";
  };
  
  const groomParentsText = getParentsText(
    invitation.groom.father || '',
    invitation.groom.mother || '',
    hasGroomFather,
    hasGroomMother
  );
  
  const brideParentsText = getParentsText(
    invitation.bride.father || '',
    invitation.bride.mother || '',
    hasBrideFather,
    hasBrideMother
  );
  
  return (
    <InvitationSectionContainer $bgColor={bgColor}>
      <InvitationMessage>
        {invitation.message}
      </InvitationMessage>
      
      <CoupleContainer>
        <CoupleInfo>
          {hasGroomParents ? (
            <ParentsNames>
              {groomParentsText}
              <ParentLabel> &apos;s {translateLabel(invitation.groom.label || "아들")}</ParentLabel>
            </ParentsNames>
          ) : (
            <ParentsNames>
              <ParentLabel>Groom</ParentLabel>
            </ParentsNames>
          )}
          <CoupleName>{invitation.groom.name}</CoupleName>
        </CoupleInfo>
        
        <CoupleInfo>
          {hasBrideParents ? (
            <ParentsNames>
              {brideParentsText}
              <ParentLabel> &apos;s {translateLabel(invitation.bride.label || "딸")}</ParentLabel>
            </ParentsNames>
          ) : (
            <ParentsNames>
              <ParentLabel>Bride</ParentLabel>
            </ParentsNames>
          )}
          <CoupleName>{invitation.bride.name}</CoupleName>
        </CoupleInfo>
      </CoupleContainer>
    </InvitationSectionContainer>
  );
};

const InvitationSectionContainer = styled.section<{ $bgColor: 'white' | 'beige' }>`
  padding: 4rem 1.5rem;
  text-align: center;
  background-color: ${props => props.$bgColor === 'beige' ? '#F8F6F2' : 'white'};
`;

const InvitationMessage = styled.p`
  white-space: pre-line;
  line-height: 1.8;
  max-width: 36rem;
  margin: 0 auto 2rem auto;
  font-size: 1rem;
  
  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const CoupleContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  
  @media (min-width: 768px) {
    gap: 4rem;
  }
`;

const CoupleInfo = styled.div`
  text-align: center;
`;

const ParentsNames = styled.p`
  margin-bottom: 0.25rem;
`;

const ParentLabel = styled.span`
  font-size: 0.875rem;
  margin-left: 0.25rem;
`;

const CoupleName = styled.p`
  font-size: 1.25rem;
  font-weight: 500;
`;

export default InvitationSection; 