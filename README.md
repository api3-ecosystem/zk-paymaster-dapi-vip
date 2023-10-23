# ETH BARCELONA BOUNTIES

[Bounty Description➚](https://vivacious-voyage-472.notion.site/API3-EthBarca-bc8d0456a2244bff9d648f20755e5cda).

# Paymaster Tutorial with API3 dAPIs w/ VIP NFT

This tutorial shows you how to build a custom paymaster that allows users to pay fees with a `mockUSDC` ERC20 token or feeless with a `VIPNFT`. You will:

- Create a paymaster that will take `mockUSDC` as gas to cover the transaction cost.

- Create the `mockUSDC` token contract and send some tokens to a new wallet.

- Create the `VIPNFT` token contract and send a token to a new wallet.

- Send a `greet` transaction to update the greeting from the newly created wallet via the paymaster. Although the transaction normally requires ETH to pay the gas fee, our paymaster executes the transaction in exchange for the same USDC value or for free if you hold the NFT.

- Utilize API3 Data Feeds within a paymaster.

- Show how you can give a free transaction for holders of the VIP NFT

## Using API3's self-funded dAPIs with zkSync paymaster example to pay gas fee in USDC on zkSync Era. 

[API3➚](https://api3.org/) is a collaborative project to deliver traditional API services to smart contract platforms in a decentralized and trust-minimized way. It is governed by a decentralized autonomous organization (DAO), namely the [API3 DAO](https://api3.org/dao).

API3 data feeds are known as [dAPIs➚](https://docs.api3.org/guides/dapis/subscribing-self-funded-dapis/). These provide access to on-chain data feeds sourced from off-chain first-party oracles owned and operated by API providers themselves. Data feeds are continuously updated by first-party oracles using signed data. [7 Minute Tutorial➚](https://www.youtube.com/watch?v=1ASnpYO66mw).

Within a paymaster, price oracles can be used to provide price data on-chain for execution.

[zkSync Paymaster➚](https://era.zksync.io/docs/dev/tutorials/custom-paymaster-tutorial.html#paymaster-contract-full-code)

**See the video Breakdown of this repo:**
[VIDEO OF ETH BARCELONA WORKSHOP➚](https://www.youtube.com/watch?v=ylhPNi0Bwek)

**For this paymaster tutorial, we will use dAPIs to get the price of ETH/USD and USDC/USD datafeeds and use it to calculate gas in USDC value so that users can pay for their transactions with USDC.**

## Project repo

The tutorial code is available [here](https://github.com/billyjitsu/zk-paymaster-dapi-vip)

## Set up the project

1. Fork this project and cd to zk-paymaster-dapi-vip, install the packages:

```sh
$ yarn install
```

2. After installation, run the following commands

```sh
$ yarn compile
```
3. Make sure to **add a private key in the .env** to be able to deploy the contracts


    PRIVATE_KEY=
   
   Then you can deploy the contracts
```sh
$ yarn deploy
```
4. You should get a console output that returns the information needed to input to the .env inputs to run the final script.  ex:
```sh
Empty wallet w/ NFTs address: 0x31465D670B57cC6EA8E73CC05EbA4601940b037A
'Empty wallet w/ NFTs private key: 0x95f3430d4310cc87b10df59216bc0f7ce2e064b103fb7678d08c0126367a13d1'
Empty wallets address: 0x1aBC620bEbDF2A20FD81789d1e2fc406733A7162
'Empty wallets private key: 0x5c2c8578f512ad53055946e545cc81ae815773ca9d8cb460ff5baa730c59ab58'
TOKEN address: 0x1AaA742a40634BF5d78171Bd933dcBf7f4AD8984
VIPNFT address: 0x1EeFA2A055a990f13b8F2b81EbD13AA04244d934
Paymaster address: 0x7b4e7fDf7eFBDc6641444B016104bb4D9fb39E46
dAPI Proxies Set!
Greeter contract address: 0x30C06792f0a16D8e6EF612B2E9993D71ECf09fb1
Minted 5k mUSDC for the empty wallet with NFT
Minted 5k mUSDC for the empty wallet not holding an NFT
Minted a VIP NFT for the empty wallet with NFT
Done!
```
5. You will input the fields you received into the .env file
```sh
PRIVATE_KEY=YOUR PRIVE KEY
EMPTY_WALLET_W_NFT_PRIVATE_KEY=
EMPTY_WALLET_NO_NFT_PRIVATE_KEY=
TOKEN_ADDRESS=
VIPNFT_ADDRESS=
PAYMASTER_ADDRESS=
GREETER_CONTRACT=
```
6. Once the data is complete run the use-paymaster script

```sh
$ yarn usePaymaster
```
7. You will receive the final output showcasing that use of USDC and the results of the wallet that holds the NFT and the transaction cost of the wallet that doesn't hold the NFT
```sh
ERC20 balance of the wallet with the NFT before tx: 5000000000000000000000
ERC20 balance of the wallet without the NFT before tx: 5000000000000000000000
********** Transaction for Wallet holding NFT **********
Estimated ETH FEE (gasPrice * gasLimit): 159932500000000
ETH/USD dAPI Value: 1846585000000000000000
USDC/USD dAPI Value: 1000014997016061000
Estimated USD FEE: 295324526525832484   
--Original message is: old greeting
--Updated message from first wallet in contract now is: This is a Free Transaction
********** Transaction for Wallet without NFT **********
Estimated ETH FEE (gasPrice * gasLimit): 199023750000000
Estimated USD FEE: 367508759858975836
--Latest message in contract from 2nd wallet now is: This Greeting Cost USDC
------------ Ending Result ----------------
USDC Balance of the wallet holding the NFT after tx: 5000000000000000000000
Transaction fee paid in USDC was 0
USDC Balance of the wallet with NO NFT after tx: 4999632491240141024164
Transaction fee paid in USDC was 367508759858975836
-------------------------------------------
Done in 12.39s.
```

:::tip
* Addresses and private keys are different on each run.
* Make sure you delete the `artifacts-zk` and `cache-zk` folders before recompiling.
:::

Reach out for questions:

https://api3.org/

Discord:
https://discord.com/invite/qnRrcfnm5W

Twitter: https://twitter.com/API3DAO

DevRel: https://twitter.com/wc49358