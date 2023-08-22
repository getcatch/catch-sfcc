# Description
Catch helps merchants [drive customer retention and loyalty](https://www.getcatch.com/for-merchants) while giving consumers a new and rewarding way to pay. Merchants partner with Catch to foster higher repeat rates, purchase frequency, and engagement across your customer base, including from new-to-file customers.

Use Catch's official Salesforce Commerce Cloud cartridge to add Catch to your storefront.

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
Use  `npm run test`  to run unit tests.
Use  `npm run test:integration`  to run integration tests (make sure you have a `dw.json` file in the root folder and correct Site ID in `it.config.js` file).
Use  `npm run lint`  to run linter.

# Documentation
For background on Catch and the high-level set-up of our SFCC integration, review our [integration overview](https://catch.readme.io/reference/salesforce-commerce-cloud-integration).

For information on installing and configuring this cartridge, check out the files in the documentation folder of this repository:
[Cartridge Overview](documentation/Catch%20-%20Cartridge%20overview.docx)
[Integration Guide for SFRA](documentation/Catch%20Integration%20Guide%20for%20SFRA%20v22_2.docx)
[Integration Guide for SiteGenesis](documentation/Catch%20Integration%20Guide%20SG-controllers%20v22_2.docx)

or on Google Drive:
[Cartridge overview](https://docs.google.com/document/d/1FIvrvRaYkmHLB2aySPvzDv12xC5Eo6oFhg-6aUTGH14/edit#)
[Integration Guide SFRA](https://docs.google.com/document/d/1CST_zWlO2bYd5IrAsN8rbUZx0-9RaGX_BNRNbxuGphw/edit#)
[Integration Guide SG](https://docs.google.com/document/d/1iIgvSbU2z7w08G8GbBbe0bO1UNi60p78kl6q0AkLRI0/edit#)


# Contact & contributions
Catch maintains this official cartridge. If you have feedback or requests, please contact merchant-support@getcatch.com.
