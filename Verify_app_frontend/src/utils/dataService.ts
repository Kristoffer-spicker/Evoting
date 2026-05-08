import { Voter } from '../types/voter';
import back4appClient from './back4appClient';
import { ec as EC } from 'elliptic';

const DEVICE_ID_KEY = 'surtr_device_id';
const USE_BACK4APP = (import.meta as any).env?.VITE_USE_PARSE === 'true';
const ec = new EC('p256');

type CurvePoint = {
  x: string;
  y: string;
  curve_name: string;
};

const MASTER_IDENTIFIERS = Object.freeze([
  { emoji: "✈️", text: "Airplane" },
  { emoji: "🎒", text: "Backpack" },
  { emoji: "👑", text: "Crown" },
  { emoji: "🕯️", text: "Candle" },
  { emoji: "📦", text: "Package" },
  { emoji: "🪑", text: "Chair" },
  { emoji: "⭐", text: "Star" },
  { emoji: "🧢", text: "Cap" },
  { emoji: "🪜", text: "Ladder" },
  { emoji: "🦀", text: "Crab" },
  { emoji: "🧺", text: "Basket" },
  { emoji: "🐼", text: "Panda" },
  { emoji: "🦈", text: "Shark" },
  { emoji: "🚌", text: "Bus" },
  { emoji: "🚲", text: "Bicycle" },
  { emoji: "🎸", text: "Guitar" },
  { emoji: "🌙", text: "Moon" },
  { emoji: "🌻", text: "Sunflower" }
]);

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const generateDeviceFingerprint = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `device_${Math.abs(hash).toString(36)}`;
};

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceFingerprint();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};


export const loadVoters = async (): Promise<Voter[]> => {
  /*
  loadVoters: Function that determines how to call the database, so
  the voters can be laoded
  */
  if (USE_BACK4APP) {
    return await loadVotersFromBack4app();
  } else {
    return await loadVotersFromLocal();
  }
};

const loadVotersFromBack4app = async (): Promise<Voter[]> => {
  /*
  loadVotersFromBack4app: Function that loads the voters from
  an Back4App database
  */
  try {
    const result = await back4appClient.getAllUsers();
    return result.results.map((voter: any) => ({
      id: voter.objectId || '',
      name: voter.name || '',
      voterId: voter.voterID || '',
      deviceId: getDeviceId(),
      registeredAt: voter.createdAt || new Date().toISOString(),
      hasVoted: voter.hasVoted || false,
    }));
  } catch (error) {
    console.error('Error loading voters from Back4app:', error);
    return [];
  }
};

const loadVotersFromLocal = async (): Promise<Voter[]> => {
  /*
  loadVotersFromLocal: Funktion that loads the voters from a
  local storage
  */
  try {
    const storedVoters = localStorage.getItem('verify_app_voters');
    return storedVoters ? JSON.parse(storedVoters) : [];
  } catch (error) {
    console.error('Error loading voters from local storage:', error);
    return [];
  }
};

export const saveVoter = async (name: string, voterId: string, password: string): Promise<Voter> => {
  /*
  saveVoter: function that determines where we save the voter.
  */
  if (USE_BACK4APP) {
    return await saveVoterToBack4app(name, voterId, password);
  } else {
    return await saveVoterToLocal(name, voterId, password);
  }
};

