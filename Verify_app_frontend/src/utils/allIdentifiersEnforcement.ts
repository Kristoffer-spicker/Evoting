import back4appClient from './back4appClient';


const USE_BACK4APP = (import.meta as any).env?.VITE_USE_PARSE === 'true';


export const hasVoterSeenAllIdentifiers = async (voterId: string): Promise<boolean> => {
  if (USE_BACK4APP) {
    try {
      const voter = await back4appClient.findVoterByVoterID(voterId);
      return voter?.hasSeenAllIdentifiers === true;
    } catch (error) {
      console.error('Error checking if voter has seen all identifiers:', error);
      return false;
    }
  } else {
    const seen = localStorage.getItem(`surtr_seen_all_identifiers_${voterId}`);
    return seen === 'true';
  }
};


export const markAllIdentifiersSeen = async (voterId: string): Promise<boolean> => {
  if (USE_BACK4APP) {
    try {
      const voter = await back4appClient.findVoterByVoterID(voterId);
      if (!voter) {
        console.error('Voter not found:', voterId);
        return false;
      }

      await back4appClient.updateVoter(voter.objectId, {
        hasSeenAllIdentifiers: true
      });

      const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter');
      if (authenticatedVoter) {
        const voterData = JSON.parse(authenticatedVoter);
        voterData.hasSeenAllIdentifiers = true;
        localStorage.setItem('surtr_authenticated_voter', JSON.stringify(voterData));
      }

      return true;
    } catch (error) {
      console.error('Error marking all identifiers as seen:', error);
      return false;
    }
  } else {
   
    localStorage.setItem(`surtr_seen_all_identifiers_${voterId}`, 'true');
    return true;
  }
};
