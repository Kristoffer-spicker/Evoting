// Back4app HTTP Client
// Handles all REST API calls to Back4app database

interface Back4appConfig {
  appId: string;
  jsKey: string;
  serverUrl: string;
}

class Back4appClient {
  private config: Back4appConfig;

  constructor() {
    this.config = {
      appId: (import.meta as any).env.VITE_PARSE_APP_ID,
      jsKey: (import.meta as any).env.VITE_PARSE_JS_KEY,
      serverUrl: 'https://parseapi.back4app.com'
    };

    if (!this.config.appId || !this.config.jsKey) {
      throw new Error('Back4app credentials not found in environment variables');
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'X-Parse-Application-Id': this.config.appId,
      'X-Parse-JavaScript-Key': this.config.jsKey,
      'Content-Type': 'application/json'
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Back4app Error: ${errorData.error || response.statusText}`);
    }
    return response.json();
  }

  
  async create(className: string, data: Record<string, any>) {
    /*
    create: create function used to create/post something to the datbase
    */
    const response = await fetch(`${this.config.serverUrl}/classes/${className}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

 
  async query(className: string, params: Record<string, any> = {}) {
    /*
    query: query function used to get information from the database
    */
    const queryParams = new URLSearchParams();
    
    if (Object.keys(params).length > 0) {
      queryParams.append('where', JSON.stringify(params));
    }

    const url = `${this.config.serverUrl}/classes/${className}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async update(className: string, objectId: string, data: Record<string, any>) {
    /*
    update: function used to update the database
    */
    const response = await fetch(`${this.config.serverUrl}/classes/${className}/${objectId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async delete(className: string, objectId: string) {
    /*
    delete: function used to delete from the database
    */
    const response = await fetch(`${this.config.serverUrl}/classes/${className}/${objectId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async createVoter(voterData: {
    name: string;
    voterID: string;
    hasVoted: boolean;
    hasSeenTrueIdentifier?: boolean;
  }) {
    return this.create('Voters', voterData);
  }

  async findVoterByVoterID(voterID: string) {
    const result = await this.query('Voters', { voterID });
    return result.results.length > 0 ? result.results[0] : null;
  }

  async updateVoter(objectId: string, data: Record<string, any>) {
    return this.update('Voters', objectId, data);
  }

  async createIdentifiersList(identifiersData: {
    voterID: string;
    list: Array<{emoji: string, text: string}>;
  }) {
    return this.create('Identifiers', identifiersData);
  }

  async getIdentifiersByVoterID(voterID: string) {
    const result = await this.query('Identifiers', { voterID });
    return result.results.length > 0 ? result.results[0] : null;
  }

  async getTrueIdentifierByVoterID(voterID: string) {
    const voterResult = await this.query('Voters', { voterID });
    
    if (voterResult.results.length > 0) {
      const voter = voterResult.results[0];
      return voter.true_identifier;
    }
    
    return null;
  }

  async getAllCandidates() {
    const result = await this.query('Candidates');
    return result.results;
  }

  async createMapping(mappingData: {
    voterID: string;
    candidateID: string;
    timestamp: Date;
  }) {
    return this.create('Mappings', mappingData);
  }

  async getMappingByVoterID(voterID: string) {
    const result = await this.query('Mappings', { voterID });
    return result.results.length > 0 ? result.results[0] : null;
  }

  async createBallotRecord(ballotData: {
    voterID: string;
    ballotList: string[];
  }) {
    return this.create('ballot', ballotData);
  }

  async getBallotByVoterID(voterID: string) {
    const result = await this.query('ballot', { voterID });
    return result.results.length > 0 ? result.results[0] : null;
  }

  async updateBallotRecord(voterID: string, ballotList: string[]) {
    const ballot = await this.getBallotByVoterID(voterID);
    if (ballot) {
      return this.update('ballot', ballot.objectId, { ballotList });
    }

    return this.createBallotRecord({ voterID, ballotList });
  }

}

export const back4appClient = new Back4appClient();
export default back4appClient;