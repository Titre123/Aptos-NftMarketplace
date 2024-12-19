// TODO# 1: Define Module and Marketplace Address
address 0x8312fded4bf6fb5c1ec528be054b43f403fd0a72fe6d1e74cacf18b556214554 {

    module NFTMarketplace {
        use std::signer;
        use std::vector;
        use 0x1::aptos_coin;
        use 0x1::coin;
        use std::string::{Self, String};
        use aptos_token_objects::royalty::{Royalty};
        use std::object::{Self, Object, TransferRef, ConstructorRef};
        use std::option::{Self, Option};
        use aptos_token_objects::token::{Self, Token};
        use aptos_token_objects::collection;
        use aptos_std::table::{Self, Table};
        use aptos_framework::timestamp;

        // constants
        // TODO# 5: Set Marketplace Fee
        const MARKETPLACE_FEE_PERCENT: u64 = 2; // 2% fee

        // Define NFT Structure
        #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
        struct NFT has store, key, copy {
            id: u64,
            owner: address,
            creator: address,
            name: String,
            description: String,
            uri: String,
            price: u64,
            for_sale: bool,
            rarity: u8,
            royalty: u8,
            last_sold_price: u64,
            token: Object<Token>,
            sale_type: u8,
            auction_duration: u64,
            action_part: vector<AuctionPart>,
        }

        // Define NFT Structure
        #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
        struct PermissionRef has key {
            transfer_ref: TransferRef,
        }


        struct AuctionPart has store, drop, copy {
            user: address,
            offer: u64,
        }

        // Marketplace Structure
        struct Marketplace has key {
            nfts: vector<NFT>
        }

        // TODO# 4: Define ListedNFT Structure
        struct ListedNFT has copy, drop {
            id: u64,
            name: String,
            description: String,
            owner: address,
            price: u64,
            rarity: u8,
            royalty: u8,
            auction_duration: u64,
            uri: String,
            sale_type: u8,
            action_part: vector<AuctionPart>,
        }

        struct Collection has copy, drop, store {
            name: String,
            description: String,
            uri: String,
            creator: address
        }

        struct Collections has key {
            collections: vector<Collection>
        }

        // Initialize Marketplace
        public entry fun initialize_marketplace(account: &signer) {
            assert!(signer::address_of(account) == @NFTMarketplace, 301);
            move_to(account, Marketplace {
                nfts: vector[]
            });
        }

        // Initialixe accoount
        public entry fun initialize_account(account: &signer) {
            if(!exists<Collections>(signer::address_of(account))) {
                move_to(account, Collections {
                    collections: vector[]
                });
            }
        }

        // Initialize Collection with explicit parameters
        public entry fun initialize_collection(
            creator: &signer,
            name: String,
            description: String,
            uri: String
        ) acquires Collections {
            let account = borrow_global_mut<Collections>(signer::address_of(creator));
            let collection = Collection {
                description,
                name,
                uri,
                creator: signer::address_of(creator)
            };
            vector::push_back(&mut account.collections, collection);
            // Create an unlimited collection with no royalty
            collection::create_unlimited_collection(
                creator,
                description,
                name,
                option::none(),
                uri
            );

        }

        // Mint NFT to a specific collection
        public entry fun mint_nft(
            creator: &signer,
            collection_name: String,
            token_name: String,
            description: String,
            token_uri: String,
            rarity: u8,
            royalty: u8,
        ) acquires Marketplace {
            // Generate a unique token
            let marketplace = borrow_global_mut<Marketplace>(@NFTMarketplace);
            let token_constructor_ref = token::create_named_token(
                creator,
                collection_name,
                description,
                token_name,
                option::none(),
                token_uri,
            );

            let token_signer = object::generate_signer(&token_constructor_ref);
            let transfer_ref = object::generate_transfer_ref(&token_constructor_ref);
            let token_object = object::object_from_constructor_ref<token::Token>(&token_constructor_ref);

            // Create the NFT struct
            let new_nft = NFT {
                id: vector::length(&marketplace.nfts),
                owner: signer::address_of(creator),
                creator: signer::address_of(creator),
                name: token_name,
                description,
                uri: token_uri,
                price: 0,
                for_sale: false,
                rarity,
                royalty,
                last_sold_price: 0,
                token: token_object,
                sale_type: 1,
                auction_duration: timestamp::now_seconds(),
                action_part: vector[],
            };

            let permission_ref = PermissionRef {
                transfer_ref,
            };

            // Get the marketplace
            vector::push_back(&mut marketplace.nfts, new_nft);
            object::transfer(creator, token_object, signer::address_of((creator)));

            move_to(
                &token_signer,
                permission_ref
            );
        }

        // Example function to demonstrate usage
        public entry fun create_and_mint_nft(
            creator: &signer,
            collection_name: String,
            collection_description: String,
            collection_uri: String,
            token_name: String,
            token_description: String,
            token_uri: String,
            rarity: u8,
            royalty: u8,
        ) acquires Marketplace, Collections {
            // Create the collection
            initialize_collection(
                creator,
                collection_name,
                collection_description,
                collection_uri
            );

            // Mint the NFT to the collection
            mint_nft(
                creator,
                collection_name,
                token_name,
                token_description,
                token_uri,
                rarity,
                royalty,
            );
        }

        // TODO# 9: View NFT Details
        #[view]
        public fun get_nft_details(marketplace_addr: address, nft_id: u64): (u64, address, String, String, String, u64, bool, u8) acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);

            (nft.id, nft.owner, nft.name, nft.description, nft.uri, nft.price, nft.for_sale, nft.rarity)
        }


        // TODO# 10: List NFT for Sale
        public entry fun list_for_sale(account: &signer, marketplace_addr: address, nft_id: u64, price: u64, sale_type: u8, duration: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.owner == signer::address_of(account), 100); // Caller is not the owner
            assert!(!nft_ref.for_sale, 101); // NFT is already listed
            assert!(price > 0, 102); // Invalid price

            nft_ref.for_sale = true;
            nft_ref.sale_type = sale_type;
            nft_ref.auction_duration = duration;
            nft_ref.price = price;
        }


        // TODO# 11: Update NFT Price
        public entry fun set_price(account: &signer, marketplace_addr: address, nft_id: u64, price: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.owner == signer::address_of(account), 200); // Caller is not the owner
            assert!(price > 0, 201); // Invalid price

            nft_ref.price = price;
        }


        // TODO# 12: Purchase NFT
        public entry fun purchase_nft(account: &signer, marketplace_addr: address, nft_id: u64, payment: u64) acquires Marketplace, PermissionRef {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);
            let token = nft_ref.token;

            assert!(nft_ref.for_sale, 400); // NFT is not for sale
            assert!(payment >= nft_ref.price, 401); // Insufficient payment

            // Calculate marketplace fee
            let fee = (nft_ref.price * MARKETPLACE_FEE_PERCENT) / 100;
            let seller_revenue = payment - fee;

            let royalty: u64 = 0;
            if (nft_ref.creator == nft_ref.owner && nft_ref.royalty > 0) {
                royalty =  ((nft_ref.royalty as u64) * seller_revenue) / 100
            };

            // Transfer payment to the seller and fee to the marketplace
            coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.owner, seller_revenue - royalty);
            coin::transfer<aptos_coin::AptosCoin>(account, marketplace_addr, fee);
            if (royalty > 0 && nft_ref.creator == nft_ref.owner) {
                coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.creator, royalty);
            };

            nft_ref.last_sold_price = payment;

            // Transfer ownership
            nft_ref.owner = signer::address_of(account);
            nft_ref.for_sale = false;
            nft_ref.price = 0;

            let permission_ref = borrow_global<PermissionRef>(object::object_address(&token));

            // generate linear transfer ref and transfer the token object
            let linear_transfer_ref = object::generate_linear_transfer_ref(&permission_ref.transfer_ref);
            object::transfer_with_ref(linear_transfer_ref, signer::address_of(account));
        }

        public entry fun make_offer(account: &signer, marketplace_addr: address, nft_id: u64, payment: u64) acquires  Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.sale_type == 2, 401);
            let auction_part = AuctionPart {
                user: signer::address_of(account),
                offer: payment,
            };

            vector::push_back(&mut nft_ref.action_part, auction_part);
        }

        public entry fun auction_end(account: &signer, marketplace_addr: address, nft_id: u64) acquires  Marketplace, PermissionRef {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.sale_type == 1, 601); // must be auction
            // Assert the auction has ended:
            // assert!(timestamp::now_seconds() >= nft_ref.auction_duration, 602);

            let length = vector::length(&nft_ref.action_part);
            assert!(length > 0, 603); // no offers made

            let auction_part = &mut nft_ref.action_part;
            let i = 0;
            let max_offer = 0;
            let winner_addr = nft_ref.owner;

            while (i < length) {
                let user = vector::borrow(&nft_ref.action_part, i);
                if (user.offer > max_offer) {
                    max_offer = user.offer;
                    winner_addr = user.user;
                };
                i = i + 1;
            };

            // Update NFT fields
            nft_ref.owner = winner_addr;

            nft_ref.for_sale = false;
            nft_ref.price = 0;

            let token = nft_ref.token;
            let permission_ref = borrow_global<PermissionRef>(object::object_address(&token));

            // Calculate marketplace fee
            let fee = (nft_ref.price * MARKETPLACE_FEE_PERCENT) / 100;
            let seller_revenue = max_offer - fee;

            let royalty: u64 = 0;
            if (nft_ref.creator == nft_ref.owner && nft_ref.royalty > 0) {
                royalty =  ((nft_ref.royalty as u64) * seller_revenue) / 100
            };

            // Transfer payment to the seller and fee to the marketplace
            coin::transfer<aptos_coin::AptosCoin>(account, marketplace_addr, fee);
            coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.owner, seller_revenue - royalty);
            if (royalty > 0 && nft_ref.creator == nft_ref.owner) {
                coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.creator, royalty);
            };

            // generate linear transfer ref and transfer the token object
            let linear_transfer_ref = object::generate_linear_transfer_ref(&permission_ref.transfer_ref);
            object::transfer_with_ref(linear_transfer_ref, signer::address_of(account));
        }


        // TODO# 13: Check if NFT is for Sale
        #[view]
        public fun is_nft_for_sale(marketplace_addr: address, nft_id: u64): bool acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);
            nft.for_sale
        }


        // TODO# 14: Get NFT Price
        #[view]
        public fun get_nft_price(marketplace_addr: address, nft_id: u64): u64 acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);
            nft.price
        }


        // TODO# 15: Transfer Ownership
        public entry fun transfer_ownership(account: &signer, marketplace_addr: address, nft_id: u64, new_owner: address) acquires PermissionRef, Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.owner == signer::address_of(account), 300); // Caller is not the owner
            assert!(nft_ref.owner != new_owner, 301); // Prevent transfer to the same owner

            let token = nft_ref.token;
            let permission_ref = borrow_global<PermissionRef>(object::object_address(&token));

            // generate linear transfer ref and transfer the token object
            let linear_transfer_ref = object::generate_linear_transfer_ref(&permission_ref.transfer_ref);
            object::transfer_with_ref(linear_transfer_ref, new_owner);

            // Update NFT ownership and reset its for_sale status and price
            nft_ref.owner = new_owner;
            nft_ref.for_sale = false;
            nft_ref.price = 0;
        }


        // TODO# 16: Retrieve NFT Owner
        #[view]
        public fun get_owner(marketplace_addr: address, nft_id: u64): address acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);
            nft.owner
        }


        // TODO# 17: Retrieve NFTs for Sale
        #[view]
        public fun get_all_nfts_for_owner(marketplace_addr: address, owner_addr: address, limit: u64, offset: u64): vector<NFT> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nfts = vector::empty<NFT>();

            let nfts_len = vector::length(&marketplace.nfts);
            let end = min(offset + limit, nfts_len);
            let mut_i = offset;
            while (mut_i < end) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.owner == owner_addr) {
                    vector::push_back(&mut nfts, *nft);
                };
                mut_i = mut_i + 1;
            };

            nfts
        }


        // TODO# 18: Retrieve NFTs for Sale
        #[view]
        public fun get_all_nfts_for_sale(marketplace_addr: address, limit: u64, offset: u64): vector<ListedNFT> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nfts_for_sale = vector::empty<ListedNFT>();

            let nfts_len = vector::length(&marketplace.nfts);
            let end = min(offset + limit, nfts_len);
            let mut_i = offset;
            while (mut_i < end) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.for_sale) {
                    let listed_nft = ListedNFT { id: nft.id, name: nft.name, sale_type: nft.sale_type, description: nft.description, owner: nft.owner, price: nft.price, rarity: nft.rarity, royalty: nft.royalty, auction_duration: nft.auction_duration, action_part: nft.action_part, uri: nft.uri };
                    vector::push_back(&mut nfts_for_sale, listed_nft);
                };
                mut_i = mut_i + 1;
            };

            nfts_for_sale
        }

        // TODO# 18: Retrieve Colections
        #[view]
        public fun get_all_collections_by_user(account: address, limit: u64, offset: u64): vector<Collection> acquires Collections {
            let collections = borrow_global<Collections>(account);
            collections.collections
        }

        // TODO# 19: Define Helper Function for Minimum Value
        // Helper function to find the minimum of two u64 numbers
        public fun min(a: u64, b: u64): u64 {
            if (a < b) { a } else { b }
        }


        // TODO# 20: Retrieve NFTs by Rarity
        // New function to retrieve NFTs by rarity
        #[view]
        public fun get_nfts_by_rarity(marketplace_addr: address, rarity: u8): vector<u64> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft_ids = vector::empty<u64>();

            let nfts_len = vector::length(&marketplace.nfts);
            let mut_i = 0;
            while (mut_i < nfts_len) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.rarity == rarity) {
                    vector::push_back(&mut nft_ids, nft.id);
                };
                mut_i = mut_i + 1;
            };

            nft_ids
        }
    }
}
