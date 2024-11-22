import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Heading, Text, Copyable, Divider, Bold } from '@metamask/snaps-sdk/jsx';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { SLIP10Node } from '@metamask/key-tree';
/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */


export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  const dappOrigin = (request?.params as { origin?: string }).origin || origin;
  const dappHost = (new URL(dappOrigin))?.host;

  // if (
  //   !dappHost ||
  //   (
  //     !dappHost.match(/^https:\/\/(?:\S+\.)?openverse\.network$/) &&
  //     !dappHost.match(/^https:\/\/(?:\S+\.)?openverse\.live$/)
  //   )
  // ) {
  //   throw new Error('Invalid origin');
  // }

  switch (request.method) {

    case 'getPublicKey': {
      const { derivationPath, confirm = false } = request.params;
      assertIsBoolean(confirm);

      const keyPair = await deriveKeyPair(derivationPath);

      const pubkey = bs58.encode(keyPair.publicKey);

      if (confirm) {
        const accepted = await renderGetPublicKey(dappHost, pubkey);
        assertConfirmation(accepted);
      }

      return pubkey;
    }
    case 'signTransaction': {
      const { derivationPath, message } = request.params;
      assertInput(message);
      assertIsString(message);

      const keyPair = await deriveKeyPair(derivationPath);

      const accepted = await renderSignTransaction(dappHost, message);
      assertConfirmation(accepted);

      const signature = nacl.sign.detached(bs58.decode(message), keyPair.secretKey);

      return {
        publicKey: bs58.encode(keyPair.publicKey),
        signature: bs58.encode(signature)
      };
    }
    case 'signAllTransactions': {
      const { derivationPath, messages } = request.params;
      assertInput(messages);
      assertIsArray(messages);
      assertInput(messages.length);
      assertAllStrings(messages);

      const keyPair = await deriveKeyPair(derivationPath);

      const accepted = await renderSignAllTransactions(dappHost, messages);
      assertConfirmation(accepted);

      const signatures = messages
        .map((message: string) => bs58.decode(message))
        .map((message: Uint8Array) => nacl.sign.detached(message, keyPair.secretKey))
        .map((signature: Uint8Array | number[]) => bs58.encode(signature));

      return {
        publicKey: bs58.encode(keyPair.publicKey),
        signatures
      };
    }
    case 'signMessage': {
      const { derivationPath, message, display = 'utf8' } = request.params;
      assertInput(message);
      assertIsString(message);
      assertIsString(display);

      const keyPair = await deriveKeyPair(derivationPath);

      const messageBytes = bs58.decode(message);

      let decodedMessage = '';
      if (display.toLowerCase() === 'utf8') {
        decodedMessage = (new TextDecoder()).decode(messageBytes);
      } else if (display.toLowerCase() === 'hex') {
        decodedMessage = `0x${Array.prototype.map.call(messageBytes, (x) => (`00${x.toString(16)}`).slice(-2)).join('')}`;
      } else {
        decodedMessage = 'Unable to decode message';
      }

      const accepted = await renderSignMessage(dappHost, decodedMessage);
      assertConfirmation(accepted);

      const signature = nacl.sign.detached(messageBytes, keyPair.secretKey);

      return {
        publicKey: bs58.encode(keyPair.publicKey),
        signature: bs58.encode(signature)
      };
    }
    default:
      throw {
        code: 4200,
        message: 'The requested method is not supported.'
      };
  }
};
function renderGetPublicKey(host: string, pubkey: string) {
  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: (
        <Box>
          <Heading>Confirm access</Heading>
          <Text>{host}</Text>
          <Divider />
          <Text>{pubkey}</Text>
        </Box>
      )
    }
  });
}

function renderSignTransaction(host: string, message: string) {
  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: (
        <Box>
          <Heading>Sign transaction</Heading>
          <Text>{host}</Text>
          <Divider />
          <Text>{message}</Text>
        </Box>
      )
    }
  });
}

function renderSignAllTransactions(host: string, messages: any) {
  if (messages.length === 1) {
    return renderSignTransaction(host, messages[0]);
  }

  const uiElements = [];

  for (let i = 0; i < messages.length; i++) {
    uiElements.push(<Divider />);
    // uiElements.push(Text(`Transaction ${i + 1}`));
    uiElements.push(<Text>Transaction {(i + 1).toString()}</Text>);
    // uiElements.push(Copyable(messages[i]));
    uiElements.push(<Copyable value={messages[i]}></Copyable>);
  }

  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content:
        (
          <Box>
            <Heading>Sign transactions</Heading>
            <Text>{host}</Text>
            {uiElements}
          </Box>
        )
      // Box([
      //   Heading('Sign transactions'),
      //   Text(host),
      //   ...uiElements
      // ])
    }
  });
}

function renderSignMessage(host: string, message: string) {
  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: (
        <Box>
          <Heading>Sign message</Heading>
          <Text>{host}</Text>
          <Divider />
          <Text>{message}</Text>
        </Box>
      )
      //  Box([
      //   Heading('Sign message'),
      //   Text(host),
      //   Divider(),
      //   Copyable(message)
      // ])
    }
  });
}

function assertInput(path: any) {
  if (!path) {
    throw {
      code: -32000,
      message: 'Invalid input.'
    };
  }
}

function assertAllStrings(input: any[]) {
  if (!Array.isArray(input) || !input.every((item) => typeof item === 'string')) {
    throw {
      code: -32000,
      message: 'Invalid input.'
    };
  }
}

function assertIsArray(input: any) {
  if (!Array.isArray(input)) {
    throw {
      code: -32000,
      message: 'Invalid input.'
    };
  }
}

function assertIsString(input: any) {
  if (typeof input !== 'string') {
    throw {
      code: -32000,
      message: 'Invalid input.'
    };
  }
}

function assertIsBoolean(input: any) {
  if (typeof input !== 'boolean') {
    throw {
      code: -32000,
      message: 'Invalid input.'
    };
  }
}

function assertConfirmation(confirmed: any) {
  if (!confirmed) {
    throw {
      code: 4001,
      message: 'User rejected the request.'
    };
  }
}

function isValidSegment(segment: string) {
  if (typeof segment !== 'string') {
    return false;
  }

  if (!segment.match(/^[0-9]+'$/)) {
    return false;
  }

  const index = segment.slice(0, -1);

  if (parseInt(index).toString() !== index) {
    return false;
  }

  return true;
}

async function deriveKeyPair(path: any) {
  assertIsArray(path);
  assertInput(path.length);
  assertInput(path.every((segment: any) => isValidSegment(segment)));

  const rootNode = await snap.request({
    method: 'snap_getBip32Entropy',
    params: {
      path: [`m`, `44'`, `501'`],
      curve: 'ed25519'
    }
  });

  const node = await SLIP10Node.fromJSON(rootNode);
  const keypair = await node.derive(path.map((segment: any) => `slip10:${segment}`));
  if (!keypair.privateKeyBytes) {
    throw new Error('Failed to derive key pair: private key bytes are undefined');
  }
  return nacl.sign.keyPair.fromSeed(Uint8Array.from(keypair.privateKeyBytes));
}
