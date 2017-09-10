import * as React from 'react';
import {JoinButton, LoginBox, Logo, NameBox, Status, Wrapper} from "./gameUI.styles";
import {GameManager} from "../../game/gameManager";
import GameBoard from "../gameBoard/gameBoard";

interface State {
    name: string;
    connectStatus: 'none' | 'fail' | 'connecting' | 'joining' | 'joined';
}

export default class GameUI extends React.Component<{}, State> {
    constructor() {
        super();
        this.state = {
            name: '',
            connectStatus: 'none'
        }
    }


    updateName(name: string): void {
        this.setState({name});
    }

    private join() {

        this.setState({connectStatus: 'connecting'});

        GameManager.instance.joinGame(this.state.name, (status) => {
            this.setState({connectStatus: status});
        });
    }

    render() {
        let {connectStatus} = this.state;
        return (
            connectStatus !== 'joined' ?
                <Wrapper>
                    <LoginBox>
                        <Logo>Orbital</Logo>
                        <NameBox value={this.state.name} onChange={(e: any) => this.updateName(e.target.value)}/>
                        {
                            connectStatus === 'none' && <JoinButton onClick={() => this.join()}>Join</JoinButton> ||
                            connectStatus === 'connecting' && <Status>Connecting...</Status> ||
                            connectStatus === 'joining' && <Status>Joining...</Status>
                        }
                    </LoginBox>
                </Wrapper>
                :
                <GameBoard/>
        );
    }

}
