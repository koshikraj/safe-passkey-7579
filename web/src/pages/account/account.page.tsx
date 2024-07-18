import { Text, ActionIcon, Anchor, Avatar, Badge, Button, CopyButton, Divider, Input, Modal, Paper, rem, Tooltip, InputBase, Combobox, useCombobox, Group, Notification, Skeleton, Timeline, Stack, Image, Loader, Pill, Indicator } from '@mantine/core';
import classes from './account.module.css';
import { useEffect, useState } from 'react';
import useLinkStore from '@/store/link/link.store';
import { formatEther, parseEther, parseUnits, ZeroAddress } from 'ethers';
import { buildMintNFT, buildTransferToken, getTokenBalance, getTokenDecimals } from '@/logic/utils';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck, IconChevronDown, IconCoin, IconCopy, IconFingerprint, IconPhoto, IconShieldCheck, IconUserCheck, IconX } from '@tabler/icons';
import { NetworkUtil } from '@/logic/networks';
import { getIconForId, getTokenInfo, getTokenList, tokenList } from '@/logic/tokens';
import { getJsonRpcProvider } from '@/logic/web3';

import { getSafePassNFTCount, isInstalled, safePassKeyNFT, sendTransaction } from '@/logic/module';
import {  loadPasskey, removePasskey, storeAccountInfo, storePasskey } from '@/utils/storage';

import Passkey from '../../assets/icons/passkey.svg';
import PasskeyWhite from '../../assets/icons/passkey-white.svg';
import PasskeyGreen from '../../assets/icons/passkey-green.svg';
import SafePassKeyNFT from '../../assets/icons/SafePassKeyNFT.svg';
import NotFound from '../../assets/icons/not-found.jpg';


import SafePasskey from '../../assets/icons/safe-passkey.svg';

import { SafeSmartAccountClient, getSmartAccountClient, waitForExecution } from '@/logic/permissionless';
import { privateKeyToAccount } from 'viem/accounts';
import { connectPassKey, connectValidator } from '@/logic/passkey';
import { IconTransfer } from '@tabler/icons-react';
import { Hex } from 'viem';
import { WebAuthnMode } from '@zerodev/passkey-validator';




