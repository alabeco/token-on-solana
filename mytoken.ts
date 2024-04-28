import {
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
 } from "@solana/web3.js";
import "dotenv/config";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";

const DECIMALS = 6;
const ADDRESSES = process.env.ADDRESSES?.split(",") || [];
const RECEIVERS_AMOUNT = 1000 * (10 ** DECIMALS);

async function createNewMint(
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null,
  decimals: number
): Promise<PublicKey> {
  const addr = await createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimals,
  );
  console.log(`Mint link: https://explorer.solana.com/address/${addr}?cluster=devnet`)

  return addr;
}

async function createTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
) {
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  )

  console.log(
    `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
  )

  return tokenAccount
}

async function mintTokens(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  authority: Keypair,
  amount: number
) {
  const transactionSignature = await mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount
  )

  console.log(
    `Mint Token Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function transferTokens(
  connection: Connection,
  payer: Keypair,
  source: PublicKey,
  destination: PublicKey,
  owner: Keypair,
  amount: number
) {
  const transactionSignature = await transfer(
    connection,
    payer,
    source,
    destination,
    owner,
    amount
  )

  console.log(
    `Transfer Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = getKeypairFromEnvironment("SECRET_KEY");

  const mint = await createNewMint(
    connection,
    payer,
    payer.publicKey,
    null,
    DECIMALS,
  )

  const mintinfo = await getMint(connection, mint);
  const tokenAccount = await createTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  )

  await mintTokens(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer,
    1000000 * (10 ** DECIMALS)
  )

  // TODO: send in bulk instead
  for (const address of ADDRESSES) {
    console.log(`Sending ${RECEIVERS_AMOUNT} to ${address}`)
    const addressKey = new PublicKey(address)
    const receiverTokenAccount = await createTokenAccount(
      connection,
      payer,
      mint,
      addressKey
    )
    await transferTokens(
      connection,
      payer,
      tokenAccount.address,
      receiverTokenAccount.address,
      payer,
      RECEIVERS_AMOUNT
    )
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
