// Back4app HTTP Client - REST only, no Parse SDK
// Remove the import Parse line entirely

class Back4appClient {
  private appId: string;
  private jsKey: string;
  private serverUrl: string;

  constructor() {
    this.appId = (import.meta as any).env.VITE_PARSE_APP_ID;
    this.jsKey = (import.meta as any).env.VITE_PARSE_JS_KEY;
    this.serverUrl = 'https://parseapi.back4app.com';

    if (!this.appId || !this.jsKey) {
      throw new Error('Back4app credentials not found in environment variables');
    }
  }

  private getHeaders(sessionToken?: string): HeadersInit {
    const headers: Record<string, string> = {
      'X-Parse-Application-Id': this.appId,
      'X-Parse-JavaScript-Key': this.jsKey,
      'Content-Type': 'application/json'
    };
    if (sessionToken) {
      headers['X-Parse-Session-Token'] = sessionToken;
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
    const response = await fetch(`${this.serverUrl}/classes/${className}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async query(className: string, params: Record<string, any> = {}, sessionToken?: string) {
    /*
    query: query function used to get information from the database
    */
    const queryParams = new URLSearchParams();
    if (Object.keys(params).length > 0) {
      queryParams.append('where', JSON.stringify(params));
    }
    const url = `${this.serverUrl}/classes/${className}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, { method: 'GET', headers: this.getHeaders(sessionToken) });
    console.log("Response:", url);
    return this.handleResponse(response);
  }

  async update(className: string, objectId: string, data: Record<string, any>) {

    /*
    update: function used to update the database
    */
    const sessionToken = localStorage.getItem('surtr_session_token') || undefined;
    const response = await fetch(`${this.serverUrl}/classes/${className}/${objectId}`, {
      method: 'PUT',
      headers: this.getHeaders(sessionToken),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async delete(className: string, objectId: string) {
    /*
    delete: function used to delete from the database
    */
    const response = await fetch(`${this.serverUrl}/classes/${className}/${objectId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // Uses Back4app's built-in /users endpoint which handles bcrypt hashing automatically
  async createVoter(voterData: {
    name: string;
    voterID: string;
    password: string;
    hasVoted: boolean;
    hasSeenTrueIdentifier?: boolean;
    true_identifier?: any;
    encrypted_private_key?: string;
  }) {
    const response = await fetch(`${this.serverUrl}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        username: voterData.voterID,
        password: voterData.password,  // Back4app /users endpoint hashes this automatically
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

  // Uses Back4app's built-in /login endpoint
  async loginVoter(voterID: string, password: string) {
    try {
      const response = await fetch(`${this.serverUrl}/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ username: voterID, password })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async getAllUsers() {
    const response = await fetch(`${this.serverUrl}/users`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await this.handleResponse(response);
    return { results: data.results || [] };
  }

  async findVoterByVoterID(voterID: string) {
    const sessionToken = localStorage.getItem('surtr_session_token') || undefined;
    const result = await this.query('_User', { voterID }, sessionToken);
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
    const sessionToken = localStorage.getItem('surtr_session_token') || undefined;
    const result = await this.query('_User', { voterID }, sessionToken);
    console.log(result.results[0].true_identifier);
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

  async getVoterChosenCandidate(voterID: string) {
    const sessionToken = localStorage.getItem('surtr_session_token') || undefined;
    const result = await this.query('_User', { voterID }, sessionToken);
    return result.results.length > 0 ? result.results[0].chosen_candidate : null;
  }

  async getVoterTrueIdentifier(voterID: string) {
    const sessionToken = localStorage.getItem('surtr_session_token') || undefined;
    const result = await this.query('_User', { voterID }, sessionToken);
    return result.results.length > 0 ? result.results[0].true_identifier : null;
   /*const queryParams = new URLSearchParams()
    queryParams.append('where', JSON.stringify({ voterID }));
    const url = `${this.serverUrl}/classes/users${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(sessionToken)
    })
    const result = await this.handleResponse(response);
    console.log(result.results[0].true_identifier);*
    return result.results.length > 0 ? result.results[0].true_identifier : null;*/
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