export const AccountPage = () => {

  
  const { claimDetails, accountDetails, setAccountDetails, setConfirming, chainId, setChainId } = useLinkStore((state: any) => state);
  const [ balance, setBalance ] = useState<any>(0);
  const [opened, { open, close }] = useDisclosure(!accountDetails.account);
  const [sendModal, setSendModal] = useState(false);
  const [passkey, setPasskey] = useState<any>(loadPasskey());
  const [mintModal, setMintModal] = useState(false);
  const [tokenValue, setTokenValue] = useState(0);
  const [sendAddress, setSendAddress] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [ error, setError ] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [nftBalance, setNftBalance] = useState(0);
  const [sendLoader, setSendLoader] = useState(false);
  const [accountClient, setAccountClient] = useState<SafeSmartAccountClient>();
  const [ authenticating, setAuthenticating ] = useState(false);
  const [ creating, setCreating ] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [value, setValue] = useState<string>("0x0000000000000000000000000000000000000000");
  const [walletProvider, setWalletProvider] = useState<any>();

  

  const availableTestChains = Object.keys(tokenList).filter(chainId => NetworkUtil.getNetworkById(
    Number(chainId)
  )?.type == 'testnet').map(
    (chainId: string) => 
    ({label: `${NetworkUtil.getNetworkById(Number(chainId))?.name}`, type: `${NetworkUtil.getNetworkById(
      Number(chainId)
    )?.type}`, image: getIconForId(chainId), value: chainId }))

    const availableMainnetChains = Object.keys(tokenList).filter(chainId => NetworkUtil.getNetworkById(
      Number(chainId)
    )?.type == 'mainnet').map(
      (chainId: string) => 
      ({label: `${NetworkUtil.getNetworkById(Number(chainId))?.name}`, type: `${NetworkUtil.getNetworkById(
        Number(chainId)
      )?.type}`, image: getIconForId(chainId), value: chainId }))
  
  
  const mainnetOptions = availableMainnetChains.map((item: any) => (
    <Combobox.Option value={item.value} key={item.value}>
      <SelectOption {...item} />
    </Combobox.Option>
  ));

  const testnetOptions = availableTestChains.map((item: any) => (
    <Combobox.Option value={item.value} key={item.value}>
      <SelectOption {...item} />
    </Combobox.Option>
  ));

  const options = (<Combobox.Options>
          <Combobox.Group >
            {mainnetOptions}
          </Combobox.Group>

          <Combobox.Group label="TESTNETS">
          {testnetOptions}
          </Combobox.Group>
        </Combobox.Options>)

  const chainCombobox = useCombobox({
    onDropdownClose: () => chainCombobox.resetSelectedOption(),
  });
  const tokenCombobox = useCombobox({
    onDropdownClose: () => tokenCombobox.resetSelectedOption(),
  });

  interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
    image: string
    label: string
    description: string
  }
  

  function SelectOption({ image, label }: ItemProps) {
    return (
      <Group style={{width: '100%'}}>
        <Avatar src={image} >
        <IconCoin size="1.5rem" />
        </Avatar>
        <div >
          <Text fz="sm" fw={500}>
            {label}
          </Text>
        </div>
      </Group>
    );
  }


  const selectedToken = getTokenInfo(chainId, value);

  const tokenOptions = getTokenList(chainId).map((item: any) => (
    <Combobox.Option value={item.value} key={item.value}>
      <TokenOption {...item} />
    </Combobox.Option>
  ));

  interface TokenProps extends React.ComponentPropsWithoutRef<'div'> {
    image: string
    label: string
    description: string
  }

   
  function TokenOption({ image, label }: TokenProps) {
    return (
      <Group style={{width: '100%'}}>
        <Avatar src={image} >
        <IconCoin size="1.5rem" />
        </Avatar>
        <div >
          <Text fz="sm" fw={500}>
            {label}
          </Text>
        </div>
      </Group>
    );
  }

  async function sendAsset() {

    setError(false);
    setSendSuccess(false);
    setSendLoader(true);
    try {


    let parseAmount, data='0x', toAddress = sendAddress ;
    if(value == ZeroAddress) {
            parseAmount = parseEther(tokenValue.toString());
        } else {
          const provider = await getJsonRpcProvider(chainId.toString())
            parseAmount = parseUnits(tokenValue.toString(), await  getTokenDecimals(value, provider))
            data = await buildTransferToken(value, toAddress, parseAmount, provider)
            parseAmount = 0n;
            toAddress = value;
        }
    const result = await sendTransaction(chainId.toString(), toAddress, parseAmount, '0x', walletProvider!, accountDetails.account)
    if (!result)
    setSendSuccess(false);
    else {
    setSendSuccess(true);
    setConfirming(true);
    // await waitForExecution(chainId.toString(), result);
    setConfirming(false);
    }
    
    
  } catch(e) {
    console.log('error', e)
    setError(true);
    setSendLoader(false);  
  }  
  setSendLoader(false);
  }

  async function MintNFT() {

    setError(false);
    setSendSuccess(false);
    setSendLoader(true);
    try {

      const provider = await getJsonRpcProvider(chainId.toString())
      const data = await buildMintNFT(safePassKeyNFT, provider)
      const result = await sendTransaction(chainId.toString(), safePassKeyNFT, 0n, data as Hex, walletProvider!, accountDetails.account)
      if (!result)
      setSendSuccess(false);
      else {
      setSendSuccess(true);
      setConfirming(true);
      setConfirming(false);
    } 
    
  } catch(e) {
    console.log('error', e)
    setError(true);
    setSendLoader(false);  
  }  
  setSendLoader(false);
  }




  useEffect(() => {
    (async () => {


      let validator = walletProvider
      if(!walletProvider && passkey.authenticatorId) {
        validator = await connectValidator(chainId, passkey)
        setWalletProvider(validator)

      }

      if (validator) {
        try {
          const accountClient = await getSmartAccountClient({ chainId, validators: [{ address: validator.address, context: await validator.getEnableData()}]})
          const account = accountClient.account.address
  
          setAccountDetails({ account: account, address: '', privateKey: '' })
          setNftBalance(await getSafePassNFTCount(chainId, account))
          setAccountClient(accountClient)
          setBalanceLoading(true);
          const provider = await getJsonRpcProvider(chainId.toString());
    
          if(value == ZeroAddress) {
            setBalance(formatEther(await provider.getBalance(account )))
            } else {
            setBalance(await getTokenBalance(value, claimDetails?.account?.address , provider))
            }
          setBalanceLoading(false);
        }
        catch(e) {
          console.log(e)

        }
      }
  

      

      window.addEventListener('resize', () => setDimensions({ width: window.innerWidth, height: window.innerHeight }));
      
    })();
  }, [ walletProvider, chainId, sendSuccess, value, sendLoader]);


  
  function shortenAddress(address: any) {
    const start = address.slice(0, 7);
    const end = address.slice(-5);
    return `${start}...${end}`;
  }
  return (
    <>
      <Modal opened={ !passkey.authenticatorId } onClose={()=> {}} title="Authenticate your Account" centered withCloseButton={false}>

<div className={classes.formContainer}>
      <div>
        <h1 className={classes.heading}>Use Safe Account via PassKey
</h1>
      </div>
      <p className={classes.subHeading}>
        Create a new Safe using a new PassKey
      </p>
      <div className={classes.accountInputContainer}>
      
       <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            marginBottom: '20px',
            alignItems: 'center',
          }}
        >

    
      <Button
        type="button"
        variant="outline"
        size="lg" radius="md" 
        fullWidth
        color="green"
        loading={ creating }
        leftSection={<Avatar src={PasskeyGreen} size='sm' />}
        loaderProps={{ color: 'green', type: 'dots', size: 'md' }}
        style={{
          marginLeft: "20px"}}
        onClick={ async() => { 

        try {  
        setCreating(true); 
        const passkey =  await connectPassKey(`Safe PassKey ${new Date().toLocaleDateString('en-GB')}`, WebAuthnMode.Register)
        storePasskey(passkey)
        setWalletProvider(await connectValidator(chainId, passkey))
        setPasskey(passkey);
        storeAccountInfo("", "", "");
        setAccountDetails({});
        setCreating(false); 
      }
      catch(e) {
        setCreating(false);
      }
      }}
        
      
      >
      Create new PassKey
      </Button>
      </div>

      <Divider my="xs" label="OR" labelPosition="center" />

      <p className={classes.subHeading}>
       Connect existing Safe using an existing PassKey
      </p>

        
      <div
          style={{
            display: 'flex',
            marginTop: '20px',
            marginBottom: '20px',
            alignItems: 'center',
            justifyContent: 'center',

          }}
        >
          
      <Button
        size="lg" radius="md" 
        type="button"
        fullWidth
        color="green"
        className={classes.btn}
        loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
        leftSection={<Avatar src={PasskeyWhite} size='sm' />}
        onClick={ async() => { 
        setAuthenticating(true); 
          
        try {  
        const passkey =  await connectPassKey('SafePassKey', WebAuthnMode.Login)
        console.log(passkey)

        storePasskey(passkey)
        setWalletProvider(await connectValidator(chainId, passkey))

        setPasskey(passkey);
        setAuthenticating(false); 

        } 
        catch(e) {
          console.log(e)
          setAuthenticating(false);
        }
        }}
        loading={ authenticating}
      >

      Use existing PassKey
      </Button>
      </div>   
      </div>
    </div>
  
