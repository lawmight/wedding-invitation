'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { weddingConfig } from '../../config/wedding-config';

interface RsvpSectionProps {
  bgColor?: 'white' | 'beige';
}

const RsvpSection = ({ bgColor = 'white' }: RsvpSectionProps) => {
  const [formData, setFormData] = useState({
    name: '',
    isAttending: null as boolean | null,
    guestCount: 1,
    side: '' as 'BRIDE' | 'GROOM' | '',
    hasMeal: null as boolean | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 식사 여부 옵션 표시 설정
  const showMealOption = weddingConfig.rsvp?.showMealOption ?? true;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAttendingChange = (value: boolean) => {
    setFormData({
      ...formData,
      isAttending: value,
      guestCount: value ? 1 : 0,
      // 참석하지 않으면 식사 여부도 null로 설정
      hasMeal: value ? formData.hasMeal : null,
    });
  };

  const handleSideChange = (side: 'BRIDE' | 'GROOM') => {
    setFormData({
      ...formData,
      side,
    });
  };

  const handleMealChange = (value: boolean) => {
    setFormData({
      ...formData,
      hasMeal: value,
    });
  };

  const handleGuestCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      guestCount: parseInt(e.target.value, 10),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.isAttending === null || !formData.side) {
      setSubmitStatus({
        success: false,
        message: 'Please enter your name, attendance, and side.',
      });
      return;
    }
    
    if (showMealOption && formData.isAttending && formData.hasMeal === null) {
      setSubmitStatus({
        success: false,
        message: 'Please select your meal preference.',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 현재 시간을 직접 한국 시간으로 생성
      const now = new Date();
      
      // Slack 웹훅으로 메시지 전송
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          side: formData.side === 'BRIDE' ? '신부측' : '신랑측',
          isAttending: formData.isAttending,
          guestCount: formData.isAttending ? formData.guestCount : 0,
          hasMeal: formData.isAttending ? formData.hasMeal : false,
          timestamp: now.toISOString(),
        }),
      });
      
      if (response.ok) {
        setSubmitStatus({
          success: true,
          message: 'Your RSVP has been sent successfully. Thank you.',
        });
        setFormData({
          name: '',
          isAttending: null,
          guestCount: 1,
          side: '',
          hasMeal: null,
        });
      } else {
        throw new Error('서버 응답 오류');
      }
    } catch (error) {
      console.error('RSVP 제출 오류:', error);
      setSubmitStatus({
        success: false,
        message: 'An error occurred while sending your RSVP. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RsvpSectionContainer $bgColor={bgColor}>
      <SectionTitle>RSVP</SectionTitle>
      
      <RsvpDescription>
        Please let us know if you can join us on our special day.<br />
        Your response will help us prepare for your celebration.<br />
        We sincerely thank you.
      </RsvpDescription>
      
      {submitStatus && (
        <StatusMessage $success={submitStatus.success.toString()}>
          {submitStatus.message}
        </StatusMessage>
      )}
      
      <RsvpForm onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </FormGroup>
        
        <FormRow>
          <FormColumn>
            <Label as="p">Side</Label>
            <AttendanceButtons>
              <AttendanceButton 
                type="button"
                $selected={formData.side === 'GROOM'}
                onClick={() => handleSideChange('GROOM')}
              >
                Groom&apos;s side
              </AttendanceButton>
              <AttendanceButton 
                type="button"
                $selected={formData.side === 'BRIDE'}
                onClick={() => handleSideChange('BRIDE')}
              >
                Bride&apos;s side
              </AttendanceButton>
            </AttendanceButtons>
          </FormColumn>

          <FormColumn>
            <Label as="p">Attendance</Label>
            <AttendanceButtons>
              <AttendanceButton 
                type="button"
                $selected={formData.isAttending === true}
                onClick={() => handleAttendingChange(true)}
              >
                Attending
              </AttendanceButton>
              <AttendanceButton 
                type="button"
                $selected={formData.isAttending === false}
                onClick={() => handleAttendingChange(false)}
              >
                Not attending
              </AttendanceButton>
            </AttendanceButtons>
          </FormColumn>
        </FormRow>
        
        {formData.isAttending && (
          <FormRow>
            <FormColumn>
              <Label htmlFor="guestCount">Number of guests</Label>
              <Select
                id="guestCount"
                name="guestCount"
                value={formData.guestCount}
                onChange={handleGuestCountChange}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'guest' : 'guests'}
                  </option>
                ))}
              </Select>
            </FormColumn>
            
            {showMealOption && (
              <FormColumn>
                <Label as="p">Meal</Label>
                <AttendanceButtons>
                  <AttendanceButton 
                    type="button"
                    $selected={formData.hasMeal === true}
                    onClick={() => handleMealChange(true)}
                  >
                    Having meal
                  </AttendanceButton>
                  <AttendanceButton 
                    type="button"
                    $selected={formData.hasMeal === false}
                    onClick={() => handleMealChange(false)}
                  >
                    No meal
                  </AttendanceButton>
                </AttendanceButtons>
              </FormColumn>
            )}
          </FormRow>
        )}
        
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send RSVP'}
        </SubmitButton>
      </RsvpForm>
    </RsvpSectionContainer>
  );
};

const RsvpSectionContainer = styled.section<{ $bgColor: 'white' | 'beige' }>`
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

const RsvpDescription = styled.p`
  margin-bottom: 2rem;
  font-size: 0.9rem;
  color: var(--text-medium);
  line-height: 1.6;
`;

const StatusMessage = styled.div<{ $success: string }>`
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
  background-color: ${props => props.$success === 'true' ? '#e7f3eb' : '#fbedec'};
  color: ${props => props.$success === 'true' ? '#2e7d32' : '#c62828'};
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
`;

const RsvpForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 36rem;
  margin: 0 auto;
  text-align: left;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const FormColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: var(--text-dark);
`;

const Input = styled.input`
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid var(--secondary-color);
  font-size: 1rem;
  background-color: transparent;
  
  &:focus {
    outline: none;
    border-bottom: 1px solid var(--text-dark);
  }
`;

const AttendanceButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AttendanceButton = styled.button<{ $selected?: boolean }>`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid ${props => props.$selected ? 'var(--secondary-color)' : '#ccc'};
  border-radius: 4px;
  background-color: ${props => props.$selected ? 'var(--secondary-color)' : 'transparent'};
  color: ${props => props.$selected ? 'white' : 'var(--text-medium)'};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: var(--secondary-color);
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

const Select = styled.select`
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid var(--secondary-color);
  font-size: 1rem;
  background-color: transparent;
  
  &:focus {
    outline: none;
    border-bottom: 1px solid var(--text-dark);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid var(--secondary-color);
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--text-dark);
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem;
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  
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
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

export default RsvpSection; 