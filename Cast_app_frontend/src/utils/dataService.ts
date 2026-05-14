import back4appClient from './back4appClient';
import { Candidate } from '../pages/SeekConfirm';
import { useState } from 'react';

const USE_BACK4APP = (import.meta as any).env?.VITE_USE_PARSE === 'true';

const DEVICE_ID_KEY = 'surtr_device_id';

const KNOWN_NAMES: Record<number, string> = {
  0: "James Bond", 1: "Tony Stark", 2: "Jack Sparrow", 3: "Ellen Ripley", 4: "Mr. Bean", 5: "Homer Simpson", 6: "Charlie Chaplin", 7: "Peter Sellers",
  8: "Raymond Reddington", 9: "Daenerys Targaryen", 10: "Rachel Green", 11: "Walter White",
};

export const fetchCandidateList = async (): Promise<{id: number, name: string}[]> => {
  const url = (import.meta as any).env.VITE_API_URL;
  const response = await fetch(`${url}/candidates`);
  if (!response.ok) throw new Error('Failed to fetch candidates');
  const data = await response.json();
  return (data as any[])
    .sort((a, b) => a.id - b.id)
    .map(c => ({ id: c.id, name: KNOWN_NAMES[c.id] ?? `Candidate ${c.id}` }));
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


export const authenticateVoter = async (voterID: string) => {
  /* 
  authenticateVoter: function that authenticates if the voter exists, and if the
  voter has cast a ballot.
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required for vote-app authentication');
  }

  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    
    if (!voter) {
      throw new Error('Voter not found. Please register first.');
    }

    if (voter.hasVoted) {
      throw new Error('You have already voted in this election.');
    }

    return {
      objectId: voter.objectId,
      name: voter.name,
      voterID: voter.voterID,
      hasVoted: voter.hasVoted
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};


export const getVoterData = async (voterID: string) => {
  /* 
  getVoterData: Function that retrieves all data about a specific voter
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    return await back4appClient.findVoterByVoterID(voterID);
  } catch (error) {
    console.error('Error fetching voter data:', error);
    throw error;
  }
};

/* NOTE: not being used */
export const getCandidates = async () => {
  /*
  getCandidates: Function that fecthes the full list of candidates
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    return await back4appClient.getAllCandidates();
  } catch (error) {
    console.error('Error fetching candidates:', error);
    throw error;
  }
};


export const getVoterIdentifiers = async (voterID: string) => {
  /*
  getVoterIdentifiers: Function that retrieves the identifier associated
  to the voter
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    return await back4appClient.getIdentifiersByVoterID(voterID);
  } catch (error) {
    console.error('Error fetching identifiers:', error);
    throw error;
  }
};


export const validateVoterCredentials = async (name: string, voterID: string, password: string) => {
  /*
  validateVoterCredentials: Function that maches checks the name, voterID and password,
  against the database
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    const voter = await back4appClient.loginVoter(voterID, password);
    if (!voter) return null;
    // Verify name matches after successful login
    if (voter.name !== name.trim()) return null;
    return voter;
  } catch (error) {
    console.error('Error validating voter credentials:', error);
    throw error;
  }
};


export const checkVotingStatus = async (voterID: string) => {
  /*
  checkVotingStatus: Function that checks if the voter has already voted
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    return voter ? voter.hasVoted : false;
  } catch (error) {
    console.error('Error checking voting status:', error);
    throw error;
  }
};

export const castVoterVote = async (voterID: string, candidate: Candidate, qrdata: string) => {
  /*
  castVoterVote: Function that casts the voters vote, this is done by setting,
  hasVoted to true and store their chosen candidate.
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }
  await serverLog(`Voter: ${voterID} has voted for ${candidate.name}`);


  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    if (!voter) {
      throw new Error('Voter not found');
    }
    await sendVote(voterID, candidate, qrdata);
    
    
    await back4appClient.updateVoter(voter.objectId, { 
      hasVoted: true, 
      chosen_candidate: candidate.name 
    });
    return true;
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
};

async function serverLog(message: string) {
  const url = (import.meta as any).env?.VITE_API_URL;
  await fetch(`${url}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  }).catch(() => {}); // silently fail if API unreachable
}

async function sendVote(voterID: string, candidate: Candidate, qrdata: string) {
  const url = (import.meta as any).env.VITE_API_URL;
  const response = await fetch(`${url}/castvote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ voter_id: voterID, vote_value: candidate.id, qr_data: qrdata }),
  });

  if (!response.ok) {
    throw new Error('Failed to send vote');
  }
   const data = await response.json();
};


export const updateVoterQRStatus = async (voterID: string) => {
  /*
  updateVoterQRStatus: Functions that sets scannedQRcode to true
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    if (!voter) {
      throw new Error('Voter not found');
    }
    
    await back4appClient.updateVoter(voter.objectId, { scannedQR: true });
    return true;
  } catch (error) {
    console.error('Error updating voter QR status:', error);
    throw error;
  }
};


export const saveBallotOrder = async (
  voterID: string,
  ballotList: string[]
): Promise<boolean> => {
  /*
  saveBallotOrder: Function that randomized the ordering fo the candidates you
  can vote for.
  */
 
  if (!voterID || !Array.isArray(ballotList)) {
    console.error("Invalid parameters passed to saveBallotOrder");
    return false;
  }

  if (!USE_BACK4APP) {
    console.warn("Database disabled — ballot order not saved");
    return false;
  }

  try {
    const existingBallot = await back4appClient.getBallotByVoterID(voterID);

    if (existingBallot) {
      console.info(`Ballot already exists for voter: ${voterID}`);
      return true;
    }

    await back4appClient.createBallotRecord({
      voterID,
      ballotList,
    });

    console.info(`Ballot order saved successfully for voter: ${voterID}`);
    return true;

  } catch (error: any) {
    if (error.code === 137) {
      console.info(`Duplicate ballot caught for ${voterID} — treating as success`);
      return true;
    }

    console.error(`Error saving ballot order for ${voterID}:`, error);
    return false;
  }
};

export const getBallotOrder = async (voterID: string) => {
  /*
  getBallotOrder: Function that retrieves ballot order
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    return await back4appClient.getBallotByVoterID(voterID);
  } catch (error) {
    console.error('Error fetching ballot order:', error);
    throw error;
  }
};


export const getBallotOrderNew = async (voterID: string) => {
  const url = (import.meta as any).env.VITE_API_URL;

  const response = await fetch(`${url}/get_personalized_ballot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ voter_id: voterID }),
  });

  if (!response.ok) {
    throw new Error('Failed to get ballot order');
  }
  const data = await response.json();

  var candidates = [] as string[]

  const candidateList = await fetchCandidateList();
  for (let i = 0; i < data.length; i++) {
    const c_name = candidateList.find(c => c.id === data[i])?.name ?? `Candidate ${data[i]}`;
    candidates.push(c_name);
  }

  return { ballotList: candidates };

};


export const updateVoterConfirmationStatus = async (voterID: string) => {
  /*
  updateVoterConfirmationStatus: Function that sets hasConfirmed to true
  */
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    if (!voter) {
      throw new Error('Voter not found');
    }
    
    await back4appClient.updateVoter(voter.objectId, { hasConfirmed: true });
    return true;
  } catch (error) {
    console.error('Error updating voter confirmation status:', error);
    throw error;
  }
};

//Note: This Does Nothing
export const updateVoterVotingStatus = async (voterID: string) => {

  throw new Error('Voter status update method will be implemented with new database class');
};


export const hasVoterAlreadyVoted = async (voterID: string): Promise<boolean> => {
  /*
  hasVoterAlreadyVoted: Function that check if the voter has already cast their vote
  */
  if (!USE_BACK4APP) {
    return false;
  }

  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    return voter?.hasVoted === true;
  } catch (error) {
    console.error('Error checking if voter has already voted:', error);
    return false;
  }
};


export const hasVoterConfirmed = async (voterID: string): Promise<boolean> => {
  /*
  hasVoterConfirmed: Function that checks if the voter has confirmed their vote.
  */
  if (!USE_BACK4APP) {
    return false;
  }

  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    return voter?.hasConfirmed === true;
  } catch (error) {
    console.error('Error checking if voter has confirmed:', error);
    return false;
  }
};