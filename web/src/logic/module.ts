import { Contract, ZeroAddress, getBytes} from "ethers";
import { ethers } from 'ethersv5';
import { BaseTransaction } from '@safe-global/safe-apps-sdk';
import { getJsonRpcProvider, getProvider } from "./web3";
import WebAuthnValidator from "./WebAuthnValidator.json"
import SafePassKeyNFT from "./SafePassKeyNFT.json"
import {  Address, Hex, pad } from "viem";
import {
    getClient,
    getModule,
    getAccount,
    installModule,
    isModuleInstalled,
    ModuleType,
  } from "@rhinestone/module-sdk";
import { NetworkUtil } from "./networks";
import { SafeSmartAccountClient, getSmartAccountClient } from "./permissionless";
import { KernelValidator } from "@zerodev/passkey-validator";
import { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types/entrypoint";
   


const webAuthnModule = "0xD990393C670dCcE8b4d8F858FB98c9912dBFAa06"
export const safePassKeyNFT = "0x18533043A3c158d97587d4Fb53E7E163a692E8CE"


export function generateRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}


/**
 * Generates a deterministic key pair from an arbitrary length string
 *
 * @param {string} string - The string to generate a key pair from
 * @returns {Object} - An object containing the address and privateKey
 */
export function generateKeysFromString(string: string) {
    const privateKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(string)) // v5
    const wallet = new ethers.Wallet(privateKey)
    return {
        address: wallet.address,
        privateKey: privateKey,
    }
}




export const getWebAuthn = async (chainId: string, account: string): Promise<any> => {

    const provider = await getJsonRpcProvider(chainId)

    const webAuthnValidator = new Contract(
        webAuthnModule,
        WebAuthnValidator.abi,
        provider
    )


    const webAuthnData = await webAuthnValidator.webAuthnValidatorStorage(account);

    return webAuthnData;

}

export const getSafePassNFTCount = async (chainId: string, account: string): Promise<any> => {

    const provider = await getJsonRpcProvider(chainId)

    const safePassKey = new Contract(
        safePassKeyNFT,
        SafePassKeyNFT.abi,
        provider
    )


    const safePassKeyCount = await safePassKey.balanceOf(account);

    return safePassKeyCount;

}


export const sendTransaction = async (chainId: string, recipient: string, amount: bigint, data: Hex, walletProvider: any, safeAccount: Hex): Promise<any> => {

    const call = { to: recipient as Hex, value: amount, data: data }

    const key = BigInt(pad(webAuthnModule as Hex, {
        dir: "right",
        size: 24,
      }) || 0
    )

    console.log(walletProvider)
    const validators = await isInstalled(parseInt(chainId), safeAccount, webAuthnModule, 'validator') ? [] : [{ address: walletProvider.address, context: await walletProvider.getEnableData()}]

    const smartAccount = await getSmartAccountClient( { chainId, nonceKey: key, address: safeAccount, signUserOperation: walletProvider.signUserOperation, getDummySignature: walletProvider.getDummySignature, validators: validators})

    return await smartAccount.sendTransaction(call);
}



const buildInstallModule = async (chainId: number, safeAccount: Address, address: Address, type: ModuleType, initData: Hex): Promise<BaseTransaction> => {


    const client = getClient({ rpcUrl: NetworkUtil.getNetworkById(chainId)?.url!});

    // Create the account object
    const account = getAccount({
            address: safeAccount,
            type: "safe",
        });


    const module = getModule({
        module: address,
        data: initData,
        type:  type,
      });

    const executions = await installModule({
        client,
        account,
        module,
      });


      return {to: executions[0].target, value: executions[0].value.toString() , data: executions[0].callData}

}



export const isInstalled = async (chainId: number, safeAddress: Address, address: Address, type: ModuleType): Promise<boolean> => {



    const client = getClient({ rpcUrl: NetworkUtil.getNetworkById(chainId)?.url!});


    // Create the account object
    const account = getAccount({
            address: safeAddress,
            type: "safe",
        });


    const module = getModule({
        module: address,
        data: '0x',
        type:  type ,
      });

     
    try {  
    return await isModuleInstalled({
        client,
        account,
        module,
      });
    }
    catch {
        return false;
    }

}


export const addWebAuthnModule = async (safeClient: SafeSmartAccountClient, passKeyValidator: KernelValidator<ENTRYPOINT_ADDRESS_V07_TYPE>) => {


    const buildWebAuthnModule = await buildInstallModule(safeClient.chain.id, safeClient.account.address, webAuthnModule, 'validator', await passKeyValidator.getEnableData() )

    await safeClient.sendTransaction({to: buildWebAuthnModule.to as Hex, value: BigInt(buildWebAuthnModule.value), data: buildWebAuthnModule.data as Hex})
    
}