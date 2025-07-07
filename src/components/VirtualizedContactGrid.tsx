import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { PremiumContactCard } from './PremiumContactCard';

interface VirtualizedContactGridProps {
  contacts: any[];
  onContactClick: (contact: any) => void;
  selectedContactId?: string;
  width: number;
  height: number;
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 280;
const CARD_GAP = 24;

export const VirtualizedContactGrid: React.FC<VirtualizedContactGridProps> = ({
  contacts,
  onContactClick,
  selectedContactId,
  width,
  height,
}) => {
  // Prevent division by zero and ensure minimum dimensions
  const safeWidth = Math.max(width || 1200, CARD_WIDTH + CARD_GAP);
  const safeHeight = Math.max(height || 600, CARD_HEIGHT + CARD_GAP);
  
  const columnCount = Math.max(1, Math.floor(safeWidth / (CARD_WIDTH + CARD_GAP)));
  const rowCount = Math.ceil(contacts.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= contacts.length) return null;

    const contact = contacts[index];
    
    return (
      <div 
        style={{
          ...style,
          padding: CARD_GAP / 2,
        }}
      >
        <PremiumContactCard
          contact={contact}
          onClick={() => onContactClick(contact)}
          onCall={() => onContactClick(contact)}
        />
      </div>
    );
  };

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={CARD_WIDTH + CARD_GAP}
      height={safeHeight}
      rowCount={rowCount}
      rowHeight={CARD_HEIGHT + CARD_GAP}
      width={safeWidth}
    >
      {Cell}
    </Grid>
  );
};