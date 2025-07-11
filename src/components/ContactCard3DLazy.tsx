import React, { lazy, Suspense } from 'react';
import { Card, Skeleton } from '@mui/material';

const ContactCard3D = lazy(() =>
  import('./ContactCard3D').then((module) => ({ default: module.ContactCard3D }))
);

interface ContactCard3DLazyProps {
  contact: any;
  onClick: () => void;
  selected: boolean;
  depth: number;
}

export const ContactCard3DLazy: React.FC<ContactCard3DLazyProps> = (props) => {
  return (
    <Suspense
      fallback={
        <Card
          sx={{
            height: 200,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Skeleton variant="rectangular" height={200} />
        </Card>
      }
    >
      <ContactCard3D {...props} />
    </Suspense>
  );
};
