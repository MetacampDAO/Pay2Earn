import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { SolendAction } from "@solendprotocol/solend-sdk";
import BigNumber from "bignumber.js";
import { useEffect, useRef, useState } from "react";
import "./App.css";

// Get from URL
const MERCHANT = new PublicKey("54VVWDycfdZke6Uq9dkm2YdK43Cabyh7iLcoXK49kPVP");
const USDC = new PublicKey("");

function App() {
  const [amount, setAmount] = useState(0);
  const { connection } = useConnection();
  const wallet = useWallet();

  const handleClick = async () => {
    if (wallet.publicKey) {
      // Round up to nearest dollar
      const remainder = amount % 1;

      // Create two instruction
      const transaction = new Transaction();

      // Get USDC ATA
      const merchantUsdc = await getAssociatedTokenAddress(USDC, MERCHANT);
      const userUsdc = await getAssociatedTokenAddress(USDC, wallet.publicKey);

      // First instruction: Send amount to merchant
      const transferToMerchant = createTransferInstruction(
        userUsdc,
        merchantUsdc,
        wallet.publicKey,
        amount
      );

      transaction.add(transferToMerchant);

      //! Second instruction: Create Solend instruction
      // Create one or more (may contain setup accuont creation txns) to perform a Solend action.
      const solendAction = await SolendAction.buildDepositTxns(
        connection,
        amount.toString(),
        "USDC",
        wallet.publicKey,
        "production"
      );

      console.log("solendAction.lendingIxs", solendAction.lendingIxs[0]);
      transaction.add(solendAction.lendingIxs[0]);

      // Send Transaction
      if (wallet.signTransaction) {
        // Prepping transaction
        const blockHash = await connection.getLatestBlockhash();
        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = blockHash.blockhash;

        // Signing of transaction with wallet adapter
        const signedTx = await wallet.signTransaction(transaction);

        // Send transaction with wallet adapter
        const tx = await wallet.sendTransaction(signedTx, connection);
        console.log("tx", tx);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <label>Price</label>
          <input type="number" onChange={(e) => setAmount(+e.target.value)} />
        </div>
        <button onClick={() => handleClick()}>Send</button>
      </header>
    </div>
  );
}

export default App;
