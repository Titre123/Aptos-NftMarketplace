import React, { useState, useEffect } from 'react';
import { AptosClient } from 'aptos';
import { message } from "antd";
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface Collection {
  creator: string;
  name: string;
  description: string;
  uri: string
}

function CollectionSelector({ onSelect }: any) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const { account } = useWallet();
  const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");

  const fetchCollections = async () => {
    try {
      const collectionDetail = await client.view({
        "function": `${process.env.REACT_APP_MARKETPLACE_ADDRESS}::NFTMarketplace::get_all_collections_by_user`,
        "type_arguments": [],
        "arguments": [
          `${account?.address || localStorage.getItem("address")}`,
          "10",
          "0"
        ]
      });

      let formatted = collectionDetail.flat().map((collection: any) => {
        return (
          {
            uri: collection.uri,
            creator: collection.creator,
            name: collection.name,
            description: collection.description,
          }
        )
      })

      console.log(formatted);

      setCollections(formatted);

    } catch (e) {
      console.error("Error fetching NFT details:", e);
      message.error("Failed to fetch NFTs.");
    }
  };


  useEffect(() => {
    const startFetchMyQuery = async () => {
      await fetchCollections();
    };
    startFetchMyQuery();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Select a Collection</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <div
            key={collection.name}
            className="border p-4 rounded cursor-pointer hover:bg-gray-100"
            onClick={() => onSelect({
              name: collection.name,
              description: collection.description,
              uri: collection.uri
            })}
          >
            {/* Display the collection image */}
            <div className="w-full h-48 overflow-hidden rounded mb-2">
              <img
                src={collection.uri}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-semibold">{collection.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{collection.description}</p>
            <p className="text-sm text-gray-700"><strong>Owner:</strong> {collection.creator.slice(0, 6) + '...' + collection.creator.slice(-4)}</p>
          </div>
        ))}
      </div>
      <button
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={() => onSelect(null)}
      >
        Create New Collection
      </button>
    </div>
  );
}

export default CollectionSelector;
