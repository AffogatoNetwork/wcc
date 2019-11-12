import React from 'react';
import { Button, Box, Card, Text, Heading } from 'rimble-ui';

class Validator extends React.Component {
    constructor(props) {
        super(props);
        const { account, web3, contract } = props;
        this.state = {
            contract,
            account,
            web3
        };
    }

    // componentDidMount = async () => {
    //     const { web3, account, contract } = this.state;
    //     const staked = await contract.userToStake.call(account, { from: account });
    //     this.setState({
    //         staked,
    //     });
    // }

    render() {
        const { staked } = this.state;
        return (
            <Box>
                <div>
                    <Card width="420"
                        alignItems={"center"}>
                        <Heading.h2>You have - staked.</Heading.h2>
                        <Button>Stake DAI</Button>
                    </Card>
                </div>
            </Box>
        );
    }
}

export default Validator;