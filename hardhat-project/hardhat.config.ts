import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    localhost: {
      url: "http://39.102.214.160:8545",
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};

export default config;
