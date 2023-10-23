import { utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

require('dotenv').config();

// load wallet private key from env file
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

export default async function (hre: HardhatRuntimeEnvironment) {
  // The wallet that will deploy the token and the paymaster
  // It is assumed that this wallet already has sufficient funds on zkSync
  // ⚠️ Never commit private keys to file tracking history, or your account could be compromised.

  const wallet = new Wallet(PRIVATE_KEY);
  // The wallet that will receive ERC20 & ERC1155 tokens
  const emptyWallet = Wallet.createRandom();
  console.log(`Empty wallet w/ NFT's address: ${emptyWallet.address}`);
  console.log(`Empty wallet w/ NFT's private key: ${emptyWallet.privateKey}`);

  // The wallet that will just receive ERC20 tokens and will pay gas
  const emptyWalletNoNFT = Wallet.createRandom();
  console.log(`Empty wallet's address: ${emptyWalletNoNFT.address}`);
  console.log(`Empty wallet's private key: ${emptyWalletNoNFT.privateKey}`);

  const deployer = new Deployer(hre, wallet);

  // Deploying the ERC20 token
  const erc20Artifact = await deployer.loadArtifact("MyERC20");
  const erc20 = await deployer.deploy(erc20Artifact, ["USDC", "USDC", 18]);
  console.log(`TOKEN address: ${erc20.address}`);

  // Deploying the 1155 NFT token
  const erc1155Artifact = await deployer.loadArtifact("VIPNFT");
  const erc1155 = await deployer.deploy(erc1155Artifact);
  console.log(`VIPNFT address: ${erc1155.address}`);

  // Deploying the paymaster
  const paymasterArtifact = await deployer.loadArtifact("MyPaymaster");
  const paymaster = await deployer.deploy(paymasterArtifact, [erc20.address, erc1155.address]);
  console.log(`Paymaster address: ${paymaster.address}`);

  // Supplying paymaster with ETH.
  await (
    await deployer.zkWallet.sendTransaction({
      to: paymaster.address,
      value: ethers.utils.parseEther("0.05"),
    })
  ).wait();

  // Setting the dAPIs in Paymaster. Head over to the API3 Market (https://market.api3.org) to verify dAPI proxy contract addresses and whether they're funded or not.
    const ETHUSDdAPI = "0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b";
    const USDCUSDdAPI = "0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB";
  const setProxy = paymaster.setDapiProxy(USDCUSDdAPI, ETHUSDdAPI)
  await (await setProxy).wait()
  console.log("dAPI Proxies Set!")

  // Deploying the Greeter contract
  const greeterContractArtifact = await deployer.loadArtifact("Greeter");
  const oldGreeting = "old greeting"
  const deployGreeter = await deployer.deploy(greeterContractArtifact, [oldGreeting]);
  console.log(`Greeter contract address: ${deployGreeter.address}`);

  // Supplying the ERC20 tokens to the empty wallets:
  await // We will give the empty wallet with the NFT 5k mUSDC:
  (await erc20.mint(emptyWallet.address, "5000000000000000000000")).wait();
  console.log("Minted 5k mUSDC for the empty wallet with NFT");

  await
  (await erc20.mint(emptyWalletNoNFT.address, "5000000000000000000000")).wait();
  console.log("Minted 5k mUSDC for the empty wallet not holding an NFT");

  await // We will give the empty wallet a VIP NFT:
  (await erc1155.mint(emptyWallet.address)).wait();
  console.log("Minted a VIP NFT for the empty wallet with NFT");
  

  console.log(`Done!`);
}