import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';

const programId = new PublicKey('9rrdPS31RMz51oLDMLrHc2uRZ5kr19qwafdeR7zETvDN');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function transferAuthority() {
  // Load OLD wallet keypair (current authority)
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

  // New authority wallet
  const newAuthority = new PublicKey('9kFiLbNP7iEuH4619Px23SYYAGcjVt4udBfNpkRyc5VU');

  console.log('🔄 Transferring Protocol Authority...');
  console.log('Current Authority (old wallet):', wallet.publicKey.toBase58());
  console.log('New Authority (your Phantom):', newAuthority.toBase58());
  console.log('ProtocolState PDA:', protocolStatePda.toBase58());

  try {
    const tx = await program.methods
      .transferAuthority(newAuthority)
      .accountsPartial({
        protocolState: protocolStatePda,
        authority: wallet.publicKey,
      })
      .rpc();

    console.log('✅ Authority transferred successfully!');
    console.log('Transaction signature:', tx);
    console.log('View on Solscan:', `https://solscan.io/tx/${tx}?cluster=devnet`);
    console.log('');
    console.log('🎉 Your Phantom wallet is now the protocol authority!');
    console.log('You can now access /specialist page and authorize yourself as an operator.');
  } catch (error) {
    console.error('❌ Error transferring authority:', error);
    throw error;
  }
}

transferAuthority().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