</Modal>

  <Modal  overlayProps={{
          backgroundOpacity: 0.55,
          blur: 7}} size={600} opened={opened && passkey.authenticatorId} onClose={()=>{}} title="Authenticate your Safe Account" centered withCloseButton={false}>

  <div className={classes.formContainer} >
      <div>
        <h1 className={classes.heading}>Use Safe Account via PassKey</h1>
      </div>


      <div className={classes.accountInputContainer}>
      {<Timeline
      active={2} 
      bulletSize={30} 
      lineWidth={1}
      color='green'
    >

    <Timeline.Item
        bullet={<IconShieldCheck style={{ width: rem(18), height: rem(18) }} />}
        title="Your Safe Account"
      >




            <Group
            style={{
              display: 'flex',
              marginTop: '20px',
              gap: '20px',
              marginBottom: '20px',
              alignItems: 'center',
              // justifyContent: 'center',

            }}
          >
           <Group wrap="nowrap">
           <Avatar
             src="https://pbs.twimg.com/profile_images/1643941027898613760/gyhYEOCE_400x400.jpg"
             size={50}
             radius="md"
           />
   
            { accountDetails.account ?
            
             <Group wrap="nowrap" gap={10} mt={3}>
             <CopyButton value={accountDetails.account} timeout={1000}>
                 {({ copied, copy }) => (
                   <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                     <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                       {copied ? (
                         <IconCheck style={{ width: rem(16) }} />
                       ) : (
                         <IconCopy style={{ width: rem(16) }} />
                       )}
                     </ActionIcon>
                   </Tooltip>
                 )}
               </CopyButton>
               <Text fz="sm" c="dimmed">
               {shortenAddress( accountDetails.account ? accountDetails.account : ZeroAddress)}
               </Text>
               <Button
        size="sm" 
        radius="md"
        color='red'
        variant='light'         
        fullWidth
        loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
        onClick={ async() => { 
        
        try {  
        removePasskey()
        setPasskey({})
        } 
        catch(e) {
          console.log(e)
        }
   
        }}
      >
      Logout
      </Button>
        </Group> : 
             <Skeleton height={18} width={180} mt={6} radius="xl" />
          }
         </Group>
         </Group>
          
    </Timeline.Item>
      <Timeline.Item
        bullet={<IconFingerprint style={{ width: rem(18), height: rem(18) }} />}
        title="PassKey for your Safe"
      
      >

      {accountDetails.account && <Stack
          style={{
            display: 'flex',
            marginTop: '20px',
            gap: '20px',
            marginBottom: '20px',
            // alignItems: 'center',
          }}
        >

      <Text fz="sm" fw={500} className={classes.name}  c="dimmed">
        Successfully connected passkey to Safe
        </Text>
        
        <Image
          src={ SafePasskey }
          radius="md"
          w={150}
        />      

      </Stack> 
      }

      { !accountDetails.account && <Stack
          style={{
            display: 'flex',
            marginTop: '20px',
            gap: '20px',
            marginBottom: '20px',
            // alignItems: 'center',
          }}
        >

      <Text fz="sm" fw={500} className={classes.name}  c="dimmed">
        Loading passkey on your Safe ...
        </Text>
        
        <Loader color="green" type="bars" />    

      </Stack> 
      }


      </Timeline.Item>

    </Timeline>
    }

      <div
          style={{
            display: 'flex',
            marginTop: '20px',
            marginBottom: '20px',
            alignItems: 'center',
            justifyContent: 'center',

          }}
        >

      <Button
        size="lg" 
        radius="md"         
        fullWidth
        className={!accountDetails.account ?  "" : classes.btn}
        disabled={ !accountDetails.account}  
        loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
        onClick={ async() => { 
          
        try {  

        close();
        } 
        catch(e) {
        }
   
        }}
      >
      Continue
      </Button>
      


      </div>   

      
      </div>
    </div>
  
