import { ContractFactory, Provider, utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { getDeployedContracts } from "zksync-web3/build/src/utils";

require("dotenv").config();

// Put the address of the deployed paymaster and the Greeter Contract in the .env file
const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS || "";
const GREETER_CONTRACT_ADDRESS = process.env.GREETER_CONTRACT || "";

// Put the address of the ERC20 token and ERC1155 NFT in the .env file:
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "";
const VIPNFT_ADDRESS = process.env.VIPNFT_ADDRESS || "";

function getToken(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("MyERC20");
  return new ethers.Contract(TOKEN_ADDRESS, artifact.abi, wallet);
}

function getNFT(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("VIPNFT");
  return new ethers.Contract(VIPNFT_ADDRESS, artifact.abi, wallet);
}

// Greeter contract
function getGreeter(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("Greeter");
  return new ethers.Contract(GREETER_CONTRACT_ADDRESS, artifact.abi, wallet);
}

// Wallet private key
// ⚠️ Never commit private keys to file tracking history, or your account could be compromised.
const EMPTY_WALLET_W_NFT_PRIVATE_KEY = process.env.EMPTY_WALLET_W_NFT_PRIVATE_KEY || "";
const EMPTY_WALLET_NO_NFT_PRIVATE_KEY = process.env.EMPTY_WALLET_NO_NFT_PRIVATE_KEY || "";

export default async function (hre: HardhatRuntimeEnvironment) {
    const provider = new Provider("https://testnet.era.zksync.dev");
    const emptyWalletWithNFT = new Wallet(EMPTY_WALLET_W_NFT_PRIVATE_KEY, provider);
    const emptyWalletNONFT = new Wallet(EMPTY_WALLET_NO_NFT_PRIVATE_KEY, provider);

  // Obviously this step is not required, but it is here purely to demonstrate that indeed the wallet has no ether.
  const ethBalance = await emptyWalletWithNFT.getBalance();
    if (!ethBalance.eq(0)) {
      throw new Error("The wallet with NFT is not empty");
    }
  
  const ethBalanceNoNFT = await emptyWalletNONFT.getBalance();
    if (!ethBalanceNoNFT.eq(0)) {
      throw new Error("The No NFT wallet is not empty");
    }

  const erc20Balance = await emptyWalletWithNFT.getBalance(TOKEN_ADDRESS);
  console.log(`ERC20 balance of the wallet with the NFT before tx: ${erc20Balance}`);

  const erc20BalanceNoNFT = await emptyWalletNONFT.getBalance(TOKEN_ADDRESS);
  console.log(`ERC20 balance of the wallet without the NFT before tx: ${erc20BalanceNoNFT}`);

  console.log("********** Transaction for Wallet holding NFT **********");
  /********** Transaction for Wallet with NFT **********/
  const greeter = getGreeter(hre, emptyWalletWithNFT);
  const erc20 = getToken(hre, emptyWalletWithNFT);

  const gasPrice = await provider.getGasPrice();

  // Loading the Paymaster Contract
  const deployer = new Deployer(hre, emptyWalletWithNFT);
  const paymasterArtifact = await deployer.loadArtifact("MyPaymaster");

  const PaymasterFactory = new ContractFactory(
    paymasterArtifact.abi,
    paymasterArtifact.bytecode,
    deployer.zkWallet
  );
  const PaymasterContract = PaymasterFactory.attach(PAYMASTER_ADDRESS);

  // Estimate gas fee for the transaction
  const gasLimit = await greeter.estimateGas.setGreeting(
    "This is a Free Transaction",
    {
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams: utils.getPaymasterParams(PAYMASTER_ADDRESS, {
          type: "ApprovalBased",
          token: TOKEN_ADDRESS,
          // Set a large allowance just for estimation
          minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
          // Empty bytes as testnet paymaster does not use innerInput
          innerInput: new Uint8Array(),
        }),
      },
    }
  );

  // Gas estimation:
  const fee = gasPrice.mul(gasLimit.toString());
  console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${fee}`);

  // Calling the dAPI to get the ETH price:
  const ETHUSD = await PaymasterContract.readDapi(
    "0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b"
  );
  const USDCUSD = await PaymasterContract.readDapi(
    "0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB"
  );

  console.log(`ETH/USD dAPI Value: ${ETHUSD}`);
  console.log(`USDC/USD dAPI Value: ${USDCUSD}`);

  // Calculating the USD fee:
  const usdFee = fee.mul(ETHUSD).div(USDCUSD);
  console.log(`Estimated USD FEE: ${usdFee}`);

  console.log(`--Original message is: ${await greeter.greet()}`);

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: "ApprovalBased",
    token: TOKEN_ADDRESS,
    // set minimalAllowance to the estimated fee in erc20
    minimalAllowance: ethers.BigNumber.from(usdFee),
    // empty bytes as testnet paymaster does not use innerInput
    innerInput: new Uint8Array(),
  });

  await (
    await greeter
      .connect(emptyWalletWithNFT)
      .setGreeting("This is a Free Transaction", {
        // specify gas values
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: 0,
        gasLimit: gasLimit,
        // paymaster info
        customData: {
          paymasterParams: paymasterParams,
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      })
  ).wait();
  /************************************************/

  console.log(`--Updated message from first wallet in contract now is: ${await greeter.greet()}`);
  console.log("********** Transaction for Wallet without NFT **********");

  /********** Transaction for Wallet with out the  NFT **********/
  const greeterNoNFT = getGreeter(hre, emptyWalletNONFT);
  const erc20NoNFT = getToken(hre, emptyWalletNONFT);

  const gasPriceNoNFT = await provider.getGasPrice();

  // Loading the Paymaster Contract
  const deployerNoNFT = new Deployer(hre, emptyWalletNONFT);
  const paymasterArtifactNoNFT = await deployerNoNFT.loadArtifact("MyPaymaster");

  const PaymasterFactoryNoNFT = new ContractFactory(
    paymasterArtifactNoNFT.abi,
    paymasterArtifactNoNFT.bytecode,
    deployerNoNFT.zkWallet
  );
  const PaymasterContractNoNFT = PaymasterFactoryNoNFT.attach(PAYMASTER_ADDRESS);

  // Estimate gas fee for the transaction
  const gasLimitNoNFT = await greeterNoNFT.estimateGas.setGreeting(
    "This Greeting Cost USDC",
    {
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams: utils.getPaymasterParams(PAYMASTER_ADDRESS, {
          type: "ApprovalBased",
          token: TOKEN_ADDRESS,
          // Set a large allowance just for estimation
          minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
          // Empty bytes as testnet paymaster does not use innerInput
          innerInput: new Uint8Array(),
        }),
      },
    }
  );

  // Gas estimation:
  const feeNoNFT = gasPriceNoNFT.mul(gasLimitNoNFT.toString());
  console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${feeNoNFT}`);

  // Calling the dAPI to get the ETH price:
  const ETHUSDNONFT = await PaymasterContractNoNFT.readDapi(
    "0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b"
  );
  const USDCUSDNONFT = await PaymasterContractNoNFT.readDapi(
    "0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB"
  );

  // Calculating the USD fee:
  const usdFeeNoNFT = feeNoNFT.mul(ETHUSDNONFT).div(USDCUSDNONFT);
  console.log(`Estimated USD FEE: ${usdFeeNoNFT}`);

  //console.log(`Current message is: ${await greeterNoNFT.greet()}`);

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParamsNoNFT = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: "ApprovalBased",
    token: TOKEN_ADDRESS,
    // set minimalAllowance to the estimated fee in erc20
    minimalAllowance: ethers.BigNumber.from(usdFeeNoNFT),
    // empty bytes as testnet paymaster does not use innerInput
    innerInput: new Uint8Array(),
  });

  await (
    await greeter
      .connect(emptyWalletNONFT)
      .setGreeting("This Greeting Cost USDC", {
        // specify gas values
        maxFeePerGas: gasPriceNoNFT,
        maxPriorityFeePerGas: 0,
        gasLimit: gasLimitNoNFT,
        // paymaster info
        customData: {
          paymasterParams: paymasterParamsNoNFT,
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      })
  ).wait();
  /************************************************/
  
  // Check latest Message from the contract
  console.log(`--Latest message in contract from 2nd wallet now is: ${await greeterNoNFT.greet()}`);

  //Check balances
  const newERC20BalanceWithNFT = await emptyWalletWithNFT.getBalance(TOKEN_ADDRESS);
  const newERC20BalanceNoNFT = await emptyWalletNONFT.getBalance(TOKEN_ADDRESS);
  
  //Log out the balances of USDC used for the transaction
  console.log("------------ Ending Result ----------------");
  console.log(`USDC Balance of the wallet holding the NFT after tx: ${newERC20BalanceWithNFT}`);
  console.log(`Transaction fee paid in USDC was ${erc20Balance.sub(newERC20BalanceWithNFT)}`);

  console.log(`USDC Balance of the wallet with NO NFT after tx: ${newERC20BalanceNoNFT}`);
  console.log(`Transaction fee paid in USDC was ${erc20BalanceNoNFT.sub(newERC20BalanceNoNFT)}`);
  console.log("-------------------------------------------");

  
}
