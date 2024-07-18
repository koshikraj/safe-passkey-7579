import { toPasskeyValidator, toWebAuthnKey, WebAuthnMode  } from "@zerodev/passkey-validator";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants"
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { createPublicClient, http } from "viem";
import { getChain } from "./permissionless";




export async function connectValidator(chainId: string, webAuthnKey: any) {


  const chain = getChain(chainId);
  
  
  const pimlicoEndpoint = `https://api.pimlico.io/v2/${chain.name.toLowerCase().replace(/\s+/g, '-')}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`;
  
  
  
  const publicClient = createPublicClient({
    transport: http(pimlicoEndpoint)
  })
  
    
    return  await toPasskeyValidator(publicClient, {
      webAuthnKey,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      kernelVersion: KERNEL_V3_1,
    })
  
  }
  



export async function connectPassKey(passkeyName: string, type: WebAuthnMode ) {

return await toWebAuthnKey({
  passkeyName,
  passkeyServerUrl: import.meta.env.VITE_PASSKEY_SERVER_URL,
  mode: type,
  passkeyServerHeaders: {}
})


}

// export async function create(username: string, chainId: string) {
//     // Logic for passkey registration

//     const chain = getChain(chainId);
    
//     const pimlicoEndpoint = `https://api.pimlico.io/v2/${chain.name.toLowerCase().replace(/\s+/g, '-')}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`;

//     const publicClient = createPublicClient({
//       transport: http(pimlicoEndpoint)
//     })


//     const webAuthnKey = await toWebAuthnKey({
//       passkeyName: "passkey name",
//       passkeyServerUrl: import.meta.env.VITE_PASSKEY_SERVER_URL,
//       mode: WebAuthnMode.Register,
//       passkeyServerHeaders: {}
//     })
    
      
//       return  await toPasskeyValidator(publicClient, {
//         webAuthnKey,
//         entryPoint: ENTRYPOINT_ADDRESS_V07,
//         kernelVersion: KERNEL_V3_1,
//       })

// }
