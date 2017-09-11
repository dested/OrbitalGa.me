import glamorous from 'glamorous';
import {flex} from "../../common/styleUtils";

export const Wrapper = glamorous.div({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect:'none'
});

export const LoginBox = glamorous.div({
    ...flex,
    flexDirection: 'column',
    borderRadius: 5,
    width: '30vw',
    height: '40vh',
    background: '#232746',
    padding: 40,
});


export const Logo = glamorous.span({
    ...flex,
    alignSelf: 'center',
    padding: 20,
    color: 'white',
    fontSize: '39px'
});

export const NameBox = glamorous.input({
    ...flex,
    borderRadius: 5,
    background: '#a6f4f4',
    type: 'text',
    color: '#312436',
    fontSize: '39px'
});

export const JoinButton = glamorous.button({
    ...flex,
    borderRadius: 5,
    background: '#94c7f4',
    color: '#312436',
    fontSize: '39px'
});

export const Status = glamorous.span({
    ...flex,
    color: '#94c7f4',
    fontSize: '39px'
});