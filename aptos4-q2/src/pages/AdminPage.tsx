import React, { useState, useEffect } from 'react';

function AdminPage() {
  const [nfts, setNfts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Fetch all NFTs and transactions from API
    const fetchData = async () => {
      // Replace with actual API calls
      const nftsResponse = await fetch('/api/admin/nfts');
      const nftsData = await nftsResponse.json();
      setNfts(nftsData);

      const transactionsResponse = await fetch('/api/admin/transactions');
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData);
    };
    fetchData();
  }, []);

  // Dummy data for rendering
  const dummyNfts = [
    { id: 1, name: "NFT 1", collectionId: "Collection 1", owner: "Owner 1", rarity: "Common", royalty: 5, saleType: 1, price: 0.5 },
    { id: 2, name: "NFT 2", collectionId: "Collection 2", owner: "Owner 2", rarity: "Rare", royalty: 10, saleType: 2, price: 1.0 },
    { id: 3, name: "NFT 3", collectionId: "Collection 3", owner: "Owner 3", rarity: "Legendary", royalty: 15, saleType: 1, price: 2.0 },
  ];

  const dummyTransactions = [
    { id: 1, nftId: 1, from: "Owner 1", to: "Buyer 1", price: 0.5, timestamp: "2022-01-01T00:00:00" },
    { id: 2, nftId: 2, from: "Owner 2", to: "Buyer 2", price: 1.0, timestamp: "2022-02-01T00:00:00" },
    { id: 3, nftId: 3, from: "Owner 3", to: "Buyer 3", price: 2.0, timestamp: "2022-03-01T00:00:00" },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <h2 className="text-xl font-semibold mt-8 mb-4">All NFTs</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Collection</th>
            <th className="border p-2">Owner</th>
            <th className="border p-2">Rarity</th>
            <th className="border p-2">Royalty</th>
            <th className="border p-2">Sale Type</th>
            <th className="border p-2">Price</th>
          </tr>
        </thead>
        <tbody>
          {dummyNfts.map((nft) => (
            <tr key={nft.id}>
              <td className="border p-2">{nft.id}</td>
              <td className="border p-2">{nft.name}</td>
              <td className="border p-2">{nft.collectionId}</td>
              <td className="border p-2">{nft.owner}</td>
              <td className="border p-2">{nft.rarity}</td>
              <td className="border p-2">{nft.royalty}%</td>
              <td className="border p-2">{nft.saleType === 1 ? 'Straight Sale' : 'Auction'}</td>
              <td className="border p-2">{nft.price ? `${nft.price} ETH` : 'Not listed'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-8 mb-4">Transactions</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">NFT ID</th>
            <th className="border p-2">From</th>
            <th className="border p-2">To</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {dummyTransactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="border p-2">{transaction.id}</td>
              <td className="border p-2">{transaction.nftId}</td>
              <td className="border p-2">{transaction.from}</td>
              <td className="border p-2">{transaction.to}</td>
              <td className="border p-2">{transaction.price} ETH</td>
              <td className="border p-2">{new Date(transaction.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPage;

