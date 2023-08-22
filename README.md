# Description
Catch is a payment processor that exclusively provides the ability to pay via a bank account EFT.  Catch also allows customers to accumulate store credit, which can be applied on future orders that are paid via Catch.

# Version
## [22.3.0] - Unreleased

## For version history see the [Changelog](CHANGELOG.md)

# Getting Started

1. Clone this repository.
2. Run  `npm install`  to install all of the local dependencies.
3. Run  `npm run compile:js` to compile client-side javascript. (make sure the paths to app_storefront_base is correct in the `package.json` file)
```javascript
"paths": {
    "base": "../storefront-reference-architecture/cartridges/app_storefront_base/"
}
```
4. Run  `npm run compile:scss` to compile scss.
5. Find the __/documentation__ directory within the cloned repository.
6. Follow the SFRA or Site Genesis document (depending on the architecture of your project) to integrate and upload the cartridges, import environment data, and configure site preferences

## Testing & Linting
Use  `npm run test`  to run unit tests
Use  `npm run test:integration`  to run integration tests (make sure you have a `dw.json` file in the root folder and correct Site ID in `it.config.js` file)
Use  `npm run lint`  to run linter

# Documentation
You can find documentation in the documentation folder of the repository:
[Integration Guide SFRA](documentation/Catch%20Integration%20Guide%20for%20SFRA%20v22_2.docx)
[Integration Guide SG](documentation/Catch%20Integration%20Guide%20SG-controllers%20v22_2.docx)
[Cartridge Overview](documentation/Catch%20-%20Cartridge%20overview.docx)
or on Google Drive:
[Integration Guide SFRA](https://docs.google.com/document/d/1CST_zWlO2bYd5IrAsN8rbUZx0-9RaGX_BNRNbxuGphw/edit#)
[Integration Guide SG](https://docs.google.com/document/d/1iIgvSbU2z7w08G8GbBbe0bO1UNi60p78kl6q0AkLRI0/edit#)
[Cartridge overview](https://docs.google.com/document/d/1FIvrvRaYkmHLB2aySPvzDv12xC5Eo6oFhg-6aUTGH14/edit#)

# Contributing

Maintaned by cartridge team, but you can submit a PR for review by team.

## Contacts

[ICDLP team](https://confluence.ontrq.com/display/3PD/Team+Info)
