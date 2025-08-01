import React from 'react';
import { Avatar, Typography, Tooltip } from '@mui/material';
import { User } from '@supabase/supabase-js';

interface UserAvatarProps {
  user: User;
  size?: number;
  showInitials?: boolean;
  onClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 32,
  showInitials = true,
  onClick,
}) => {
  // Get user display name
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';

  // Get avatar URL from various sources
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  // Generate initials from display name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(displayName);

  const content = (
    <div
      onClick={() => {
        if (onClick) {
          onClick();
        }
      }}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 1300,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <Avatar
        src={avatarUrl}
        sx={{
          width: size,
          height: size,
          background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #4B96DC, #00d4ff)',
          color: 'white',
          fontSize: size * 0.4,
          fontWeight: 600,
          border: onClick ? '3px solid #ff0000' : '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        {!avatarUrl && initials}
      </Avatar>

      {showInitials && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
            fontWeight: 500,
            fontSize: '12px',
            display: { xs: 'none', md: 'block' },
          }}
        >
          {displayName.split(' ')[0]}
        </Typography>
      )}
    </div>
  );

  // Wrap with tooltip if onClick is provided (indicating sign out functionality)
  if (onClick) {
    return (
      <Tooltip title="Click to sign out" placement="bottom">
        {content}
      </Tooltip>
    );
  }

  return content;
};
