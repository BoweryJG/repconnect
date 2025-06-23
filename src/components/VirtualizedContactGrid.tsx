import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { ContactCard3DLazy } from './ContactCard3DLazy';

interface VirtualizedContactGridProps {
  contacts: any[];
  onContactClick: (contact: any) => void;
  selectedContactId?: string;
  width: number;
  height: number;
}

const CARD_WIDTH = 280;
const CARD_HEIGHT = 200;
const CARD_GAP = 16;

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
        <ContactCard3DLazy
          contact={contact}
          onClick={() => onContactClick(contact)}
          selected={selectedContactId === contact.id}
          depth={0}
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