</Modal>

<Modal opened={sendModal} onClose={()=>{ setSendModal(false); setSendSuccess(false); setValue(ZeroAddress);}} title="Transfer your crypto" centered>

<div className={classes.formContainer}>
      <div>
        <h1 className={classes.heading}>Send crypto anywhere</h1>
      </div>
      <p className={classes.subHeading}>
        Send your crypto gas free.
      </p>
      <div className={classes.inputContainer}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                  alignItems: 'center',
                }}
              >
                  <Combobox
                        store={tokenCombobox}
                        withinPortal={false}
                        onOptionSubmit={(val) => {
                          setValue(val);
                          tokenCombobox.closeDropdown();
                        }}
                      >
                        <Combobox.Target>
                          <InputBase
                          style={{width: '50%'}}
                            component="button"
                            type="button"
                            pointer
                            rightSection={<Combobox.Chevron />}
                            onClick={() => tokenCombobox.toggleDropdown()}
                            rightSectionPointerEvents="none"
                            multiline
                          >
                            {selectedToken ? (
                              <TokenOption {...selectedToken} />
                            ) : (
                              <Input.Placeholder>Pick Token</Input.Placeholder>
                            )} 
                          </InputBase>
                        </Combobox.Target>

                        <Combobox.Dropdown>
                          <Combobox.Options>{tokenOptions}</Combobox.Options>
                        </Combobox.Dropdown>
                      </Combobox>

             
                <Input
                  style={{ width: '40%'}}
                  type="number"
                  size='lg'
                  value={tokenValue}
                  onChange={(e: any) => setTokenValue(e?.target?.value)}
                  placeholder="Value"
                  className={classes.input}
                />
                


              </div>
              <Text size="sm" style={{cursor: 'pointer'}} onClick={()=>{ setTokenValue(balance)}}>
              { balanceLoading ? <Skeleton height={15} width={90} mt={6} radius="xl" /> : `Balance: ${balance} ${getTokenInfo(chainId, value)?.label}` } 
              </Text>

              <Input
                  type="string"
                  style={{ marginTop: '20px'}}
                  size='lg'
                  value={sendAddress}
                  onChange={(e: any) => setSendAddress(e?.target?.value)}
                  placeholder="Recipient Address"
                  className={classes.input}
                />

            </div>
            
              <Button
              size="lg" radius="md" 
              style={{marginBottom: '20px'}}
              fullWidth
              color="green"
              className={!sendLoader ? classes.btn : ""}
              onClick={async () => 
                await sendAsset()}
              loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
              disabled= {sendLoader}
              // loading={sendLoader}
            >
              Send Now
            </Button>


    { sendSuccess && <Notification withBorder radius='md' withCloseButton={false}  icon={<IconCheck style={{ width: rem(20), height: rem(20) }} />} color="teal" title="Transfer Successful!" mt="md">
    Your crypto assets have safely landed in the Success Galaxy. Buckle up for a stellar financial journey! 🚀💰
      </Notification>
      }

    
    { sendLoader && <Notification withBorder radius='md' loading={sendLoader} withCloseButton={false}  icon={<IconCheck style={{ width: rem(20), height: rem(20) }} />} color="teal" title="Waiting to confirm" mt="md">
       The transaction have been sent. Wait for the transacion to get confirmed ⌛️
      </Notification>
      }



    { error && <Notification withBorder radius='md' withCloseButton={false}  icon={<IconX style={{ width: rem(20), height: rem(20) }} />}  color="red" title="Transaction Error!" mt="md">
    Oops! Gremlins have invaded your transaction. Please try again later.
      </Notification>
    }
            
    </div>
  
