# Openverse Wallet Snap

The Openverse Wallet Snap is a MetaMask extension that has Openos capabilities such as public key derivation, transaction signing, message signing.

## Starting the snap

Install the latest version of the Snaps CLI

```bash
npm install -g @metamask/snaps-cli
```

Install the dependencies

```bash
npm install
```

Build and start the local development server

```bash
npm start
```

## Using the snap

The production snap is available as Snap ID `npm:openverse-snap`.

The locally started snap is available as Snap ID `local:http://localhost:8080`.






# RPC Methods

### getPublicKey

Returns the wallet's public key encoded as Base58.

#### Parameters

An object containing:

- `derivationPath` - Derivation paths segments that will be appended to m/44'/501'
- `confirm` - Whether to show a confirm dialog.

#### Returns

Base58 encoded public key.

Example:

```javascript
ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:openverse-snap',
    request: {
      method: 'getPublicKey',
      params: {
        derivationPath: [`0'`, `0'`],
        confirm: true
      }
   }
  }
});
```

### signTransaction

Sign a transaction and return the signature encoded as Base58.

#### Parameters

An object containing:

- `derivationPath` - Derivation paths segments that will be appended to m/44'/501'
- `message` - Transaction message encoded as Base58

#### Returns

An object containing:

- `publicKey` - Base58 encoded public key
- `signature` - Transaction signature encoded as Base58

Example:

```javascript
ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:openverse-snap',
    request: {
      method: 'signTransaction',
      params: {
        derivationPath: [`0'`, `0'`],
        message: '...'
      }
   }
  }
});
```

### signAllTransactions

Sign multiple transactions and return the signatures encoded as Base58.

#### Parameters

An object containing:

- `derivationPath` - Derivation paths segments that will be appended to m/44'/501'
- `messages` - An array of transaction messages encoded as Base58

#### Returns

An object containing:

- `publicKey` - Base58 encoded public key
- `signatures` - An array of transaction signatures encoded as Base58

Example:

```javascript
ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:openverse-snap',
    request: {
      method: 'signAllTransactions',
      params: {
        derivationPath: [`0'`, `0'`],
        messages: ['...', '...']
      }
   }
  }
});
```

### signMessage

Sign a message (can be either arbitrary bytes or a UTF-8 string) and return the signature encoded as Base58.

#### Parameters

An object containing:

- `derivationPath` - Derivation paths segments that will be appended to m/44'/501'
- `message` - Message encoded as Base58
- `display` - How to decode and display the message, `utf8` or `hex`

#### Returns

An object containing:

- `publicKey` - Base58 encoded public key
- `signature` - Message signature encoded as Base58

Example:

```javascript
const bytes = new TextEncoder().encode('Lorem ipsum');
const base58Message = base58.encode(bytes);

ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:openverse-snap',
    request: {
      method: 'signMessage',
      params: {
        derivationPath: [`0'`, `0'`],
        message: base58Message,
        display: 'utf8'
      }
   }
  }
});
```

