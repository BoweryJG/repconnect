import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Button,
  Avatar,
  Fade,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import MessageIcon from '@mui/icons-material/Message';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
  tags?: string[];
  avatar?: string;
  isFavorite?: boolean;
}

interface DigitalRolodexProps {
  contacts: Contact[];
  onCall: (contact: Contact) => void;
  onSendSMS?: (contact: Contact) => void;
  onToggleFavorite?: (contact: Contact) => void;
}

const ITEM_HEIGHT = 80;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

export const DigitalRolodex: React.FC<DigitalRolodexProps> = ({
  contacts,
  onCall,
  onSendSMS,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [currentScrollIndex, setCurrentScrollIndex] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const listRef = useRef<List>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sort and filter contacts
  const processedContacts = useMemo(() => {
    let filtered = contacts;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.phoneNumber.includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort alphabetically with favorites first
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [contacts, searchQuery]);

  // Create letter index mapping
  const letterIndices = useMemo(() => {
    const indices: { [key: string]: number } = {};
    processedContacts.forEach((contact, index) => {
      const firstLetter = contact.name[0]?.toUpperCase() || '#';
      if (!indices[firstLetter]) {
        indices[firstLetter] = index;
      }
    });
    return indices;
  }, [processedContacts]);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechRef.current = new SpeechSynthesisUtterance();
      speechRef.current.rate = 1.2; // Slightly faster speech
      speechRef.current.pitch = 1;
      speechRef.current.volume = 0.8;
    }
  }, []);

  // Voice announcement function
  const announceContact = useCallback((contact: Contact) => {
    if (!voiceEnabled || !speechRef.current) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Announce contact name
    speechRef.current.text = contact.name;
    window.speechSynthesis.speak(speechRef.current);
  }, [voiceEnabled]);

  // Handle scroll events
  const handleScroll = useCallback((scrollInfo: { scrollOffset: number }) => {
    const newIndex = Math.floor(scrollInfo.scrollOffset / ITEM_HEIGHT);
    
    if (newIndex !== currentScrollIndex && processedContacts[newIndex]) {
      setCurrentScrollIndex(newIndex);
      announceContact(processedContacts[newIndex]);
    }
  }, [currentScrollIndex, processedContacts, announceContact]);

  // Jump to letter
  const jumpToLetter = useCallback((letter: string) => {
    const index = letterIndices[letter];
    if (index !== undefined && listRef.current) {
      listRef.current.scrollToItem(index, 'start');
      setSelectedLetter(letter);
      
      // Announce the letter and first contact
      if (voiceEnabled && processedContacts[index]) {
        window.speechSynthesis.cancel();
        if (speechRef.current) {
          speechRef.current.text = `${letter}. ${processedContacts[index].name}`;
          window.speechSynthesis.speak(speechRef.current);
        }
      }
      
      setTimeout(() => setSelectedLetter(null), 1000);
    }
  }, [letterIndices, voiceEnabled, processedContacts]);

  // Row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const contact = processedContacts[index];
    if (!contact) return null;

    const isHovered = hoveredIndex === index;

    return (
      <div
        style={style}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div
          style={{
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.2s',
            backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            cursor: 'pointer',
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'primary.main',
              fontSize: '1.2rem',
              fontWeight: 600,
            }}
            src={contact.avatar}
          >
            {contact.name.substring(0, 2).toUpperCase()}
          </Avatar>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: '1.1rem',
                color: 'white',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {contact.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.95rem',
              }}
            >
              {contact.phoneNumber}
            </Typography>
          </div>

          <Fade in={isHovered}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.(contact);
                }}
                sx={{ color: contact.isFavorite ? 'warning.main' : 'rgba(255, 255, 255, 0.5)' }}
              >
                {contact.isFavorite ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
              {onSendSMS && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendSMS(contact);
                  }}
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  <MessageIcon />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onCall(contact);
                }}
                sx={{
                  color: 'white',
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                <PhoneIcon />
              </IconButton>
            </div>
          </Fade>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}
      </style>
      <div
        style={{
          display: 'flex',
          height: '100%',
          position: 'relative',
        }}
      >
      {/* Main Rolodex */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          overflow: 'hidden',
        }}
      >
        {/* Search Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  '& input': {
                    padding: '12px 8px',
                  },
                },
              }}
            />
            <IconButton
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              sx={{
                color: voiceEnabled ? 'primary.main' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              title={voiceEnabled ? 'Disable voice announcements' : 'Enable voice announcements'}
            >
              {voiceEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </div>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.95rem',
            }}
          >
            {processedContacts.length} of {contacts.length} contacts
            {voiceEnabled && ' • Voice enabled'}
          </Typography>
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, position: 'relative' }}>
          <List
            ref={listRef}
            height={window.innerHeight - 200}
            itemCount={processedContacts.length}
            itemSize={ITEM_HEIGHT}
            width="100%"
            onScroll={handleScroll}
          >
            {Row}
          </List>

          {/* Letter Overlay */}
          {selectedLetter && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '5rem',
                fontWeight: 700,
                color: '#6366F1',
                pointerEvents: 'none',
                animation: 'fadeOut 1s forwards',
              }}
            >
              {selectedLetter}
            </div>
          )}
        </div>
      </div>

      {/* Alphabet Navigation */}
      <div
        style={{
          width: '40px',
          marginLeft: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '16px 0',
        }}
      >
        {ALPHABET.map((letter) => {
          const hasContacts = !!letterIndices[letter];
          return (
            <Button
              key={letter}
              onClick={() => jumpToLetter(letter)}
              disabled={!hasContacts}
              sx={{
                minWidth: 'auto',
                p: 0,
                height: 24,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: hasContacts ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              {letter}
            </Button>
          );
        })}
      </div>
    </div>
    </>
  );
};