</Modal>

<Modal opened={mintModal} onClose={()=>{ setMintModal(false); setSendSuccess(false); setValue(ZeroAddress);}} title="Mint a sample NFT" centered>

<div className={classes.formContainer}>
      <div>
        <h1 className={classes.heading}>Mint an NFT on your account</h1>
      </div>
      <p className={classes.subHeading}>
      Mint an NFT gas free.
      </p>
      { nftBalance && <div className={classes.inputContainer}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  marginTop: '20px',
                  gap: '20px',
                  alignItems: 'center',
                }}
              >
          
             
              <Indicator inline label={nftBalance.toString()} processing color='green' size={25}>
              <Image
                  src={ SafePassKeyNFT }
                  radius="md"
                  w={150}
              />  
              </Indicator>

              { balanceLoading ? <Skeleton height={15} width={90} mt={6} radius="xl" /> :  <Badge color='green' variant="outline"  radius='lg' size="lg">{`NFT Owned: ${nftBalance}`}</Badge> } 

              </div>  
          </div> 
          }

      { !nftBalance && <div className={classes.inputContainer}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  marginTop: '20px',
                  gap: '20px',
                  alignItems: 'center',
                }}
              >
          
             
              <Image
                  src={ NotFound }
                  radius="md"
                  w={150}
              />  

         <Badge color='red' variant="outline"  radius='lg' size="lg">NO NFT Owned</Badge> 

              </div>  
          </div> 
          }
            
              <Button
              size="lg" radius="md" 
              style={{marginBottom: '20px'}}
              fullWidth
              color="green"
              className={!sendLoader ? classes.btn : ""}
              onClick={async () => 
                await MintNFT()}
              loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
              disabled= {sendLoader}
              // loading={sendLoader}
            >
              Mint Now
            </Button>


    { sendSuccess && <Notification withBorder radius='md' withCloseButton={false}  icon={<IconCheck style={{ width: rem(20), height: rem(20) }} />} color="teal" title="Mint Successful!" mt="md">
    Your NFT has safely landed on yout Safe. Buckle up for a stellar degen journey! 🚀💰
      </Notification>
      }

    
    { sendLoader && <Notification withBorder radius='md' loading={sendLoader} withCloseButton={false}  icon={<IconCheck style={{ width: rem(20), height: rem(20) }} />} color="teal" title="Minting your NFT" mt="md">
       The mint transaction has been sent. Wait for the transacion to get confirmed ⌛️
      </Notification>
      }



    { error && <Notification withBorder radius='md' withCloseButton={false}  icon={<IconX style={{ width: rem(20), height: rem(20) }} />}  color="red" title="Mint Error!" mt="md">
    Oops! Gremlins have invaded your NFT. Please try again later.
      </Notification>
    }
            
    </div>
  
