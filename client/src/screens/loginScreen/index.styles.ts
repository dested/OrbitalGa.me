import glamorous from 'glamorous';
import {flex} from '../../common/styleUtils';

export const Wrapper = glamorous.div({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
});

export const LoginBox = glamorous.div({
  ...flex,
  flexDirection: 'column',
  borderRadius: 20,
  width: '30vw',
  background: 'rgba(69,84,147,0.5)',
  padding: '1rem',
});

export const Logo = glamorous.span({
  ...flex,
  alignSelf: 'center',
  color: 'white',
  fontSize: '1rem',
});

export const NameBox = glamorous.input({
  ...flex,
  borderRadius: 5,
  background: '#a6f4f4',
  type: 'text',
  color: '#312436',
  fontSize: '39px',
  marginBottom: 20,
  marginTop: 20,
});

export const JoinButton = glamorous.button({
  ...flex,
  flex: 1,
  justifyContent: 'center',
  margin: 5,
  borderRadius: 5,
  background: '#94c7f4',
  color: '#312436',
  fontSize: '39px',
});

export const Status = glamorous.span({
  ...flex,
  color: '#94c7f4',
  fontSize: '39px',
});
