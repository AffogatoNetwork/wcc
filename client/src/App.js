import React from "react";
import getWeb3 from './utils/getWeb3';
import TokenHandler from "./contracts/CoffeeHandler.json";
import { ThemeProvider } from 'styled-components';
import { theme, Box, Card } from 'rimble-ui';
import { NavLink } from 'react-router-dom';
import { Nav } from 'react-bootstrap';

import NetworkIndicator from '@rimble/network-indicator';
import ConnectionBanner from '@rimble/connection-banner';

import Header from './components/header.js';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import "./App.css";

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
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = TokenHandler.networks[networkId];
      console.log(`network id => ${networkId}`)
      this.setState({
        networkId: networkId
      });

      const contract = new web3.eth.Contract(
        TokenHandler.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const context = this;
      window.ethereum.on('accountsChanged', function (accounts) {
        context.setState({ account: accounts[0].toLowerCase() });
      })

      const owner = await contract.methods.owner().call();
      console.log(owner);
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        web3,
        account: accounts[0].toLowerCase(),
        contract,
        owner: owner.toLowerCase(),
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

  render() {
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
                  onWeb3Fallback={window.ethereum == null}/>
              </Card>
            </Box>
          </div>
        </Router>
      </ThemeProvider>
    );
  }
}

export default App;
