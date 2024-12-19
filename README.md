# Aptos NFT Marketplace (Frontend)

This project is a React-based frontend for an NFT marketplace built on the Aptos blockchain. The marketplace allows users to view, buy, and make offers on listed NFTs, as well as browse and select collections. It leverages the Aptos SDK, Move-based contracts, and the Aptos Wallet Adapter for seamless integration.

## Features

- **Browse NFTs**: Fetch all NFTs listed for sale from an Aptos on-chain contract.
- **Search & Sort**: Easily search NFTs by name or description and sort them by criteria such as royalty or price.
- **Purchase NFTs**: Buy NFTs listed for direct sale.
- **Auctions & Offers**: 
  - For auctioned NFTs, users can place offers.
  - View all offers for a particular NFT in a dedicated modal popup.
- **Collections**: 
  - Browse and select existing NFT collections.
  - Create a new collection if needed.
- **UI/UX**: Designed with Tailwind CSS and Ant Design for a responsive, user-friendly interface.

## Technology Stack

- **Frontend**: 
  - [React](https://reactjs.org/) for building a responsive UI.
  - [TypeScript](https://www.typescriptlang.org/) for type-safe development.
  - [Tailwind CSS](https://tailwindcss.com/) for styling and layout.
  - [Ant Design (AntD)](https://ant.design/) for UI components such as modals and tables.
  
- **Blockchain Integration**: 
  - [Aptos Client](https://aptos.dev/) for on-chain queries and transactions.
  - [Aptos Wallet Adapter React](https://github.com/aptos-labs/aptos-wallet-adapter) for seamless wallet connection and transaction signing.
  
- **Smart Contracts**: 
  - Move-based contracts deployed on the Aptos testnet handle logic such as listing NFTs, auctions, and offers.
  - Contract functions like `get_all_nfts_for_sale`, `purchase_nft`, and `make_offer` are invoked as view and entry functions respectively.

## Prerequisites

- Node.js and npm (or yarn) installed.
- An Aptos wallet extension (e.g., Petra Wallet) connected to Aptos testnet.
- A `.env` file with `REACT_APP_MARKETPLACE_ADDRESS` set to the deployed marketplace contract address.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Set Environment Variables**:
   Create a .env file in the project root:
   ```env
   REACT_APP_MARKETPLACE_ADDRESS=0x<your_marketplace_contract_address>
   ```
3. **Run the Development Server**:
   ```bash
   npm start
   ```
   Open http://localhost:3000 in your browser.

4. **Connect Wallet**:
   Connect to the Aptos testnet wallet extension and interact with the NFT marketplace UI.

## Key Components
- MarketplacePage.tsx: Renders all NFTs for sale, includes search/sort functionality, and handles purchase and offer actions.
- CollectionSelector.tsx: Allows the user to choose an existing NFT collection or create a new one.
- NftCard.tsx: A reusable component for displaying NFT details (image, name, description, price, etc.).

## Development Notes
- Ensure you have the correct Aptos FullNode URL set in the code (e.g., https://fullnode.testnet.aptoslabs.com/v1).
- Offers and auctions are displayed conditionally based on the contract logic (e.g., sale type 1 for straight sale, 2 for auction).
- Modify Tailwind classes and Ant Design components to fit desired branding and design preferences.

## License
This project is open-source. Please refer to the LICENSE file for more information.