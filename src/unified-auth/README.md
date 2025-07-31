# @repspheres/unified-auth

Unified authentication package for the RepSpheres ecosystem with progressive feature unlocking.

## Installation

```bash
npm install @repspheres/unified-auth
```

## Features

- 🔐 Unified authentication across all RepSpheres apps
- 📊 Progressive feature unlocking (Rep⁰ to Rep⁵)
- 🎯 Feature gating components
- 📱 Automatic Twilio provisioning for Rep³+
- 📧 Gmail integration for Rep⁴+
- 🏷️ White label support for Rep⁵

## Usage

### Check User Tier

```tsx
import { useRepXTier } from '@repspheres/unified-auth';

function MyComponent() {
  const { tier, subscription, loading } = useRepXTier(userId);

  if (loading) return <div>Loading...</div>;

  return <div>Your tier: {tier}</div>;
}
```

### Feature Gating

```tsx
import { FeatureGate } from '@repspheres/unified-auth';

function PhoneFeature() {
  return (
    <FeatureGate feature="phoneAccess" fallback={<UpgradePrompt />}>
      <PhoneDialer />
    </FeatureGate>
  );
}
```

### Check Feature Access

```tsx
import { useFeatureAccess } from '@repspheres/unified-auth';

function EmailComposer() {
  const { features, checkFeature } = useFeatureAccess();

  const handleSend = () => {
    const result = checkFeature('emailAccess');
    if (!result.allowed) {
      alert(result.reason);
      window.location.href = result.upgradeUrl;
      return;
    }
    // Send email...
  };
}
```

### Agent Time Limits

```tsx
import { useAgentTimeLimit } from '@repspheres/unified-auth';

function AgentChat() {
  const { timeLimit, displayTime, isUnlimited } = useAgentTimeLimit();

  return (
    <div>
      Chat time: {displayTime}
      {!isUnlimited && <Timer seconds={timeLimit} />}
    </div>
  );
}
```

## Tier Structure

| Tier | Price   | Features                                             |
| ---- | ------- | ---------------------------------------------------- |
| Rep⁰ | Free    | Basic login, 30s agent chat                          |
| Rep¹ | $97/mo  | Email (100/mo), 1min agent chat                      |
| Rep² | $197/mo | Phone access, SMS, 5min agent chat                   |
| Rep³ | $297/mo | Auto Twilio provisioning, 15min agent chat           |
| Rep⁴ | $497/mo | Gmail integration, unlimited email, 30min agent chat |
| Rep⁵ | $997/mo | White label, unlimited everything                    |

## Configuration

Set your backend URL:

```typescript
// In your app initialization
process.env.REACT_APP_BACKEND_URL = 'https://osbackend-zl1h.onrender.com';
```

## License

MIT © RepSpheres
