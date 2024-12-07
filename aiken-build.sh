rm offchain/contract/plutus.*
( cd onchain && aiken build --trace-level verbose )
# ( cd onchain && aiken build )
node node_modules/@blaze-cardano/blueprint/dist/cli.js onchain/plutus.json -o offchain/contract/plutus.ts
pnpm run fmtplutus
echo "Done"