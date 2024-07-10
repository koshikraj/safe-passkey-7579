import { createPasskeyValidator, getPasskeyValidator } from "@zerodev/passkey-validator";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { createPublicClient, http } from "viem";
import { getChain } from "./permissionless";


const BUNDLER_URL =
"https://rpc.zerodev.app/api/v2/bundler/c90784d9-783d-4321-8726-f1b6fbbbf7e2"


const publicClient = createPublicClient({
  transport: http(BUNDLER_URL)
})



export async function login(chainId: string) {

//   const BUNDLER_URL =
// "https://rpc.zerodev.app/api/v2/bundler/c90784d9-783d-4321-8726-f1b6fbbbf7e2"

const chain = getChain(chainId);


const pimlicoEndpoint = `https://api.pimlico.io/v2/${chain.name.toLowerCase().replace(/\s+/g, '-')}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`;


const publicClient = createPublicClient({
  transport: http(pimlicoEndpoint)
})
  
  return await getPasskeyValidator(publicClient, {
        passkeyServerUrl: import.meta.env.VITE_PASSKEY_SERVER_URL,
        entryPoint: ENTRYPOINT_ADDRESS_V07
    })

}

export async function create(username: string, chainId: string) {
    // Logic for passkey registration

    const chain = getChain(chainId);
    
    const pimlicoEndpoint = `https://api.pimlico.io/v2/${chain.name.toLowerCase().replace(/\s+/g, '-')}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`;


    const publicClient = createPublicClient({
      transport: http(pimlicoEndpoint)
    })
  
        return await createPasskeyValidator(publicClient, {
        passkeyName: username,
        passkeyServerUrl: import.meta.env.VITE_PASSKEY_SERVER_URL,
        entryPoint: ENTRYPOINT_ADDRESS_V07
    })

}
