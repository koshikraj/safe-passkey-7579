import { expect } from 'chai'
import { deployments, ethers } from 'hardhat'
import { utils } from 'ethersv5';
import { getTestSafe, getEntryPoint, getTestToken, getSafe7579, getWebAuthnModule } from '../utils/setup'
import { logGas } from '../../src/utils/execution'
import {
  buildUnsignedUserOpTransaction,
} from '../../src/utils/userOp'
import execSafeTransaction from '../utils/execSafeTransaction';
import { ZeroAddress } from 'ethers';
import { Hex, pad } from 'viem'
import { get } from 'http'
import { createDummySignatrue, createEnableData } from '../utils/passkey';

const ECDSA = require('ecdsa-secp256r1')


describe('WebAuthn - Basic tests', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()

    const [user1, user2, relayer] = await ethers.getSigners()
    let entryPoint = await getEntryPoint()

    entryPoint = entryPoint.connect(relayer)
    const webAuthnModule = await getWebAuthnModule()
    const safe7579 = await getSafe7579()
    const testToken = await getTestToken()
    const safe = await getTestSafe(user1, await safe7579.getAddress(), await safe7579.getAddress())

    return {
      testToken,
      user1,
      user2,
      safe,
      relayer,
      webAuthnModule,
      safe7579,
      entryPoint,
    }
  })


    it('should add the webauthn validator and execute ops with error', async () => {
      const { user1, safe, webAuthnModule, safe7579, entryPoint, relayer } = await setupTests()

    await entryPoint.depositTo(await safe.getAddress(), { value: ethers.parseEther('1.0') })

    await user1.sendTransaction({ to: await safe.getAddress(), value: ethers.parseEther('1') })

    const call = {target: user1.address as Hex, value: ethers.parseEther('1'), callData: '0x' as Hex} // Added the callData property

    const privateKey = ECDSA.generateKey()

    const enableData = createEnableData(privateKey.asPublic().x.toString('hex'), privateKey.asPublic().y.toString('hex'), '0x4b6f930f5a2b8bcd0d1f7c6bfa2b9b5c8e10efcd3fb3e95f8ed8a9b65d703a4b')


    await execSafeTransaction(safe, await safe7579.initializeAccount.populateTransaction([], [], [], [], {registry: ZeroAddress, attesters: [], threshold: 0}));

    await execSafeTransaction(safe, {to: await safe.getAddress(), data:  ((await safe7579.installModule.populateTransaction(1, await webAuthnModule.getAddress(), enableData)).data as string), value: 0})

    const key = BigInt(pad(await webAuthnModule.getAddress() as Hex, {
        dir: "right",
        size: 24,
      }) || 0 
    )
    const currentNonce = await entryPoint.getNonce(await safe.getAddress(), key);


    let userOp = buildUnsignedUserOpTransaction(await safe.getAddress(), currentNonce, call)
    userOp.signature = createDummySignatrue();

    await expect(entryPoint.handleOps([userOp], user1.address))
    .to.be.revertedWithCustomError(entryPoint, 'FailedOpWithRevert')
    // .withArgs(0, 'AA24 signature error')

    })





  
})

function delay(timeout = 10000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
