import { forwardRef } from 'react';
import ComputerIcon from './ComputerIcon';
import MobileIcon from './MobileIcon';
import styles from '../help-styled-comp/helpMobileContent.module.css';

const HelpMobileContent = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <main ref={ref} className={styles.content}>
      <div className={styles.contentInner}>
    
        <section id="about" className={styles.section}>
          <h2 className={styles.sectionTitle}>About the SURTR Voting System</h2>
          <div className={styles.sectionBody}>
            <p>
              SURTR is a secure electronic voting system designed to give you both privacy and
              confidence in your vote. It allows you to cast your ballot digitally while still
              giving you a meaningful way to check, for yourself, that your vote was correctly
              recorded in the final election results.
            </p>
            <p>
              Rather than asking you to simply "trust the system," SURTR lets you take an active
              role in verifying your vote. You remain in control throughout the process, and you
              can later confirm that your vote was included, without ever revealing who you voted
              for.
            </p>
          </div>
        </section>

        <div className={styles.divider}></div>

    
        <section id="two-devices" className={styles.section}>
          <h2 className={styles.sectionTitle}>Why SURTR uses two devices</h2>
          <div className={styles.sectionBody}>
            <p>
              SURTR intentionally divides the voting process between two applications with
              different roles.
            </p>
            <p>
              <strong>SURTR Verify</strong>, which runs on a desktop or laptop, is used for
              registering as a voter, starting your voting session, showing you your verification
              identifiers, and later allowing you to verify your vote after the election results
              are published.
            </p>
            <p>
              <strong>SURTR Vote</strong>, which runs on your mobile phone, is used for selecting and casting your vote, and for viewing your Personalized Ballot.
            </p>
            <p>
              Using two devices separates voting from verification. This makes the process easier
              to understand, helps protect your privacy, and reduces the risk that a single device
              could be misused or compromised. In practice, this means you should have both your
              computer and your phone available, turned on, and ready while you vote, as you will
              use both apps as part of one continuous process.
            </p>
          </div>
        </section>

        <div className={styles.divider}></div>

       
        <section id="different" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            What makes SURTR different from other e-voting systems
          </h2>
          <div className={styles.sectionBody}>
            <p>SURTR is designed with three main goals in mind:</p>
            <div className={styles.numberedList}>
              <div className={styles.numberedItem}>
                <p className={styles.numberedItemTitle}>1. Vote privacy</p>
                <p>
                  You can verify your vote without revealing who you voted for. Even if you
                  perform verification in front of others, your actual choice remains private.
                </p>
              </div>
              <div className={styles.numberedItem}>
                <p className={styles.numberedItemTitle}>2. Transparent verification</p>
                <p>
                  After the election results are published, you can check for yourself that your
                  vote was included correctly in the final tally. You do not have to "trust the
                  system blindly", you can personally identify and confirm your vote.
                </p>
              </div>
              <div className={styles.numberedItem}>
                <p className={styles.numberedItemTitle}>3. Protection against coercion</p>
                <p>
                  SURTR is designed to reduce the risk of voter coercion. If someone pressures you
                  to prove how you voted, the system allows you to perform a valid-looking
                  verification for any candidate without exposing your real choice. This helps
                  protect your freedom to vote as you truly wish.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider}></div>

    
        <section id="key-concepts" className={styles.section}>
          <h2 className={styles.sectionTitle}>Key Concepts in SURTR</h2>
          <div className={styles.sectionBody}>
            <p>
              Before following the step-by-step guide, it is useful to understand a few terms that appear throughout the apps. These concepts help you interpret what you see on the screen and understand the purpose of each stage in the process.
            </p>
          </div>
        </section>

        <div className={styles.divider}></div>

       
        <section id="identifier" className={styles.section}>
          <h2 className={styles.sectionTitle}>What is an "Identifier"?</h2>
          <div className={styles.sectionBody}>
            <p>
              An identifier is a pair consisting of an image and a word (for example: " 🎲  Die ").
            </p>
            <p>
              Identifiers are used only for verification, not for voting. They do not reveal who
              you voted for, they are simply visual labels that help you recognize  your vote when you check the results.
            </p>
            <p>
              They are called "identifiers" because this image–word pair helps you identify your
              vote in the verification results. When you see the same identifier next to your
              chosen candidate, it confirms that your vote was correctly taken into account.
            </p>
            <p>You do not create an identifier, the system shows it to you.</p>
          </div>
        </section>

        <div className={styles.divider}></div>

      
        <section id="true-identifier" className={styles.section}>
          <h2 className={styles.sectionTitle}>What is the True Identifier?</h2>
          <div className={styles.sectionBody}>
            <p>
              Your True Identifier is one specific image–word pair that is linked to the candidate
              you actually voted for.
            </p>
            <p>
              You will see this identifier once on your computer (SURTR Verify) after you cast
              your vote, and you are asked to remember it.
            </p>
            <p>
              When the election results are published, you will look for this same identifier in
              the verification table. If your True Identifier appears next to your chosen
              candidate, it shows that your vote was correctly recorded.
            </p>
          </div>
        </section>

        <div className={styles.divider}></div>

       
        <section id="all-identifiers" className={styles.section}>
          <h2 className={styles.sectionTitle}>What are "Identifiers for all candidates"?</h2>
          <div className={styles.sectionBody}>
            <p>
              These are additional identifiers that you can look up for any candidate, not only
              the one you voted for.
            </p>
            <p>
              You use them together with your Personalized Ballot on your phone (SURTR Vote), which tells you
              each candidate's position number. By entering that number on your computer (SURTR
              Verify), you can see the corresponding identifier.
            </p>
            <p>
              This step is optional. It is mainly there as a protective feature in case you are
              under coercion (explained below).
            </p>
          </div>
        </section>

        <div className={styles.divider}></div>

   
        <section id="coercion" className={styles.section}>
          <h2 className={styles.sectionTitle}>What is coercion in voting?</h2>
          <div className={styles.sectionBody}>
            <p>
             Coercion in voting means when someone pressures or tries to make a voter vote the way they want and may later ask them to prove that they complied. The person applying this pressure is called coercer.

            </p>
            <p>
              SURTR is designed to reduce this risk. Because of how identifiers work, you can
              perform a valid-looking verification for any candidate without revealing your real
              choice. This helps you stay in control of your vote even under pressure.
            </p>
            <p>
              You are never required to use this feature, it is there as a protection against
              coercion, not an obligation.
            </p>
          </div>
        </section>

        <div className={styles.divider}></div>

        
        <section id="voting-guide" className={styles.section}>
          <h2 className={styles.sectionTitle}>Step-by-Step Voting Guide</h2>
          
      
          <div className={styles.stepSection}>
            <h3 className={styles.stepTitle}>Step 1 : Start on your computer</h3>
            <div className={styles.sectionBody}>
              <p className={styles.deviceLabel}><ComputerIcon /> On SURTR Verify:</p>
              <ol className={styles.orderedList}>
                <li>Register as a voter (if you haven't already).</li>
                <li>Log in.</li>
                <li>You will see your voting QR code on your screen.</li>
              </ol>
            </div>
          </div>

        
          <div className={styles.stepSection}>
            <h3 className={styles.stepTitle}>Step 2 : Move to your phone to scan the QR code</h3>
            <div className={styles.sectionBody}>
              <p className={styles.deviceLabel}><MobileIcon /> On SURTR Vote:</p>
              <ol className={styles.orderedList}>
                <li>Open the app and log in with the same details.</li>
                <li>Scan the QR code shown on SURTR Verify.</li>
                <li>Your phone is now connected to your voting session.</li>
              </ol>
            </div>
          </div>

        
          <div className={styles.stepSection}>
            <h3 className={styles.stepTitle}>Step 3 : Cast your vote on your phone</h3>
            <div className={styles.sectionBody}>
              <p className={styles.deviceLabel}><MobileIcon /> On SURTR Vote:</p>
              <ol className={styles.orderedList}>
                <li>Select one candidate.</li>
                <li>Press Vote.</li>
                <li>Review your choice and press Confirm Vote.</li>
                <li>You will see the confirmation screen "Your vote has been successfully cast."</li>
                <li>Now return to your computer.</li>
              </ol>
            </div>
          </div>

        
          <div className={styles.stepSection}>
            <h3 className={styles.stepTitle}>Step 4 : View your True Identifier on your computer</h3>
            <div className={styles.sectionBody}>
              <p className={styles.deviceLabel}><ComputerIcon /> Back on SURTR Verify:</p>
              <ol className={styles.orderedList}>
                <li>Continue to the "After Vote Casting" page.</li>
                <li>Click "Show True Identifier."</li>
                <li>
                  You will see:
                  <br />
                  An image + a word (for example:" 🎲  Die ").
                  <br />
                  This is your True Identifier.
                </li>
              </ol>
              <p className={styles.importantNote}>
                <strong>Important:</strong> You can only see this once. Memorize it carefully.
                <br />
                This identifier will later help you verify your vote.
              </p>
            </div>
          </div>

      
          <div className={styles.stepSection}>
            <h3 className={styles.stepTitle}>Step 5 : (Optional) Review identifiers for all candidates on your computer</h3>
            <div className={styles.sectionBody}>
              <p className={styles.deviceLabel}>
                <ComputerIcon /> On SURTR Verify — "Identifiers for All Candidates" page:
              </p>
              <p>
                This step is mainly for voters who want protection against coercion.
                <br />
                If you are not under pressure, you can skip this step.
              </p>
              <p>If you want to prepare for a possible coercion situation:</p>
              <ol className={styles.orderedList}>
                <li>Keep this page open on your computer.</li>
                <li>Go back to your phone to view your Personalized Ballot.</li>
              </ol>
            </div>
          </div>

        
          <div className={styles.stepSection}>
            <h3 className={styles.stepTitle}>Step 6 : View your Personalized Ballot on your phone</h3>
            <div className={styles.sectionBody}>
              <p className={styles.deviceLabel}><MobileIcon /> On SURTR Vote:</p>
              <p>
                You will see a list of all candidates in a unique order.
                <br />
                Each candidate has a position number in the list (1, 2, 3, …).
              </p>
              <p>If you want, you can:</p>
              <ol className={styles.orderedList}>
                <li>Note the position number of any candidate from the list</li>
                <li>Return to your computer (SURTR Verify)</li>
                <li>Enter that number to see their identifier</li>
              </ol>
              <p>
                This helps you verify later for any candidate without revealing your real vote.
              </p>
            </div>
          </div>

        
          <div className={styles.stepSection}>
            <h3 className={styles.stepTitle}>Step 7 : Voting completed</h3>
            <div className={styles.sectionBody}>
              <p>
                Both apps will show:
                <br />
                "You have successfully completed the voting process."
              </p>
              <p>At this point:</p>
              <ol className={styles.orderedList}>
                <li>Your vote is cast.</li>
                <li>You must wait for election results to be published before verification.</li>
                <li>You can close both apps.</li>
              </ol>
            </div>
          </div>
        </section>

        <div className={styles.divider}></div>

     
        <section id="verify" className={styles.section}>
          <h2 className={styles.sectionTitle}>How to verify your vote (Post-Election)</h2>
          <div className={styles.sectionBody}>
            <p>
              When the election results have been published, you can verify your vote using SURTR Verify.
            </p>
            <p className={styles.deviceLabel}>
             <span style={{ fontSize: '50px' }}><ComputerIcon /></span> Open SURTR Verify on the same computer you used for registration.
            </p>
            <p>Sign in with your voter credentials.</p>
            <p>Select "Verify My Vote."</p>
            <p>
              You will see a verification table that lists all candidates together with their corresponding identifiers.
            </p>
            <p>To verify your vote:</p>
            <ul className={styles.unorderedList}>
              <li>Look for your memorized True Identifier in the table.</li>
              <li>Check whether it appears next to the candidate you voted for.</li>
            </ul>
            <p>
              If your True Identifier appears next to your chosen candidate, your vote has been correctly recorded.
            </p>
            <p>
              If your True Identifier is missing or appears next to a different candidate, select Contact Election Authority for further assistance.
            </p>
            <p>You may use the search function to find entries by:</p>
            <ul className={styles.unorderedList}>
              <li>Identifier word, or</li>
              <li>Candidate name.</li>
            </ul>
            <p>
              You can also select any row in the table to view the identifier in a larger, clearer format.
            </p>
          </div>
        </section>

        <div className={styles.divider}></div>

     
        <section id="never-voted" className={styles.section}>
          <h2 className={styles.sectionTitle}>What if I followed Verify but never voted?</h2>
          <div className={styles.sectionBody}>
            <p>
              If you completed steps on your computer but never actually cast a vote on your phone, the system will tell you:
            </p>
            <p className={styles.systemMessage}>
              "No vote found for you in this election."
            </p>
            <p>
              If this outcome is unexpected or surprises you, contact the Election Authority.
            </p>
            <p>
              This simply means that casting the vote on your phone is required, registration alone is not enough.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
});

HelpMobileContent.displayName = 'HelpMobileContent';

export default HelpMobileContent;
