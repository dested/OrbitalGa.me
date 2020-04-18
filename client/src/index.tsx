import ApolloClient from 'apollo-boost';
import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {GameScreen} from './screens/gameScreen';
import {stores, useStores} from './store/stores';
import {observer, Provider} from 'mobx-react';
import {unreachable} from '@common/utils/unreachable';
import {LoadingScreen} from './screens/loadingScreen';
import {LoginScreen} from './screens/loginScreen';
import {StarBackground} from './components/starBackground';
import {ApolloProvider} from 'react-apollo-hooks';
import {ClientConfig} from './clientConfig';
import {uiStore} from './store/uiStore';
import {App} from './app';
import {apolloClient} from './schema/apolloClient';

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <Provider {...stores}>
        <App />
      </Provider>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
