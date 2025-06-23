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
  const columnCount = Math.floor(width / (CARD_WIDTH + CARD_GAP));
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
      height={height}
      rowCount={rowCount}
      rowHeight={CARD_HEIGHT + CARD_GAP}
      width={width}
    >
      {Cell}
    </Grid>
  );
};