import { Card, Text } from 'rimble-ui';
import React from 'react';

class Validator extends React.Component {
    constructor(props) {
        super(props);
        const { account } = props;
        this.state = {
            account,
        };
    }

    componentDidMount = async () => {

    }

    render() {
        return (
            <div>
                <Card>
                    <Text child={`You have ${0} staked.`} />
                </Card>
            </div>
        );
    }
}

export default Validator;