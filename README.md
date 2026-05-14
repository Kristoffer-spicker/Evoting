# EVoting with strong coercion mitigation
## SURTR
This is an expanded version of SURTR a coercion resistant E-voting system <br> 
Down below you can see the preliminary problem statement, as well as how to run this real life version of surtr
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

## Certificates
When running the program for the first time it is important to start the page HTTPS://localhost to accept the certificates associated with the API. 

## .env files
There are .env files needed in the top level directory, the verify_app_frontend, cast_app_frontend and the database folders. 
In the codebase there exists example files for where each of these should go. The file themselves should just be named '.enc' in all four.
The contents needed for each file can be found in the appendix of the paper.

## How to run 
### 1) Clone the resposotory
Clone the repository using the following commands: `https://github.com/Dwight-D-Eisenhower420/Evoting.git` <br>
`cd Evoting`
### 2) Set up Environment Variables
Check the .env.example file in both verify-app/ and vote-app/. Create a copy and rename it to .env in each folder. Update both .env files with the credentials provided in the supplementary materials in the appendix.
### 3) Docker
Make sure Docker is open and running before starting the project.<br>
<br>
If Docker is not installed, it can be downloaded from the following links::<br>
Windows: `https://docs.docker.com/desktop/setup/install/windows-install/`<br>
MacOS: `https://docs.docker.com/desktop/setup/install/mac-install/`<br>
Linux: `https://docs.docker.com/desktop/setup/install/linux/`

Once Docker is running, the project can be started with the following commands:<br>

1) Start the database and tallying servers: `docker compose -f compose.persis.yaml up -d`
2) Start the remaining applications, including the verification application and the casting application: `docker compose up`
3) Stop the verification and casting applications: `docker compose down`
4) Stop the entire program, including orphan containers: `docker compose down --remove-orphans`

Steps 2 and 3 should be repeated each time a new voter is simulated.
### 4) Verify-App
1) Open the verification web application in a browser: `http://localhost:5173/`
2) Register a new voter
3) After registration, continue through the verification application to view your true identifier. This identifier is shown before the QR code, so make sure to remember it.
4) After the true identifier has been shown continue to the  QR-code so it cna be scanned by the casting application
5) After the QR-code has been scanned, continue to the personalized ballot. Here, you can see which identifier belongs to each candidate.
6) Once you know which identifier belongs to each candidate, continue to the final page. This page shows your personalized bulletin board, where you can verify that your vote has been cast correctly. Once the election has ended, the election result will also be shown here.

### 5) Cast-App
The casting application is intended to be used as a mobile web application. For this prototype, it is accessed using ngrok.

1) Open the following link in a mobile web browser: `https://unfitted-startle-monthly.ngrok-free.dev/` <br>
  Be aware that Safari may have restrictions that prevent the application from working correctly. If this happens, use Google Chrome instead.
2) Allow the casting application to access the camera. The camera is needed to scan the QR code from the verification application
3) Once the QR code has been scanned, choose one of the candidates and cast the vote.
4) After the vote has been cast, continue through the application to view your personalized ballot.

Because the project uses the free version of ngrok, the mobile web application can only be accessed through one active tunnel at a time. This means that if 2 comuters runs this locally it will fail, so remmeber to run docker compose down when not using :))


