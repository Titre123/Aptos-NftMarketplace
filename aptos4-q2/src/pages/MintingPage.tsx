import React, { useState } from 'react';
import { message } from "antd";
import CollectionSelector from '../components/CollectionSelection';
import NFTCreationForm from '../components/TokenCreationForm';
import { AptosClient } from "aptos";
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface Collection {
  name: string;
  description: string;
  uri: string;
}

function MintingPage() {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [step, setStep] = useState<string>('collection');
  const { signAndSubmitTransaction } = useWallet();
  const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
    setStep('token');
  };

  const handleBack = () => {
    setStep('collection');
    setSelectedCollection(null);
  };

  // Updated function to handle both collectionData and tokenData:
  const handleMintNFT = async (collectionData: Collection, tokenData: {
    name: string;
    description: string;
    uri: string;
    rarity: string;
    royalty: number;
  }) => {
    try {
      // Convert rarity and royalty to numbers suitable for the Aptos transaction (u8)
      const rarity = parseInt(tokenData.rarity);

      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${process.env.REACT_APP_MARKETPLACE_ADDRESS}::NFTMarketplace::create_and_mint_nft`,
        type_arguments: [],
        arguments: [
          collectionData.name,             // collection_name: String
          collectionData.description,      // collection_description: String
          collectionData.uri,              // collection_uri: String
          tokenData.name,                  // token_name: String
          tokenData.description,           // token_description: String
          tokenData.uri,                   // token_uri: String
          rarity,                       // rarity: u8
          tokenData.royalty                       // royalty: u8
        ]
      };

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(txnResponse.hash);

      message.success("NFT minted successfully!");
    } catch (error) {
      console.error("Error minting NFT:", error);
      message.error("Failed to mint NFT.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mint New NFT</h1>
      {step === 'collection' ? (
        <CollectionSelector onSelect={handleCollectionSelect} />
      ) : (
        <NFTCreationForm
          existingCollection={selectedCollection}
          onBack={handleBack}
          onSubmit={(collectionData, tokenData) => handleMintNFT(collectionData, tokenData)}
        />
      )}
    </div>
  );
}

export default MintingPage;
