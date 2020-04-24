import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {stores} from './store/stores';
import {Provider} from 'mobx-react';
import {ApolloProvider} from 'react-apollo-hooks';
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
