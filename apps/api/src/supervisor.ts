import { randomUUID } from 'crypto';

const SUPERVISOR_URL = (process.env.SUPERVISOR_URL || 'https://supervisor.oussamma.tn').replace(/\/$/, '');
const SUPERVISOR_API_KEY = process.env.SUPERVISOR_API_KEY || 'es_messenger_sec_4410a88cc11f9920d991b101dd88c';
const APP_ID = 'messenger';

export function trackMessengerEvent({
  eventType,
  actorSub,
  actorEmail,
  resourceId,
  outcome = 'success',
  metadata = {},
}: {
  eventType: string;
  actorSub?: string;
  actorEmail?: string;
  resourceId?: string;
  outcome?: 'success' | 'failure';
  metadata?: Record<string, any>;
}) {
  if (!SUPERVISOR_API_KEY) return;

  // STRICT COMPLIANCE: NEVER TRANSMIT RAW MESSAGE CONTENT OR PRIVATE CALL AUDIO
  const payload = {
    event_id: randomUUID(),
    event_type: eventType,
    event_version: 1,
    application: APP_ID,
    actor: {
      issuer: process.env.SSO_ISSUER || 'https://sso-a.oussamma.tn',
      sub: actorSub || 'unknown',
      email: actorEmail,
    },
    occurred_at: new Date().toISOString(),
    resource: resourceId
      ? {
          type: eventType.startsWith('call.') ? 'call_room' : 'conversation',
          id: String(resourceId),
        }
      : undefined,
    outcome,
    metadata,
  };

  fetch(`${SUPERVISOR_URL}/api/v1/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Supervisor-Key': SUPERVISOR_API_KEY,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Non-blocking telemetry
  });
}
