import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Badge,
  LinearProgress,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  EmojiEvents as Trophy,
  TrendingUp,
  Speed,
  Psychology,
  Timer,
  Close,
  SportsMma,
} from '@mui/icons-material';
import { Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { warRoomService, WarRoomCall, BattleMode } from '../services/warRoomService';

interface BattleModeManagerProps {
  currentUserId: string;
  currentUserName: string;
}

export const BattleModeManager: React.FC<BattleModeManagerProps> = ({ 
  currentUserId, 
  currentUserName 
}) => {
  const [battleRequests, setBattleRequests] = useState<any[]>([]);
  const [activeBattle, setActiveBattle] = useState<BattleMode | null>(null);
  const [showBattleDialog, setShowBattleDialog] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<WarRoomCall | null>(null);

  useEffect(() => {
    const unsubscribeBattle = warRoomService.onBattleUpdate((battle) => {
      if (battle.rep1?.repId === currentUserId || battle.rep2?.repId === currentUserId) {
        setActiveBattle(battle);
      }
    });

    return () => {
      unsubscribeBattle();
    };
  }, [currentUserId]);

  const challengeTooBattle = (opponent: WarRoomCall) => {
    setSelectedOpponent(opponent);
    setShowBattleDialog(true);
  };

  const sendBattleRequest = async () => {
    if (!selectedOpponent) return;

    const result = await warRoomService.requestBattle(currentUserId, selectedOpponent.repId);
    if (result.success) {
      setShowBattleDialog(false);
      // Show success notification
    }
  };

  const acceptBattleRequest = async (battleId: string) => {
    await warRoomService.acceptBattle(battleId);
    setBattleRequests(prev => prev.filter(req => req.id !== battleId));
  };

  const declineBattleRequest = async (battleId: string) => {
    await warRoomService.declineBattle(battleId);
    setBattleRequests(prev => prev.filter(req => req.id !== battleId));
  };

  if (!activeBattle) return null;

  return (
    <>
      {/* Battle Mode Overlay */}
      <AnimatePresence>
        {activeBattle.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
            }}
          >
            {/* Battle Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >
                <SportsMma style={{ fontSize: 64, color: '#EC4899' }} />
              </motion.div>
              <Typography variant="h2" sx={{ 
                fontWeight: 900, 
                background: 'linear-gradient(135deg, #EC4899 0%, #6366F1 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mt: 2,
              }}>
                BATTLE MODE
              </Typography>
              <Typography variant="h5" sx={{ color: 'text.secondary', mt: 1 }}>
                {activeBattle.spectatorCount} spectators watching
              </Typography>
            </div>

            {/* Battle Arena */}
            <Grid container spacing={4} sx={{ flex: 1 }}>
              {/* Rep 1 */}
              <Grid item xs={12} md={5}>
                <BattleRepCard
                  call={activeBattle.rep1}
                  score={activeBattle.scores.rep1}
                  isCurrentUser={activeBattle.rep1?.repId === currentUserId}
                />
              </Grid>

              {/* Center Display */}
              <Grid item xs={12} md={2}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  gap: '32px',
                }}>
                  <Typography variant="h1" sx={{ color: '#EC4899', fontWeight: 900 }}>
                    VS
                  </Typography>
                  
                  {/* Score Display */}
                  <Paper sx={{ 
                    p: 2, 
                    background: 'rgba(236, 72, 153, 0.1)',
                    border: '2px solid rgba(236, 72, 153, 0.5)',
                    borderRadius: 2,
                  }}>
                    <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 900 }}>
                      {activeBattle.scores.rep1} - {activeBattle.scores.rep2}
                    </Typography>
                  </Paper>

                  {/* Timer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Timer />
                    <Typography variant="h6">
                      {formatDuration(activeBattle.startTime)}
                    </Typography>
                  </div>
                </div>
              </Grid>

              {/* Rep 2 */}
              <Grid item xs={12} md={5}>
                <BattleRepCard
                  call={activeBattle.rep2}
                  score={activeBattle.scores.rep2}
                  isCurrentUser={activeBattle.rep2?.repId === currentUserId}
                />
              </Grid>
            </Grid>

            {/* Exit Button */}
            <IconButton
              onClick={() => setActiveBattle(null)}
              sx={{
                position: 'absolute',
                top: 24,
                right: 24,
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <Close />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Winner Announcement */}
      <AnimatePresence>
        {activeBattle.winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
              textAlign: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1 }}
            >
              <Trophy sx={{ fontSize: 120, color: '#FFD700' }} />
            </motion.div>
            <Typography variant="h2" sx={{ 
              fontWeight: 900, 
              color: '#FFD700',
              mt: 2,
              textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
            }}>
              WINNER
            </Typography>
            <Typography variant="h3" sx={{ color: 'white', mt: 1 }}>
              {activeBattle.winner === activeBattle.rep1?.repId ? activeBattle.rep1.repName : activeBattle.rep2?.repName}
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Request Dialog */}
      <Dialog
        open={showBattleDialog}
        onClose={() => setShowBattleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Challenge to Battle
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Challenge <strong>{selectedOpponent?.repName}</strong> to a sales battle?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Both reps must be on active calls. The battle will compare real-time performance metrics,
            confidence scores, and Harvey's analysis.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBattleDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={sendBattleRequest}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #EC4899 0%, #6366F1 100%)',
            }}
          >
            Send Challenge
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Battle Rep Card Component
const BattleRepCard: React.FC<{
  call: WarRoomCall | null;
  score: number;
  isCurrentUser: boolean;
}> = ({ call, score, isCurrentUser }) => {
  if (!call) return null;

  const statusColor = call.confidence > 70 ? '#10B981' : call.confidence > 40 ? '#F59E0B' : '#EF4444';

  return (
    <Card sx={{
      background: isCurrentUser ? 'rgba(99, 102, 241, 0.1)' : 'rgba(26, 26, 26, 0.95)',
      border: `2px solid ${statusColor}`,
      height: '100%',
    }}>
      <CardContent>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: statusColor,
                width: 16,
                height: 16,
                animation: 'pulse 2s infinite',
              },
            }}
          >
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(99, 102, 241, 0.2)' }}>
              {call.repName.charAt(0)}
            </Avatar>
          </Badge>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {call.repName}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              vs {call.customerName}
            </Typography>
          </div>
        </div>

        {/* Battle Score */}
        <Paper sx={{
          p: 2,
          mb: 3,
          background: 'rgba(236, 72, 153, 0.1)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
        }}>
          <Typography variant="h6" sx={{ color: '#EC4899', mb: 1 }}>
            Battle Score
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, textAlign: 'center' }}>
            {score}
          </Typography>
        </Paper>

        {/* Metrics */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <MetricDisplay
              label="Confidence"
              value={call.confidence}
              unit="%"
              color={statusColor}
            />
          </Grid>
          <Grid item xs={6}>
            <MetricDisplay
              label="Talk Ratio"
              value={call.voiceMetrics.talkRatio}
              unit="%"
              color="#6366F1"
            />
          </Grid>
          <Grid item xs={6}>
            <MetricDisplay
              label="Harvey Score"
              value={call.harveyScore || 0}
              unit=""
              color="#EC4899"
            />
          </Grid>
          <Grid item xs={6}>
            <MetricDisplay
              label="Duration"
              value={Math.floor(call.duration / 60)}
              unit="min"
              color="#10B981"
            />
          </Grid>
        </Grid>

        {/* Voice Metrics */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Chip
            icon={<Speed />}
            label={call.voiceMetrics.pace}
            size="small"
            sx={{ background: 'rgba(255, 255, 255, 0.1)' }}
          />
          <Chip
            icon={<Psychology />}
            label={call.voiceMetrics.tone}
            size="small"
            sx={{ background: 'rgba(255, 255, 255, 0.1)' }}
          />
          {call.callMetrics && (
            <>
              <Chip
                label={`${call.callMetrics.objectionCount} objections`}
                size="small"
                sx={{ background: 'rgba(239, 68, 68, 0.2)' }}
              />
              <Chip
                label={`${call.callMetrics.closingAttempts} close attempts`}
                size="small"
                sx={{ background: 'rgba(16, 185, 129, 0.2)' }}
              />
            </>
          )}
        </div>

        {/* Harvey's Advice */}
        {call.harveyAdvice && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(236, 72, 153, 0.1)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: '8px',
          }}>
            <Typography variant="caption" sx={{ color: '#EC4899', fontWeight: 700 }}>
              HARVEY'S ADVICE
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
              "{call.harveyAdvice}"
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Metric Display Component
const MetricDisplay: React.FC<{
  label: string;
  value: number;
  unit: string;
  color: string;
}> = ({ label, value, unit, color }) => (
  <div style={{ textAlign: 'center' }}>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {label}
    </Typography>
    <Typography variant="h4" sx={{ color, fontWeight: 700 }}>
      {value}{unit}
    </Typography>
  </div>
);

// Helper function
const formatDuration = (startTime?: Date): string => {
  if (!startTime) return '0:00';
  const seconds = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};