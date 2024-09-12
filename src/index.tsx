import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import { Address, formatEther, parseEther } from 'viem'
import { EthMultiVaultAbi } from './EthMultiVaultAbi'
// import { neynar } from 'frog/hubs'
import { createSystem, colors } from 'frog/ui'
import { formatRelative } from 'date-fns'

const { Image, Heading, Text, Box, Rows, Row, VStack, HStack, vars, Column, Columns } = createSystem({
  colors: {
    ...colors.dark,
  },
})

export const app = new Frog({
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: 'i7n.app',
  ui: { vars },
})

app.use('/*', serveStatic({ root: './public' }))

app.frame('/frame/a/:id', async (c) => {
  const id = c.req.param('id')
  const req = await fetch(`https://i7n.app/a/${id}/json`)
  const data = await req.json()
  const { buttonValue, inputText, status } = c

  const totalStaked = (
    parseFloat(formatEther(data.vault.totalShares))
    * parseFloat(formatEther(data.vault.currentSharePrice))
    * data.prices.usd
  ).toFixed(2);

  return c.res({
    title: data.atom.label,
    image: (
      <div
        style={{
          background: 'linear-gradient(to right, #432889, #17101F)',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexWrap: 'nowrap',
          height: '100%',
          width: '100%',
        }}
      >
        {(buttonValue === 'home' || !buttonValue) && <Columns gap="16" grow>
          <Column width="1/2" paddingLeft={'32'}>
            <Image
              src={data.atom.image}
              objectFit="contain"
              height={"100%"}
              width={"100%"}
            />
          </Column>
          <Column width="1/2" justifyContent='center' paddingRight={"32"} >
            <Heading wrap={"balance"}>{data.atom.label}</Heading>
            <Text color="text200" size="20">
              ${totalStaked} ∙ {data.vault.positionCount} holders
            </Text>
          </Column>
        </Columns>}

        {buttonValue === 'holders' && (
          <VStack gap="16" grow padding={"32"}>
            <HStack gap="16">
              <Image
                src={data.atom.image}
                objectFit="contain"
                height={"64"}
                width={"64"}
              />
              <Box>
                <Heading wrap={"balance"}>{data.atom.label}</Heading>
                <Text color="text200" size="20">Top Holders</Text>
              </Box>
            </HStack>


            {data.positions.slice(0, 4).map((position: any) => (
              <HStack gap="8" margin={'0'}>
                {position.accountImage !== null ? <Image
                  src={position.accountImage}
                  objectFit="cover"
                  borderRadius="8"
                  height={"16"}
                  width={"16"}
                /> : <Box borderRadius="8" height={"16"} width={"16"} backgroundColor={'gray'} />}

                <Text>{position.accountLabel}</Text>
                <Text weight='900'>${(parseFloat(formatEther(position.shares)) * parseFloat(formatEther(data.vault.currentSharePrice)) * data.prices.usd).toFixed(2)}</Text>
              </HStack>
            ))}

          </VStack>
        )}

        {buttonValue === 'signals' && (
          <VStack gap="16" grow padding={"32"}>
            <HStack gap="16">
              <Image
                src={data.atom.image}
                objectFit="contain"
                height={"64"}
                width={"64"}
              />
              <Box>
                <Heading wrap={"balance"}>{data.atom.label}</Heading>
                <Text color="text200" size="20">Recent signals</Text>
              </Box>
            </HStack>


            {data.signals.slice(0, 4).map((signal: any) => (
              <HStack gap="8">
                {signal.accountImage !== null ? <Image
                  src={signal.accountImage}
                  objectFit="cover"
                  borderRadius="8"
                  height={"16"}
                  width={"16"}
                /> : <Box borderRadius="8" height={"16"} width={"16"} backgroundColor={'gray'} />}

                <Text>{signal.accountLabel}</Text>
                <Text weight='900'>${(parseFloat(formatEther(signal.delta)) * parseFloat(formatEther(data.vault.currentSharePrice)) * data.prices.usd).toFixed(2)} ∙ {formatRelative(new Date(parseInt(signal.blockTimestamp.toString()) * 1000), new Date())}</Text>
              </HStack>
            ))}

          </VStack>
        )}
      </div>
    ),
    intents: [
      buttonValue === 'holders' ? <Button value="home">Home</Button> : <Button value="holders">Holders</Button>,
      buttonValue === 'signals' ? <Button value="home">Home</Button> : <Button value="signals">Signals</Button>,
      <Button.Transaction target={`/deposit/${id}`}>Deposit</Button.Transaction>,
    ],
  })
})

app.transaction('/deposit/:id', (c) => {
  const id = BigInt(c.req.param('id'));
  const address = c.address as Address;
  // Contract transaction response.
  return c.contract({
    abi: EthMultiVaultAbi,
    chainId: 'eip155:8453',
    functionName: 'depositAtom',
    args: [address, id],
    to: '0x430BbF52503Bd4801E51182f4cB9f8F534225DE5',
    value: parseEther('0.00042')
  })
})

const port = 3000
console.log(`Server is running on port ${port}`)

devtools(app, { serveStatic })

serve({
  fetch: app.fetch,
  port,
})

