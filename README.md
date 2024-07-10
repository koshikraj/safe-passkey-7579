# Safe + ZeroDev PassKey
[![License](https://img.shields.io/badge/license-GPL3-blue.svg)](https://github.com/koshikraj/module-template-7579/blob/main/LICENSE)

Developed using the [module-template-7579](https://github.com/koshikraj/module-template-7579)

## Description

This project is built using the [module-template-7579](https://github.com/koshikraj/module-template-7579) to integrate Passkey validator into Safe Accounts.

## Features

- Uses Rhinestone's [Safe 7579 adapter](https://github.com/rhinestonewtf/safe7579)
- Uses Rhinestone's [module-sdk](https://github.com/rhinestonewtf/module-sdk)
- Integrates with [ZerdoDev's WebAuthn validator](https://github.com/zerodevapp/kernel-7579-plugins/tree/master/validators/webauthn) module
- Uses Permissionless.js 
- Pimlico bundlers and paymasters

## Usage

1. Clone the repository:

    ```bash
    git clone https://github.com/koshikraj/safe-passkey-7579.git
    ```

    Project structure:

    ├── safe-passkey-7579 <br/>
    │   ├── [Safe App](./web)<br/>
    │   └── [Module](./module)


2. Install dependencies

    ```bash
    npm install
    ```

3. Run module tests

    ```bash
    cd module
    npm run test
    ```

4. Run web app

    ```bash
    cd web
    npm run dev


## Contributing

Contributions are welcome! Please follow the [contribution guidelines](CONTRIBUTING.md) to contribute to this project.

## Acknowledgments

This project uses the [ZerdoDev's WebAuthn validator](https://github.com/zerodevapp/kernel-7579-plugins/tree/master/validators/webauthn) module

## License

This project is licensed under the [GPL-3.0 license](./LICENSE).
