import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';

// Load the program
const programId = new PublicKey('9rrdPS31RMz51oLDMLrHc2uRZ5kr19qwafdeR7zETvDN');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function initializeProtocol() {
  // Load your wallet keypair from Solana CLI config
  const walletPath = os.homedir() + '/.config/solana/id.json';
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  const idl = JSON.parse(
    fs.readFileSync('./anchor/target/idl/blockflip.json', 'utf-8')
  );
  const program = new Program(idl, provider);

  // Derive ProtocolState PDA
  const [protocolStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('blockflip_v1')],
    programId
  );

  console.log('🔧 Initializing BlockFlip Protocol...');
  console.log('Authority (your wallet):', wallet.publicKey.toBase58());
  console.log('ProtocolState PDA:', protocolStatePda.toBase58());
  console.log('Platform Treasury (same as authority for now):', wallet.publicKey.toBase58());

  try {
    const tx = await program.methods
      .initializeProtocol(wallet.publicKey) // platform_treasury = your wallet
      .accountsPartial({
        authority: wallet.publicKey,
      })
      .rpc();

    console.log('✅ Protocol initialized!');
    console.log('Transaction signature:', tx);
    console.log('View on Solscan:', `https://solscan.io/tx/${tx}?cluster=devnet`);
  } catch (error) {
    console.error('❌ Error initializing protocol:', error);
    throw error;
  }
}

initializeProtocol().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
