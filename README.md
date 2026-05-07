# EVoting with strong coercion mitigation
## SURTR
This is an expanded version of SURTR a coercion resistant E-voting system <br> 
Down below you can see the preliminary problem statement, as wella s how to run this real life version of surtr
## Preliminary Problem Statement

**Introduction/ Context:**
Electronic voting systems are becoming increasingly relevant as societies are further digitalizing the voting process. Ensuring that such systems are secure, transparent and resistant to manipulation is important to maintain trust in our elections. Cryptographic research proposes different solutions to these challenges, including coercion mitigation and verifiable voting.

**Problem:**
While a proof of concept version of SURTR has been made, there still needs to be developed a scaled up prototype version of this implementation to prove that it also will work in a real life application, as the proof of concept version makes it difficult to thoroughly test out the cryptographic properties.

**Goal:**
The goal of the project is to develop a functional prototype of an eVoting system based on the SURTR protocol, as described in  “Surtr: Transparent Verification with Simple yet Strong Coercion Mitigation” written by Rosario Giustolisi, Maryam Sheikhi Garjan and Peter Browne Rønne. The project's aim is for us to deepen the understanding of the cryptographical protocols behind SURTR and extend the existing proof of concept into a more realistic system suitable for experimentation and evaluation.

**Methods and Deliverables:**
Implementation of a function eVoting prototype based on the SURTR protocol.
Extend the existing proof of concept to support multiple servers.
Developing a simple user interface to make the system interactable and easier to test.
able and easier to test
A project report documenting the design, implementation, evaluation and cryptographical concepts.

## How to run it
### 1) Clone the resposotory
Clone the repository using the following commands: `https://github.com/Dwight-D-Eisenhower420/Evoting.git`

### 2) Set up Environment Variables
Check the .env.example file in both verify-app/ and vote-app/. Create a copy and rename it to .env in each folder. Update both .env files with the credentials provided in the supplementary materials in the appendix.
### 3) Docker
Make sure to have docker open if, you dont have docker you can downlaod it here:<br>
Windows: `https://docs.docker.com/desktop/setup/install/windows-install/`<br>
MacOS: `https://docs.docker.com/desktop/setup/install/mac-install/`<br>
Linux: `https://docs.docker.com/desktop/setup/install/linux/`

Now your ready to start running the program: <br>
1) Run `docker compose -f compose.persis.yaml up -d` starts the database as well as the tallying servers
2) Run `docker compose up` This starts the rest of the applications, including the verification and casting application
3) Run `docker compose down`to take down the verification and casting application
4) Run `docker compose down --remove-orphans`to take down the whole program

Step 2-3 is doen everytime you want to simulate a new voter

