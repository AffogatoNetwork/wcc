import React from 'react';
import { Button, Box, Card, Text, Heading, Input, Flex } from 'rimble-ui';
import { FormControl, InputGroup, Modal } from 'react-bootstrap';

import { ethers } from 'ethers';

class Validator extends React.Component {
    constructor(props) {
        super(props);
        const { signer, web3Provider, contract } = props;
        this.state = {
            contract,
            signer,
            web3Provider,
            showStakeModal: false,
            showMintModal: false
        };
    }

    componentDidMount = async () => {
        const { web3Provider, signer, contract } = this.state;
        const address = await signer.getAddress();

        const staked = await contract.userToStake(address);

        this.setState({
            staked,
        });
    }

    handleMintClick = (event) => {
        event.preventDefault();

        this.setState({
            showMintModal: true,
            showStakeModal: false
        })
    }

    handleStakeClick = (event) => {
        event.preventDefault();

        this.setState({
            showMintModal: false,
            showStakeModal: true
        })
    }

    handleStakeSubmitClick = async (event) => {
        event.preventDefault();
        const { web3Provider, contract, daiAmount } = this.state;
        const tx = await contract.stakeDAI(ethers.utils.bigNumberify(daiAmount), { gasLimit: 23000 });
        tx.wait();
    }

    handleStakeDaiChanged = (event) => {
        const daiAmount = event.currentTarget.value;
        this.setState({ daiAmount });
    }

    handleWCCAddressChange = (event) => {
        const wccAddress = event.currentTarget.value;
        //TODO: Validate the address
        this.setState({ wccAddress });
    }

    handleSetWCCAddress = async () => {
        const { wccAddress, contract } = this.state;
        console.log(`new wcc => ${wccAddress}`);
        try {
            const tx = await contract.setWCCContract(wccAddress, { gasLimit: 23000 });
            tx.wait();
            console.log(tx);
        } catch(e) {
            console.error(e);
        }
    }

    render() {
        const { staked, showMintModal, showStakeModal } = this.state;
        return (
            <Flex flexDirection={"column"} alignItems={"center"}>
                <Modal show={showStakeModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Stake some DAI</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <InputGroup className="mb-3">
                            <FormControl
                                id="daiAmount"
                                required
                                placeholder="50"
                                onChange={this.handleStakeDaiChanged}
                                type="number"
                                aria-label="Amount"
                                aria-describedby="basic-addon1" />
                            <FormControl.Feedback type="invalid">Please enter a valid amount</FormControl.Feedback>
                            <InputGroup.Append>
                                <InputGroup.Text id="basic-addon1">DAI</InputGroup.Text>
                            </InputGroup.Append>
                        </InputGroup>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.handleModalClose}>
                            Cancel
                            </Button>
                        <Button variant="primary" onClick={this.handleStakeSubmitClick}>
                            Donate
                            </Button>
                    </Modal.Footer>
                </Modal>
                <Card
                    width={1 / 2}
                    alignItems={"center"}>
                    <Flex justifyContent={"center"} flexDirection={"column"}>
                        <Heading.h3>{`You have ${staked || "-"} staked.`}</Heading.h3>
                        <Button onClick={this.handleStakeClick}>Stake DAI</Button>
                        <br></br>
                        <Button onClick={this.handleMintClick}>Mint</Button>
                    </Flex>
                </Card>
                <br />

                <Card
                    width={1 / 2}
                    alignItems={"center"}>
                    <Flex justifyContent={"center"} flexDirection={"column"}>
                        <Heading.h3>{"Update WCC Address"}</Heading.h3>
                        <Input type="text"
                            required={true}
                            placeholder="e.g. 0xAc03BB73b6a9e108530AFf4Df5077c2B3D481e5A"
                            onChange={this.handleWCCAddressChange} />
                        <Button onClick={this.handleSetWCCAddress}>Set</Button>
                    </Flex>
                </Card>
            </Flex>
        );
    }
}

export default Validator;