import { Voter } from '../types/voter';
import back4appClient from './back4appClient';


const DEVICE_ID_KEY = 'surtr_device_id';


const USE_BACK4APP = (import.meta as any).env?.VITE_USE_PARSE === 'true';



// Master identifiers list for voting system
const MASTER_IDENTIFIERS = [
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
];


export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Fisher-Yates shuffle algorithm
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
  if (USE_BACK4APP) {
    return await loadVotersFromBack4app();
  } else {
    return await loadVotersFromLocal();
  }
};


const loadVotersFromBack4app = async (): Promise<Voter[]> => {
  try {
    const result = await back4appClient.query('Voters');
    
    return result.results.map((voter: any) => ({
      id: voter.objectId || '',
      name: voter.name || '',
      voterId: voter.voterID || '',
      deviceId: getDeviceId(),
      registeredAt: voter.createdAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error loading voters from Back4app:', error);
    return [];
  }
};


const loadVotersFromLocal = async (): Promise<Voter[]> => {
  try {
    const storedVoters = localStorage.getItem('verify_app_voters');
    return storedVoters ? JSON.parse(storedVoters) : [];
  } catch (error) {
    console.error('Error loading voters from local storage:', error);
    return [];
  }
};


export const saveVoter = async (name: string, voterId: string, password: string): Promise<Voter> => {
 
  
  if (USE_BACK4APP) {
    return await saveVoterToBack4app(name, voterId, password);
  } else {
    return await saveVoterToLocal(name, voterId, password);
  }
};


const saveVoterToBack4app = async (name: string, voterId: string, password: string): Promise<Voter> => {
  try {
    
    
    const existingVoter = await back4appClient.findVoterByVoterID(voterId.trim());
    if (existingVoter) {
      throw new Error('A voter with this ID is already registered');
    }

    
    const shuffled = [...MASTER_IDENTIFIERS].sort(() => 0.5 - Math.random());
    const selected12Identifiers = shuffled.slice(0, 12);

    
    const trueIdentifier = selected12Identifiers[Math.floor(Math.random() * selected12Identifiers.length)];

  
    const remainingIdentifiers = selected12Identifiers.filter(
      id => !(id.emoji === trueIdentifier.emoji && id.text === trueIdentifier.text)
    );
    const orderedIdentifiersList = [trueIdentifier, ...remainingIdentifiers];


    const voterData = {
      name: name.trim(),
      voterID: voterId.trim(),
      password: password.trim(),
      hasVoted: false,
      hasSeenTrueIdentifier: false, 
      true_identifier: trueIdentifier 
    };

    console.log('Saving voter to Back4app...');
    const savedVoter = await back4appClient.createVoter(voterData);


  
    console.log('Saving identifiers list to Back4app...');
    await back4appClient.createIdentifiersList({
      voterID: voterId.trim(),
      list: orderedIdentifiersList
    });
   
    const newVoter: Voter = {
      id: savedVoter.objectId,
      name: name.trim(),
      voterId: voterId.trim(),
      deviceId: getDeviceId(),
      registeredAt: savedVoter.createdAt,
      hasVoted: false,
    };

    console.log('Voter saved successfully to Back4app:', newVoter);
    return newVoter;
  } catch (error) {
    console.error('Error saving voter to Back4app:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to save voter data: ${errorMessage}`);
  }
};


const saveVoterToLocal = async (name: string, voterId: string, password: string): Promise<Voter> => {
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
    // Load existing voters from localStorage
    const existingVoters = await loadVoters();
    
   
    const updatedVoters = [...existingVoters, newVoter];
    
   
    localStorage.setItem('verify_app_voters', JSON.stringify(updatedVoters));
    
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Voter saved successfully (local mode):', newVoter);
    return newVoter;
  } catch (error) {
    console.error('Error saving voter:', error);
    throw new Error('Failed to save voter data');
  }
};


export const findVoter = async (voterId: string, name: string, password: string): Promise<Voter | null> => {
  if (USE_BACK4APP) {
    return await findVoterInBack4app(voterId, name, password);
  } else {
    return await findVoterInLocal(voterId, name, password);
  }
};


const findVoterInBack4app = async (voterId: string, name: string, password: string): Promise<Voter | null> => {
  try {
    
    const result = await back4appClient.query('Voters', {
      voterID: voterId.trim(),
      name: name.trim(),
      password: password.trim()
    });
    
    if (result.results.length > 0) {
      const voter = result.results[0];
      return {
        id: voter.objectId || '',
        name: voter.name || '',
        voterId: voter.voterID || '',
        deviceId: getDeviceId(),
        registeredAt: voter.createdAt || new Date().toISOString(),
        hasVoted: voter.hasVoted || false,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding voter in Back4app:', error);
    return null;
  }
};


export const getCurrentAuthenticatedVoter = (): Voter | null => {
  try {
    const voterData = localStorage.getItem('surtr_authenticated_voter');
    if (voterData) {
      return JSON.parse(voterData);
    }
    return null;
  } catch (error) {
    console.error('Error getting authenticated voter:', error);
    return null;
  }
};


export const checkVoterHasVoted = async (voterId: string): Promise<boolean> => {
  try {
    if (USE_BACK4APP) {
      const voter = await back4appClient.findVoterByVoterID(voterId);
      return voter?.hasVoted || false;
    } else {
     
      return false;
    }
  } catch (error) {
    console.error('Error checking voter status:', error);
    return false;
  }
};


const findVoterInLocal = async (voterId: string, name: string, password: string): Promise<Voter | null> => {
  const voters = await loadVoters();
  
  const voter = voters.find(
    v => v.voterId.toLowerCase() === voterId.trim().toLowerCase() && 
         v.name.toLowerCase() === name.trim().toLowerCase() &&
         (v as any).password === password.trim()
  );
  
  return voter || null;
};


export const voterExists = async (voterId: string): Promise<boolean> => {
  if (USE_BACK4APP) {
    try {
      const voter = await back4appClient.findVoterByVoterID(voterId);
      return voter !== null;
    } catch (error) {
      console.error('Error checking voter existence:', error);
      return false;
    }
  } else {
    const voters = await loadVoters();
    return voters.some(v => v.voterId === voterId);
  }
};


export const getVoterIdentifiers = async (voterId: string): Promise<Array<{emoji: string, text: string}>> => {
  if (USE_BACK4APP) {
    try {
      const identifiersRecord = await back4appClient.getIdentifiersByVoterID(voterId);
      return identifiersRecord?.list || [];
    } catch (error) {
      console.error('Error loading voter identifiers:', error);
      return [];
    }
  } else {

    const shuffled = [...MASTER_IDENTIFIERS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 12);
  }
};


export const getVoterTrueIdentifier = async (voterId: string): Promise<{emoji: string, text: string} | null> => {
  if (USE_BACK4APP) {
    try {
      const trueIdentifier = await back4appClient.getTrueIdentifierByVoterID(voterId);
      return trueIdentifier || null;
    } catch (error) {
      console.error('Error loading voter true identifier:', error);
      return null;
    }
  } else {
    
    const identifiers = await getVoterIdentifiers(voterId);
    return identifiers.length > 0 ? identifiers[0] : null;
  }
};


export const markTrueIdentifierSeen = async (voterId: string): Promise<boolean> => {
  if (USE_BACK4APP) {
    try {
    
      const voter = await back4appClient.findVoterByVoterID(voterId);
      if (!voter) {
        console.error('Voter not found:', voterId);
        return false;
      }

     
      await back4appClient.updateVoter(voter.objectId, {
        hasSeenTrueIdentifier: true
      });

    
      const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter');
      if (authenticatedVoter) {
        const voterData = JSON.parse(authenticatedVoter);
        voterData.hasSeenTrueIdentifier = true;
        localStorage.setItem('surtr_authenticated_voter', JSON.stringify(voterData));
      }

  
      return true;
    } catch (error) {
      console.error('Error marking true identifier as seen:', error);
      return false;
    }
  } else {
    
    localStorage.setItem(`surtr_seen_true_identifier_${voterId}`, 'true');
    return true;
  }
};


export const hasVoterSeenTrueIdentifier = async (voterId: string): Promise<boolean> => {
  if (USE_BACK4APP) {
    try {
      const voter = await back4appClient.findVoterByVoterID(voterId);
      return voter?.hasSeenTrueIdentifier === true;
    } catch (error) {
      console.error('Error checking if voter has seen true identifier:', error);
      return false;
    }
  } else {
   
    const seen = localStorage.getItem(`surtr_seen_true_identifier_${voterId}`);
    return seen === 'true';
  }
};


export const areElectionResultsPublished = async (): Promise<boolean> => {
  if (USE_BACK4APP) {
    try {
      const resultsPublished = await back4appClient.getElectionResultsStatus();
      return resultsPublished;
    } catch (error) {
      console.error('Error checking election results status:', error);
      return false;
    }
  } else {
   
    return localStorage.getItem('surtr_results_published') === 'true';
  }
};


export const buildVerificationTable = async (voterId: string): Promise<{
  success: boolean;
  tableData?: Array<{id: string, candidate: string, emoji: string, word: string}>;
  error?: string;
}> => {
  if (USE_BACK4APP) {
    try {
  
      const resultsPublished = await areElectionResultsPublished();
      if (!resultsPublished) {
        return {
          success: false,
          error: 'Results have not been published yet'
        };
      }

     
      const verificationData = await back4appClient.getVerificationMappingData(voterId);
      const { chosenCandidate, trueIdentifier, identifierList, ballotList } = verificationData;

      if (!chosenCandidate || !trueIdentifier || !identifierList || !ballotList) {
        return {
          success: false,
          error: 'Missing required verification data'
        };
      }

      
      const remaining = identifierList.filter((id: any) => 
        !(id.emoji === trueIdentifier.emoji && id.text === trueIdentifier.text)
      );

      
      const mapping: {[key: string]: {emoji: string, text: string}} = {};
      
   
      mapping[ballotList[0]] = trueIdentifier;

     
      for (let i = 1; i < ballotList.length; i++) {
        if (remaining[i - 1]) {
          mapping[ballotList[i]] = remaining[i - 1];
        }
      }

      
      const tableData: Array<{id: string, candidate: string, emoji: string, word: string}> = ballotList.map((candidate: string, index: number) => ({
        id: (index + 1).toString(),
        candidate: candidate,
        emoji: mapping[candidate]?.emoji || '🎲',
        word: mapping[candidate]?.text || 'Unknown'
      }));


      const shuffledTableData = shuffleArray(tableData);

      return {
        success: true,
        tableData: shuffledTableData
      };

    } catch (error) {
      console.error('Error building verification table:', error);
      return {
        success: false,
        error: 'Failed to build verification table'
      };
    }
  } else {
    
    return {
      success: true,
      tableData: [
        { id: "1", candidate: "Mock Candidate", emoji: "⭐", word: "Star" }
      ]
    };
  }
};


export const getVoterProgressState = async (voterID: string): Promise<number> => {
  if (!USE_BACK4APP) {
    return 1; 
  }

  try {
    const voter = await back4appClient.findVoterByVoterID(voterID);
    
    if (!voter) {
      return 1; 
    }

    const resultsPublished = await back4appClient.getElectionResultsStatus();

    
    if (voter.hasConfirmed && resultsPublished) {
      return 5;
    }

      
    if (voter.hasConfirmed && !resultsPublished) {
      return 4;
    }

    
    if (voter.hasVoted && !voter.hasConfirmed) { 
      return 3;
    }


    if (voter.scannedQR && !voter.hasVoted) {
      return 2;
    }

    return 1;

  } catch (error) {
    console.error(' DEBUG ERROR in getVoterProgressState:', error);
    return 1; 
  }
};
