import back4appClient from './back4appClient';

const USE_BACK4APP = (import.meta as any).env?.VITE_USE_PARSE === 'true';

const DEVICE_ID_KEY = 'surtr_device_id';

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


export const getCandidates = async () => {
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
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    const result = await back4appClient.query('Voters', { name, voterID, password });
    return result.results.length > 0 ? result.results[0] : null;
  } catch (error) {
    console.error('Error validating voter credentials:', error);
    throw error;
  }
};


export const checkVotingStatus = async (voterID: string) => {
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


export const castVoterVote = async (voterID: string, candidateName: string) => {
  if (!USE_BACK4APP) {
    throw new Error('Database connection required');
  }

  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    if (!voter) {
      throw new Error('Voter not found');
    }
    
    await back4appClient.updateVoter(voter.objectId, { 
      hasVoted: true, 
      chosen_candidate: candidateName 
    });
    return true;
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
};


export const updateVoterQRStatus = async (voterID: string) => {
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


export const updateVoterConfirmationStatus = async (voterID: string) => {
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


export const updateVoterVotingStatus = async (voterID: string) => {

  throw new Error('Voter status update method will be implemented with new database class');
};


export const hasVoterAlreadyVoted = async (voterID: string): Promise<boolean> => {
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