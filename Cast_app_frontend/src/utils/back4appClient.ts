// Back4app HTTP Client
// Handles all REST API calls to Back4app database

interface Back4appConfig {
  appId: string;
  jsKey: string;
  serverUrl: string;
}

class Back4appClient {
  private config: Back4appConfig;
  private sessionToken: string | null = null;

  constructor() {
    this.config = {
      appId: (import.meta as any).env.VITE_PARSE_APP_ID,
      jsKey: (import.meta as any).env.VITE_PARSE_JS_KEY,
      serverUrl: 'https://parseapi.back4app.com'
    };

    if (!this.config.appId || !this.config.jsKey) {
      throw new Error('Back4app credentials not found in environment variables');
    }

    this.sessionToken = localStorage.getItem('surtr_session_token');

  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'X-Parse-Application-Id': this.config.appId,
      'X-Parse-JavaScript-Key': this.config.jsKey,
      'Content-Type': 'application/json'
    };
    if (this.sessionToken) {
      headers['X-Parse-Session-Token'] = this.sessionToken;
    }
    return headers;
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
    const response = await fetch(url, { method: 'GET', headers: this.getHeaders() });
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
    password: string;
    hasVoted: boolean;
    hasSeenTrueIdentifier?: boolean;
    true_identifier?: any;
    encrypted_private_key?: string;
  }) {
    const response = await fetch(`${this.config.serverUrl}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        username: voterData.voterID,
        password: voterData.password,
        name: voterData.name,
        voterID: voterData.voterID,
        hasVoted: voterData.hasVoted,
        hasSeenTrueIdentifier: voterData.hasSeenTrueIdentifier ?? false,
        true_identifier: voterData.true_identifier,
        encrypted_private_key: voterData.encrypted_private_key ?? ''
      })
    });
    return this.handleResponse(response);
  }

  // GET request with query params — Back4app /login is not a POST
  async loginVoter(voterID: string, password: string) {
    try {
      const response = await fetch(
        `${this.config.serverUrl}/login?username=${encodeURIComponent(voterID)}&password=${encodeURIComponent(password)}`,
        { method: 'GET', headers: this.getHeaders() }
      );
      if (!response.ok) return null;
      const data = await response.json();
      this.sessionToken = data.sessionToken ?? null;
      // Store session token so all subsequent requests are authenticated
      if (this.sessionToken) {
        localStorage.setItem('surtr_session_token', this.sessionToken);
      }
      return data;
    } catch {
      return null;
    }
  }

  // Call this on logout to clear the session
  logout() {
    this.sessionToken = null;
    localStorage.removeItem('surtr_session_token');
  }

  async getAllUsers() {
    const response = await fetch(`${this.config.serverUrl}/users`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await this.handleResponse(response);
    return { results: data.results || [] };
  }

  async findVoterByVoterID(voterID: string) {
    const result = await this.query('_User', { voterID });
    return result.results.length > 0 ? result.results[0] : null;
  }

  async updateVoter(objectId: string, data: Record<string, any>) {
    return this.update('_User', objectId, data);
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
    const result = await this.query('_User', { voterID });
    return result.results.length > 0 ? result.results[0].true_identifier : null;
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

  async getVoterChosenCandidate(voterID: string) {
    const result = await this.query('_User', { voterID });
    return result.results.length > 0 ? result.results[0].chosen_candidate : null;
  }

  async getVoterTrueIdentifier(voterID: string) {
    const result = await this.query('_User', { voterID });
    return result.results.length > 0 ? result.results[0].true_identifier : null;
  }

  async getVoterIdentifierList(voterID: string) {
    const result = await this.query('Identifiers', { voterID });
    return result.results.length > 0 ? result.results[0].list : null;
  }

  async getVoterBallotOrder(voterID: string) {
    const result = await this.query('ballot', { voterID });
    return result.results.length > 0 ? result.results[0].ballotList : null;
  }

  async getElectionResultsStatus() {
    const result = await this.query('ElectionStatus');
    return result.results.length > 0 ? result.results[0].resultsPublished : false;
  }

  async getVerificationMappingData(voterID: string) {
    const [chosenCandidate, trueIdentifier, identifierList, ballotList] = await Promise.all([
      this.getVoterChosenCandidate(voterID),
      this.getVoterTrueIdentifier(voterID),
      this.getVoterIdentifierList(voterID),
      this.getVoterBallotOrder(voterID)
    ]);
    return { chosenCandidate, trueIdentifier, identifierList, ballotList };
  }
}

export const back4appClient = new Back4appClient();
export default back4appClient;