</Modal>

    <Paper className={classes.accountContainer} shadow="md" withBorder radius="md" p="xl" >
      
      <div className={classes.formContainer}>
        <div className={classes.avatarContainer}>
          <img
            className={classes.avatar}
            src= {SafePasskey}
            alt="avatar"
            height={200}
            // width={200}
          />
           <div className={classes.balanceContainer}>
         <Anchor href={`${NetworkUtil.getNetworkById(chainId)?.blockExplorer}/address/${accountDetails.account}`} target="_blank" underline="hover">  <p> { shortenAddress( accountDetails.account ? accountDetails.account : ZeroAddress)}</p>
          </Anchor>
          <CopyButton value={accountDetails.account} timeout={1000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                  <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                    {copied ? (
                      <IconCheck style={{ width: rem(16) }} />
                    ) : (
                      <IconCopy style={{ width: rem(16) }} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            </div>

                   <Combobox
                        store={chainCombobox}
                        withinPortal={false}
                        onOptionSubmit={async (val) => {
                          setChainId(Number(val));
                          chainCombobox.closeDropdown();
                          setWalletProvider(await connectValidator(val, passkey))
                          
                        }}
                      >
                        <Combobox.Target>
                        <Badge
                                pl={0}
                                style={{ cursor: 'pointer', width: '200px', height: '40px', padding: '10px'}} 
                                
                                color="gray"
                                variant="light"
                                leftSection={
                                  <Avatar alt="Avatar for badge" size={24} mr={5} src={getIconForId(chainId)} />
                                }
                                rightSection={
                                  <IconChevronDown size={20} />
                                }
                                size="lg"
                                // className={classes.network}
                                // checked={false}
                                onClick={() => chainCombobox.toggleDropdown()}
                              > 
                                {`${NetworkUtil.getNetworkById(Number(chainId))?.name}`}
                </Badge>
                        </Combobox.Target>

                        <Combobox.Dropdown>
                          <Combobox.Options>{options}</Combobox.Options>
                        </Combobox.Dropdown>
                      </Combobox>


          <p className={classes.balance}>  { balanceLoading ? <Skeleton height={20} width={110} mt={6} radius="xl" /> : `${balance} ${getTokenInfo(chainId, ZeroAddress).label}` }   </p>
          
          
        </div>

        <div className={classes.actionsContainer}>

      
          <div className={classes.actions}>
            <Button size="lg" radius="md"    
              leftSection={<IconPhoto size={25} />} className={classes.btn} color="teal" onClick={()=> setMintModal(true)}>
              Mint
            </Button>
            <Button size="lg" radius="md"
                color={ "#49494f" }
                onClick={()=> setSendModal(true)}
                variant={ "filled" } 
                leftSection={<IconTransfer size={25} />}
                >Send</Button>
          </div>
        </div>
      </div>
    </Paper>
    </>
  );
};