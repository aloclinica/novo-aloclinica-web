import { DAILY_API_KEY, DAILY_ROOM_PREFIX, DAILY_ROOM_EXPIRY_HOURS } from '@/lib/utils/constants';

const DAILY_API_URL = 'https://api.daily.co/v1';

// ============================================================
// DAILY.CO VIDEO SERVICE
// ============================================================

interface CreateRoomParams {
  consultation_id: string;
  properties?: {
    max_participants?: number;
    exp?: number;
  };
}

export const createRoom = async (params: CreateRoomParams) => {
  if (!DAILY_API_KEY) {
    console.error('[Daily.co] API key not configured');
    return null;
  }

  const room_name = `${DAILY_ROOM_PREFIX}-${params.consultation_id}`;

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: room_name,
        properties: {
          max_participants: 2,
          exp: Math.floor(Date.now() / 1000) + DAILY_ROOM_EXPIRY_HOURS * 3600,
          ...params.properties,
        },
      }),
    });

    if (!response.ok) {
      console.error('[Daily.co] Error:', await response.text());
      return null;
    }

    const data = await response.json();

    return {
      name: data.name,
      url: data.url,
      api_created: data.api_created,
    };
  } catch (error) {
    console.error('[Daily.co] Exception:', error);
    return null;
  }
};

export const deleteRoom = async (room_name: string) => {
  if (!DAILY_API_KEY) {
    console.error('[Daily.co] API key not configured');
    return false;
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${room_name}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[Daily.co] Exception:', error);
    return false;
  }
};

interface CreateMeetingTokenParams {
  room_name: string;
  user_id: string;
  user_name: string;
  is_owner?: boolean;
}

export const createMeetingToken = async (params: CreateMeetingTokenParams) => {
  if (!DAILY_API_KEY) {
    console.error('[Daily.co] API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: params.room_name,
          user_id: params.user_id,
          user_name: params.user_name,
          is_owner: params.is_owner ?? false,
          permissions: ['allow_knocking', 'allow_recording'],
        },
      }),
    });

    if (!response.ok) {
      console.error('[Daily.co] Error:', await response.text());
      return null;
    }

    const data = await response.json();

    return {
      token: data.token,
      exp: data.exp,
    };
  } catch (error) {
    console.error('[Daily.co] Exception:', error);
    return null;
  }
};

export const getRoomInfo = async (room_name: string) => {
  if (!DAILY_API_KEY) {
    console.error('[Daily.co] API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${room_name}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('[Daily.co] Error:', await response.text());
      return null;
    }

    const data = await response.json();

    return {
      name: data.name,
      url: data.url,
      created_at: data.created_at,
      max_participants: data.properties?.max_participants,
    };
  } catch (error) {
    console.error('[Daily.co] Exception:', error);
    return null;
  }
};
