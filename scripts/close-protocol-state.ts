import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';

const programId = new PublicKey('9rrdPS31RMz51oLDMLrHc2uRZ5kr19qwafdeR7zETvDN');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function closeProtocolState() {
  // Load OLD wallet keypair (current authority)
  const walletPath = os.homedir() + '/.config/solana/id.json';
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );

  const wallet = new anchor.Wallet(walletKeypair);

  console.log('🔧 Closing ProtocolState Account...');
  console.log('Current Authority:', wallet.publicKey.toBase58());

  // Derive ProtocolState PDA
  const [protocolStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('blockflip_v1')],
    programId
  );

  console.log('ProtocolState PDA:', protocolStatePda.toBase58());

  try {
    // Check balance before
    const balanceBefore = await connection.getBalance(wallet.publicKey);
    console.log('Balance before:', balanceBefore / 1e9, 'SOL');

    // Get account info to see rent amount
    const accountInfo = await connection.getAccountInfo(protocolStatePda);
    if (accountInfo) {
      console.log('ProtocolState rent lamports:', accountInfo.lamports / 1e9, 'SOL');
    }

    // Note: Anchor doesn't have a built-in close for ProtocolState
    // We need to manually transfer the rent back
    // Since we can't close a PDA directly without a close instruction in the program,
    // let's just check if we can transfer SOL to the new wallet

    console.log('⚠️  Note: ProtocolState accounts cannot be closed without a close instruction.');
    console.log('The rent will remain locked in the PDA.');
    console.log('Transferring available SOL to new wallet instead...');

    // Transfer SOL to new wallet
    const newWallet = new PublicKey('9kFiLbNP7iEuH4619Px23SYYAGcjVt4udBfNpkRyc5VU');
    const transferAmount = balanceBefore - 5000000; // Keep 0.005 SOL for fees

    if (transferAmount > 0) {
      const transferTx = await connection.sendTransaction(
        new anchor.web3.Transaction().add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: newWallet,
            lamports: transferAmount,
          })
        ),
        [walletKeypair]
      );

      console.log('✅ SOL transferred to new wallet!');
      console.log('Amount:', transferAmount / 1e9, 'SOL');
      console.log('Transaction:', transferTx);
      console.log('View on Solscan:', `https://solscan.io/tx/${transferTx}?cluster=devnet`);
    } else {
      console.log('⚠️  Not enough SOL to transfer.');
    }

    const balanceAfter = await connection.getBalance(wallet.publicKey);
    console.log('Balance after:', balanceAfter / 1e9, 'SOL');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

closeProtocolState().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