async function serverLog(message: string) {
  const url = (import.meta as any).env?.VITE_API_URL;
  try {
    const response = await fetch(`${url}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) {
      console.error("Server log failed with status:", response.status);
    }
  } catch (error) {
    console.error("Could not reach API for logging:", error);
  }
}

const saveVoterToBack4app = async (name: string, voterId: string, password: string): Promise<Voter> => {
  /*
  saveVoterToBack4app: Function that saves the voter to the back4app database when
  they have registered.
  */
  try {
    localStorage.removeItem('surtr_session_token');
    // No pre-check query — _User requires auth to read. Rely on Back4App's
    // unique username constraint and catch the duplicate error below.
    serverLog("Voter registered");

    const voterData = {
      name: name.trim(),
      voterID: voterId.trim(),
      password: password.trim(),
      hasVoted: false,
      hasSeenTrueIdentifier: false
    };

    const savedVoter = await back4appClient.createVoter({ 
      ...voterData
    } as any);

    
    if (savedVoter.sessionToken) {
    localStorage.setItem('surtr_session_token', savedVoter.sessionToken);
    }

    const newVoter: Voter = {
      id: savedVoter.objectId ?? '',
      name: name.trim(),
      voterId: voterId.trim(),
      deviceId: getDeviceId(),
      registeredAt: savedVoter.createdAt ?? new Date().toISOString(),
      hasVoted: false,
    };

    return newVoter;
  } catch (error) {
    console.error('Error saving voter to Back4app:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('already exists') || errorMessage.includes('Account already exists')) {
      throw new Error('A voter with this ID is already registered');
    }
    throw new Error(`Failed to save voter data: ${errorMessage}`);
  }
};

export const getFinalResult = async() => {
  const url = (import.meta as any).env?.VITE_API_URL;
  const response = await fetch(`${url}/get_result`, {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (data[0] === undefined) {
    return [];
  }
  return data.map((item: any) => ({
    candidateName: CANDIDATES.find(c => c.id === Number(item[0]))?.name ?? `Candidate ${item[0]}`,
    vote_count: item[1],
  }));
}

const saveVoterToLocal = async (name: string, voterId: string, password: string): Promise<Voter> => {
  /*
  saveVoterToLocal: Function that saves the voter to locla storage when
  they have registered.
  */
  const voters = await loadVoters();
  const existingVoter = voters.find(v => v.voterId === voterId);
  if (existingVoter) {
    throw new Error('A voter with this ID is already registered');
  }
  const newVoter: Voter = {
    id: generateUniqueId(),
    name: name.trim(),
    voterId: voterId.trim(),
    deviceId: getDeviceId(),
    registeredAt: new Date().toISOString(),
    hasVoted: false,
  };
  try {
    const existingVoters = await loadVoters();
    const updatedVoters = [...existingVoters, newVoter];
    localStorage.setItem('verify_app_voters', JSON.stringify(updatedVoters));
    await new Promise(resolve => setTimeout(resolve, 100));
    return newVoter;
  } catch (error) {
    throw new Error('Failed to save voter data');
  }
};

export const findVoter = async (voterId: string, name: string, password: string): Promise<Voter | null> => {
  /*
  findVoter: function that determines where we have to find the voter.
  */
  if (USE_BACK4APP) {
    return await findVoterInBack4app(voterId, name, password);
  } else {
    return await findVoterInLocal(voterId, name, password);
  }
};

const findVoterInBack4app = async (voterId: string, name: string, password: string): Promise<Voter | null> => {
  /*
  findVoterInBack4app: Function that finds a voter based on a id, name and password
  in the back4app database
  */
  try {
    const voter = await back4appClient.loginVoter(voterId.trim(), password.trim());
    if (!voter) return null;
    if (voter.name !== name.trim()) return null;
        if (voter.sessionToken) {
      localStorage.setItem('surtr_session_token', voter.sessionToken);
    }
    return {
      id: voter.objectId || '',
      name: voter.name || '',
      voterId: voter.voterID || '',
      deviceId: getDeviceId(),
      registeredAt: voter.createdAt || new Date().toISOString(),
      hasVoted: voter.hasVoted || false,
    };
  } catch (error) {
    console.error('Error finding voter:', error);
    return null;
  }
};

export const getCurrentAuthenticatedVoter = (): Voter | null => {
  try {
    const voterData = localStorage.getItem('surtr_authenticated_voter');
    return voterData ? JSON.parse(voterData) : null;
  } catch (error) {
    return null;
  }
};

export const checkVoterHasVoted = async (voterId: string): Promise<boolean> => {
  /*
  checkVoterHasVoted: Function that checks by a vote id if a voter has cast their vote
  */
  try {
    if (USE_BACK4APP) {
      const voter = await back4appClient.findVoterByVoterID(voterId);
      return voter?.hasVoted || false;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const findVoterInLocal = async (voterId: string, name: string, password: string): Promise<Voter | null> => {
  /*
  findVoterInLocal: Function that finds a voter based on a id, name and password
  in local storage
  */
  const voters = await loadVoters();
  return voters.find(
    v => v.voterId.toLowerCase() === voterId.trim().toLowerCase() &&
         v.name.toLowerCase() === name.trim().toLowerCase() &&
         (v as any).password === password.trim()
  ) || null;
};

export const voterExists = async (voterId: string): Promise<boolean> => {
  /*
  voterExists: Function that checks if a specific voterID exists in the database
  */
  if (USE_BACK4APP) {
    try {
      const voter = await back4appClient.findVoterByVoterID(voterId);
      return voter !== null;
    } catch (error) {
      return false;
    }
  }
  const voters = await loadVoters();
  return voters.some(v => v.voterId === voterId);
};

const CANDIDATES = Object.freeze([
  { id: 0, name: "James Bond" },
  { id: 1, name: "Tony Stark" },
  { id: 2, name: "Jack Sparrow" },
  { id: 3, name: "Ellen Ripley" },
]);

export const getVoterIdentifiers = async (voterId: string): Promise<Array<{id: string, emoji: string, word: string}>> => {
  /*
  getVoterIdentifiers: function that gets all the identifiers so the voter can see them
  */
  const url = (import.meta as any).env.VITE_API_URL;
  const response = await fetch(`${url}/get_identifiers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ voter_id: voterId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate identifiers: ${response.status}`);
  }

  const identifiers_and_ids = await response.json();

  // API returns [triplet_id, identifier_text, candidate_id]
  const formatted = identifiers_and_ids.map((item: any) => ({
    id: item[0].toString(),
    emoji: MASTER_IDENTIFIERS.find(ident => ident.text === item[1])?.emoji,
    word: item[1].toString()
  }))

  return formatted;
};

export const getVoterTriplets = async (voterId: string): Promise<Array<{tripletId: number, candidateName: string, emoji: string}>> => {
  const url = (import.meta as any).env.VITE_API_URL;
  const response = await fetch(`${url}/get_identifiers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ voter_id: voterId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch triplets: ${response.status}`);
  }

  const data = await response.json();

  // API returns [triplet_id, identifier_text, candidate_id]
  return data.map((item: any, index: number) => ({
    tripletId: index + 1,
    candidateName: CANDIDATES.find(c => c.id === item[2])?.name ?? `Candidate ${item[2]}`,
    emoji: MASTER_IDENTIFIERS.find(i => i.text === item[1])?.emoji ?? '❓',
  }));
};

export const generateQRCode = async (voterId: string): Promise<string> => {
  const url = (import.meta as any).env.VITE_API_URL;
  const response = await fetch(`${url}/qrcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voter_id: voterId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to generate QR: ${response.status}`);
  }
  const data = await response.json();
  return data.qr_code as string;
};

export const getVoterTrueIdentifier = async (voterId: string): Promise<{emoji: string, text: string} | null> => {
  const url = (import.meta as any).env.VITE_API_URL;
  const response = await fetch(`${url}/voter_true_identifier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voter_id: voterId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch true identifier: ${response.status}`);
  }
  const identifier: string | null = await response.json();
  if (!identifier) return null;
  return MASTER_IDENTIFIERS.find(item => item.text === identifier) ?? null;
};

export const markTrueIdentifierSeen = async (voterId: string): Promise<boolean> => {
  if (USE_BACK4APP) {
    try {
      const voter = await back4appClient.findVoterByVoterID(voterId);
      if (!voter) return false;
      await back4appClient.updateVoter(voter.objectId, { hasSeenTrueIdentifier: true });
      const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter');
      if (authenticatedVoter) {
        const voterData = JSON.parse(authenticatedVoter);
        voterData.hasSeenTrueIdentifier = true;
        localStorage.setItem('surtr_authenticated_voter', JSON.stringify(voterData));
      }
      return true;
    } catch (error) {
      console.error('markTrueIdentifierSeen failed:', error);
      return false;
    }
  }
  localStorage.setItem(`surtr_seen_true_identifier_${voterId}`, 'true');
  return true;
};

export const hasVoterSeenTrueIdentifier = async (voterId: string): Promise<boolean> => {
  /*
  hasVoterSeenTrueIdentifier: Funciton that checks if the user has seen their
  true identifier
  */
  if (USE_BACK4APP) {
    try {
      const voter = await back4appClient.findVoterByVoterID(voterId);
      return voter?.hasSeenTrueIdentifier === true;
    } catch (error) {
      return false;
    }
  }
  return localStorage.getItem(`surtr_seen_true_identifier_${voterId}`) === 'true';
};

export const areElectionResultsPublished = async (): Promise<boolean> => {
  /*
  areElectionResultsPublished: Function that checks if the election resutls are
  publsihed
  */
  if (USE_BACK4APP) {
    try {
      return await back4appClient.getElectionResultsStatus();
    } catch (error) {
      return false;
    }
  }
  return localStorage.getItem('surtr_results_published') === 'true';
};

export const buildVerificationTable = async (voterId: string): Promise<{
  success: boolean;
  tableData?: Array<{id: string, candidate: string, emoji: string, word: string}>;
  error?: string;
}> => {
  /*
  buildVerificationTable: Funciton that build the bulltin Board, where 
  the true identifier is shown behind the candidate they voted for.
  */
  if (USE_BACK4APP) {
    try {
      const resultsPublished = await areElectionResultsPublished();
      if (!resultsPublished) {
        return { success: false, error: 'Results have not been published yet' };
      }
      const verificationData = await back4appClient.getVerificationMappingData(voterId);
      const { chosenCandidate, trueIdentifier, identifierList, ballotList } = verificationData;
      if (!chosenCandidate || !trueIdentifier || !identifierList || !ballotList) {
        return { success: false, error: 'Missing required verification data' };
      }
      const remaining = identifierList.filter((id: any) =>
        !(id.emoji === trueIdentifier.emoji && id.text === trueIdentifier.text)
      );
      const mapping: {[key: string]: {emoji: string, text: string}} = {};
      mapping[ballotList[0]] = trueIdentifier;
      for (let i = 1; i < ballotList.length; i++) {
        if (remaining[i - 1]) mapping[ballotList[i]] = remaining[i - 1];
      }
      const tableData = ballotList.map((candidate: string, index: number) => ({
        id: (index + 1).toString(),
        candidate,
        emoji: mapping[candidate]?.emoji || '🎲',
        word: mapping[candidate]?.text || 'Unknown'
      }));
      return { success: true, tableData: shuffleArray(tableData) };
    } catch (error) {
      return { success: false, error: 'Failed to build verification table' };
    }
  }
  return { success: true, tableData: [{ id: "1", candidate: "Mock Candidate", emoji: "⭐", word: "Star" }] };
};

export const getVoterProgressState = async (voterID: string): Promise<number> => {
  if (!USE_BACK4APP) return 1;
  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    if (!voter) return 1;
    const resultsPublished = await back4appClient.getElectionResultsStatus();
    if (voter.hasConfirmed && resultsPublished) return 5;
    if (voter.hasConfirmed && !resultsPublished) return 4;
    if (voter.hasVoted && !voter.hasConfirmed) return 3;
    if (voter.scannedQR && !voter.hasVoted) return 2;
    return 1;
  } catch (error) {
    return 1;
  }
};