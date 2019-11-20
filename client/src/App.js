import React from "react";
import { ethers } from 'ethers';
import getWeb3 from './utils/getWeb3';
import { ThemeProvider } from 'styled-components';
import { theme, Box, Card } from 'rimble-ui';
import { NavLink } from 'react-router-dom';
import { Nav } from 'react-bootstrap';

import NetworkIndicator from '@rimble/network-indicator';
import ConnectionBanner from '@rimble/connection-banner';

import Validator from './components/validator';

import Header from './components/header.js';
// Contract's ABI
import CoffeeHandler from "./contracts/CoffeeHandler.json";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import "./App.css";
import { sign } from "crypto";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      requiredNetwork: 4,
    }
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3Provider = await getWeb3();

      // Use web3 to get the user's accounts.
      const signer = await web3Provider.getSigner();
      // Get the contract instance.
      const network = await web3Provider.getNetwork();

      const contractAddress = "0x827c798F2c236388667d7B5253b1d5d31fE4cB12";
      let contract = new ethers.Contract(
        contractAddress,
        CoffeeHandler.abi,
        web3Provider
      ).connect(signer);

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        networkId: network.chainId,
        web3Provider,
        signer,
        contract,
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      console.error(error);
    }
  }

  Links = () => (
    <Nav>
      <NavLink activeStyle={{
        fontWeight: "bold",
        color: "red"
      }} to="/validator">Validator</NavLink>
      <NavLink activeStyle={{
        fontWeight: "bold",
        color: "red"
      }} to="/producer">Producer</NavLink>
    </Nav>
  )

  ValidatorComponent = ({ signer, web3Provider, contract }) =>
    <Validator signer={signer} web3={web3Provider} contract={contract} />
  render() {

    if (!this.state.contract) {
      return (<div>Loading...</div>);
    }

    return (
      <ThemeProvider theme={theme}>
        <Router>
          <div>
            <Header />
            <Box maxWidth={'640px'} mx={'auto'} p={3}>
              <this.Links />
              <Card>
                <NetworkIndicator currentNetwork={this.state.networkId}
                  requiredNetwork={this.state.requiredNetwork} />
                <ConnectionBanner
                  currentNetwork={this.state.networkId}
                  requiredNetwork={this.state.requiredNetwork}
                  onWeb3Fallback={window.ethereum == null} />
              </Card>
            </Box>

            <Route exact path="/validator"
              component={() => this.ValidatorComponent(this.state)} />
          </div>
        </Router>
      </ThemeProvider>
    );
  }
}

export default App;
